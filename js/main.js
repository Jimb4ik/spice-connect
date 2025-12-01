/**
 * Main Dashboard JavaScript for Lumina
 * Handles Activity Feed, Quick Stats, Top Members, Friends Online, Recent Visitors, Photo Votes
 */

class MainDashboard {
    constructor() {
        this.sessionId = null;
        this.currentUser = null;
        this.refreshInterval = null;
    }

    async init() {
        // Check authentication
        if (!window.authManager || !window.authManager.isLoggedIn) {
            console.error('[MAIN] User not authenticated, redirecting...');
            window.location.href = 'index.html';
            return;
        }

        this.sessionId = window.authManager.sessionId;
        this.currentUser = window.authManager.currentUser;
        
        if (!this.sessionId) {
            console.error('[MAIN] No session ID available');
            return;
        }

        // Initialize all sections
        await this.loadAllSections();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up auto-refresh for online status
        this.startAutoRefresh();
    }

    async loadAllSections() {
        // Load sections in parallel for better performance
        const promises = [
            this.loadQuickStats(),
            this.loadActivityFeed(),
            this.loadTopMembers(2), // Default to women
            this.loadOnlineFriends(),
            this.loadRecentVisitors(),
            this.loadPhotoVotes(),
            this.loadGiftNotifications()
        ];

        try {
            await Promise.allSettled(promises);
        } catch (error) {
            console.error('[MAIN] Error loading sections:', error);
        }
    }

    async loadQuickStats() {
        try {
            // Get online status and message count
            const onlineResponse = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/online&method=GET&session_id=${this.sessionId}`);
            const onlineData = await onlineResponse.json();
            
            if (onlineData.success && onlineData.data?.result) {
                const result = onlineData.data.result;
                
                // Update new messages count
                const newMessages = result.nb_new_message || 0;
                const msgCountEl = document.getElementById('newMessagesCount');
                if (msgCountEl) msgCountEl.textContent = newMessages;
                
                // Update message badge in header
                const messagesBadge = document.getElementById('messagesBadge');
                if (messagesBadge) {
                    messagesBadge.textContent = newMessages;
                    messagesBadge.style.display = newMessages > 0 ? 'flex' : 'none';
                }
            }
            
            // Mock data for profile views and photo votes
            const profileViewsElement = document.getElementById('profileViewsCount');
            if (profileViewsElement) {
                profileViewsElement.textContent = Math.floor(Math.random() * 50) + 10;
            }
            
            const photoVotesElement = document.getElementById('photoVotesCount');
            if (photoVotesElement) {
                photoVotesElement.textContent = Math.floor(Math.random() * 20) + 5;
            }
            
        } catch (error) {
            console.error('[MAIN] Error loading quick stats:', error);
        }
    }

    async loadActivityFeed() {
        try {
            const [wallResponse, activitiesResponse, matches, giftNotifications] = await Promise.all([
                fetch(`/api/spice-multi-test?endpoint=/index_api/wall&method=POST&session_id=${this.sessionId}`),
                fetch(`/api/spice-multi-test?endpoint=/ajax_api/getActivities&method=GET&session_id=${this.sessionId}`),
                window.MatchUtils ? window.MatchUtils.loadUserMatches() : Promise.resolve([]),
                this.loadGiftNotificationsData()
            ]);
            
            const wallData = await wallResponse.json();
            const activitiesData = await activitiesResponse.json();
            
            const feedContainer = document.getElementById('activityFeed');
            
            let allActivities = [];
            
            // Wall API data
            if (wallData.success && wallData.data?.result) {
                const wallActivities = Object.values(wallData.data.result);
                allActivities = wallActivities.map(activity => ({
                    ...activity,
                    type: this.getActivityType(activity.action)
                }));
            }
            
            // Activities API data
            if (activitiesData.success && activitiesData.data) {
                const activities = activitiesData.data;
                
                if (activities.wall_online) {
                    allActivities.push({
                        type: 'new_member',
                        pseudo: activities.wall_online.pseudo,
                        date_action: activities.wall_online.date_cnx,
                        user_id: activities.wall_online.id,
                        photos: activities.wall_online.photos
                    });
                }
                
                if (activities.wall_change) {
                    allActivities.push({
                        type: 'profile_update',
                        pseudo: activities.wall_change.pseudo,
                        date_action: activities.wall_change.date_modification,
                        user_id: activities.wall_change.id,
                        photos: activities.wall_change.photos
                    });
                }
                
                if (activities.wall_friends) {
                    allActivities.push({
                        type: 'new_friendship',
                        pseudo1: activities.wall_friends.pseudo1,
                        pseudo2: activities.wall_friends.pseudo2,
                        date_action: activities.wall_friends.date,
                        user_id1: activities.wall_friends.id1,
                        user_id2: activities.wall_friends.id2,
                        photos: activities.wall_friends.photos
                    });
                }
            }
            
            // Matches
            if (matches && matches.length > 0) {
                const recentMatches = matches.slice(0, 5);
                const matchActivities = recentMatches.map(match => ({
                    type: 'match',
                    pseudo: match.matched_user_name,
                    date_action: match.match_date,
                    matched_user_id: match.matched_user_id,
                    matched_user_photos: match.matched_user_photos,
                    is_new: !match.is_read
                }));
                allActivities = [...matchActivities, ...allActivities];
            }
            
            // Gift notifications
            if (giftNotifications && giftNotifications.length > 0) {
                const recentGifts = giftNotifications.slice(0, 10);
                const giftActivities = recentGifts.map(notification => ({
                    type: 'gift_received',
                    title: notification.title,
                    message: notification.message,
                    date_action: notification.created_at,
                    related_user_id: notification.related_user_id,
                    related_gift_id: notification.related_gift_id,
                    is_new: !notification.is_read,
                    notification_id: notification.id
                }));
                allActivities = [...giftActivities, ...allActivities];
            }
            
            allActivities.sort((a, b) => new Date(b.date_action) - new Date(a.date_action));
            
            const displayActivities = allActivities.slice(0, 15);
            
            if (displayActivities.length === 0) {
                feedContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12 text-slate-500">
                        <svg class="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p>Community activity will appear here</p>
                    </div>`;
                return;
            }

            const feedHTML = displayActivities.map(activity => {
                return this.createEnhancedActivityItem(activity);
            }).join('');

            feedContainer.innerHTML = feedHTML;
            
        } catch (error) {
            console.error('[MAIN] Error loading activity feed:', error);
            document.getElementById('activityFeed').innerHTML = '<div class="p-8 text-center text-red-400 bg-red-500/10 rounded-xl">Failed to load activities</div>';
        }
    }

    getActivityType(action) {
        switch (action) {
            case 'birthday': return 'birthday';
            case 'visite': return 'visit';
            case 'con': return 'connection';
            default: return 'general';
        }
    }

    // Utility to get photo URL (kept for potential future use, currently we focus on text/avatars)
    getPhotoUrl(user) {
        let photoUrl = null;
        if (user.photos_v2) {
            if (user.photos_v2.public && typeof user.photos_v2.public === 'object') {
                const publicPhotos = user.photos_v2.public;
                const firstPhotoKey = Object.keys(publicPhotos)[0];
                if (firstPhotoKey && publicPhotos[firstPhotoKey]) {
                    const photo = publicPhotos[firstPhotoKey];
                    photoUrl = photo.sq_430 || photo.normal || photo.sq_middle || photo.url_big;
                }
            } else if (Array.isArray(user.photos_v2) && user.photos_v2.length > 0) {
                const mainPhoto = user.photos_v2.find(p => p.num === 0 || p.is_main === 1) || user.photos_v2[0];
                photoUrl = mainPhoto.sq_430 || mainPhoto.normal || mainPhoto.sq_middle || mainPhoto.url_big;
            }
        } 
        if (!photoUrl && user.photos && Array.isArray(user.photos) && user.photos.length > 0) {
            const firstPhoto = user.photos[0];
            photoUrl = firstPhoto.url_big || firstPhoto.normal || firstPhoto.sq_430 || firstPhoto.sq_middle || firstPhoto.url_middle;
        }
        if (!photoUrl) {
            photoUrl = user.picture_430 || user.picture || user.photo_profil_url || 
                      user.photo_profil || user.photo || user.avatar || user.pic || 
                      user.image || user.main_photo;
        }
        if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('//')) {
            if (photoUrl.startsWith('/')) {
                photoUrl = 'https://dev2018.de5a7.com' + photoUrl;
            } else {
                photoUrl = 'https://dev2018.de5a7.com/' + photoUrl;
            }
        }
        return photoUrl;
    }
    
    getPhotoUrlFromPhotoData(photo) {
        let photoUrl = null;
        if (photo.sq_430) photoUrl = photo.sq_430;
        else if (photo.normal) photoUrl = photo.normal;
        else if (photo.sq_middle) photoUrl = photo.sq_middle;
        else if (photo.url_big) photoUrl = photo.url_big;
        else if (photo.url_middle) photoUrl = photo.url_middle;
        
        if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('/')) {
            photoUrl = 'https://dev2018.de5a7.com/' + photoUrl;
        }
        return photoUrl;
    }

    createEnhancedActivityItem(activity) {
        const timeAgo = this.formatTimeAgo(activity.date_action);
        
        // Generate consistent avatar color based on name
        const firstLetter = (activity.pseudo || activity.pseudo1 || 'U').charAt(0).toUpperCase();
        const colors = [
            'from-purple-500 to-indigo-500',
            'from-pink-500 to-rose-500',
            'from-amber-500 to-orange-500',
            'from-emerald-500 to-teal-500',
            'from-blue-500 to-cyan-500'
        ];
        const colorIndex = firstLetter.charCodeAt(0) % colors.length;
        const bgGradient = colors[colorIndex];
        
        let content = '';
        let icon = '';

        switch (activity.type) {
            case 'birthday':
                content = `<span class="font-semibold text-white">${activity.pseudo}</span> is celebrating their birthday!`;
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-pink-500"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>';
                break;
            case 'visit':
                content = `<span class="font-semibold text-white">${activity.pseudo}</span> visited your profile`;
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
                break;
            case 'connection':
                content = `<span class="font-semibold text-white">${activity.pseudo}</span> came online`;
                icon = '<span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>';
                break;
            case 'new_member':
                content = `<span class="font-semibold text-white">${activity.pseudo}</span> joined Lumina`;
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'; // Using simple cross for generic icon or maybe user plus
                // Changing to User Plus icon
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>';
                break;
            case 'profile_update':
                content = `<span class="font-semibold text-white">${activity.pseudo}</span> updated their profile`;
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
                break;
            case 'new_friendship':
                content = `<span class="font-semibold text-white">${activity.pseudo1}</span> and <span class="font-semibold text-white">${activity.pseudo2}</span> became friends`;
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
                break;
            case 'match':
                content = `It's a match! You and <span class="font-semibold text-white">${activity.pseudo}</span> liked each other`;
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="text-red-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
                break;
            case 'gift_received':
                content = activity.title || 'You received a gift!';
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-pink-600"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>';
                break;
            default:
                content = `<span class="font-semibold text-white">${activity.pseudo}</span> was active`;
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>';
        }

        return `
            <div class="flex items-start space-x-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-900/20">
                    ${firstLetter}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-300">
                        ${content}
                    </p>
                    <p class="text-xs text-slate-500 mt-1 flex items-center">
                        <span class="mr-2">${icon}</span>
                        ${timeAgo}
                        ${activity.zone_name ? `<span class="mx-1">•</span> ${activity.zone_name}` : ''}
                    </p>
                </div>
            </div>
        `;
    }

    async loadTopMembers(gender = 2) {
        try {
            const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/topmembers&method=POST&session_id=${this.sessionId}&sex=${gender}&age_range=18-65&page=0&is_photo=1`);
            const data = await response.json();
            
            const listContainer = document.getElementById('topMembersList');
            
            if (data.success && data.data?.result && Array.isArray(data.data.result)) {
                const filteredMembers = data.data.result.filter(member => 
                    member.pseudo && member.pseudo.toLowerCase() !== 'test'
                );
                const members = filteredMembers.slice(0, 5);
                
                if (members.length === 0) {
                    listContainer.innerHTML = '<div class="text-center p-4 text-slate-500">No top members found</div>';
                    return;
                }
                
                const membersHTML = members.map((member, index) => {
                    const photoUrl = this.getPhotoUrl(member);
                    const age = member.age || '--';
                    const location = member.ville || member.region || 'Unknown';
                    const firstLetter = (member.pseudo || 'U').charAt(0).toUpperCase();
                    
                    return `
                        <div class="relative group cursor-pointer" onclick="viewUserProfile('${member.id || member.id_membre}', '${member.pseudo || 'Anonymous'}')">
                            <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 relative">
                                ${photoUrl ? 
                                    `<img src="${photoUrl}" alt="${member.pseudo}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
                                    : ''}
                                <div class="${photoUrl ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-slate-800 text-slate-600 text-4xl font-bold">
                                    ${firstLetter}
                                </div>
                                <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
                                <div class="absolute top-2 left-2 bg-brand-primary text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                                    #${index + 1}
                                </div>
                                <div class="absolute bottom-0 left-0 w-full p-3">
                                    <h4 class="text-white font-bold truncate">${member.pseudo || 'Anonymous'}</h4>
                                    <p class="text-xs text-slate-300 flex items-center">
                                        <span>${age}</span>
                                        <span class="mx-1">•</span>
                                        <span class="truncate">${location}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                listContainer.innerHTML = `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">${membersHTML}</div>`;
                
            } else {
                listContainer.innerHTML = '<div class="text-center p-4 text-slate-500">No top members available</div>';
            }
            
        } catch (error) {
            console.error('[MAIN] Error loading top members:', error);
            document.getElementById('topMembersList').innerHTML = '<div class="text-center p-4 text-red-400">Failed to load members</div>';
        }
    }

    async loadOnlineFriends() {
        try {
            const response = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/load_contacts&method=GET&session_id=${this.sessionId}&filter=3`);
            const data = await response.json();
            
            const listContainer = document.getElementById('onlineFriendsList');
            
            if (data.success && data.data) {
                const friends = data.data.contacts || data.data.result || [];
                
                if (!Array.isArray(friends) || friends.length === 0) {
                    listContainer.innerHTML = '<p class="text-slate-500 text-sm">No friends online</p>';
                    return;
                }
                
                const displayFriends = friends.slice(0, 8);
                
                const friendsHTML = displayFriends.map(friend => {
                    const photoUrl = this.getPhotoUrl(friend);
                    const isOnline = friend.is_online === 1 || friend.is_online === '1';
                    const firstLetter = (friend.pseudo || 'U').charAt(0).toUpperCase();
                    
                    return `
                        <div class="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onclick="viewUserProfile('${friend.id}', '${friend.pseudo}')">
                            <div class="relative">
                                <div class="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-slate-300 font-bold border-2 border-slate-600">
                                    ${photoUrl ? `<img src="${photoUrl}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                                    <span class="${photoUrl ? 'hidden' : 'block'}">${firstLetter}</span>
                                </div>
                                ${isOnline ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>' : ''}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-white truncate">${friend.pseudo || 'Anonymous'}</p>
                                <p class="text-xs text-slate-400">${friend.age || '--'} years</p>
                            </div>
                        </div>
                    `;
                }).join('');
                
                listContainer.innerHTML = `<div class="space-y-2">${friendsHTML}</div>`;
                
            } else {
                listContainer.innerHTML = '<p class="text-slate-500 text-sm">No friends online</p>';
            }
            
        } catch (error) {
            console.error('[MAIN] Error loading friends:', error);
            document.getElementById('onlineFriendsList').innerHTML = '<p class="text-slate-500 text-sm">No friends online</p>';
        }
    }

    async loadRecentVisitors() {
        try {
            const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/guest/get/visites&method=POST&session_id=${this.sessionId}&page=0`);
            const data = await response.json();
            
            const listContainer = document.getElementById('visitorsList');
            
            if (data.success && data.data?.result && Array.isArray(data.data.result)) {
                let visitors = data.data.result.slice(0, 6);
                
                visitors.sort((a, b) => {
                    const timeA = new Date(a.date_visite || a.date_action || 0);
                    const timeB = new Date(b.date_visite || b.date_action || 0);
                    return timeB - timeA;
                });
                
                if (visitors.length === 0) {
                    await this.loadRecentVisitorsFallback();
                    return;
                }
                
                const visitorsHTML = visitors.map((visitor) => {
                    const photoUrl = this.getPhotoUrl(visitor);
                    const age = visitor.age || '--';
                    const visitTime = visitor.date_visite || visitor.date_action;
                    const timeAgo = visitTime ? this.formatTimeAgo(visitTime) : 'Recently';
                    const firstLetter = (visitor.pseudo || visitor.nom_complet || 'U').charAt(0).toUpperCase();
                    
                    return `
                        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer group" onclick="viewUserProfile('${visitor.id || visitor.id_membre}', '${visitor.pseudo || visitor.nom_complet || 'Anonymous'}')">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-slate-300 font-bold">
                                    ${photoUrl ? `<img src="${photoUrl}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                                    <span class="${photoUrl ? 'hidden' : 'block'}">${firstLetter}</span>
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-white group-hover:text-brand-primary transition-colors">${visitor.pseudo || visitor.nom_complet || 'Anonymous'}</p>
                                    <p class="text-xs text-slate-400">${age} years</p>
                                </div>
                            </div>
                            <span class="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-full">${timeAgo}</span>
                        </div>
                    `;
                }).join('');
                
                listContainer.innerHTML = `<div class="space-y-3">${visitorsHTML}</div>`;
                
            } else {
                await this.loadRecentVisitorsFallback();
            }
            
        } catch (error) {
            await this.loadRecentVisitorsFallback();
        }
    }

    async loadRecentVisitorsFallback() {
        try {
            const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/search&method=POST&session_id=${this.sessionId}&page=0&is_photo=1`);
            const data = await response.json();
            
            const listContainer = document.getElementById('visitorsList');
            
            if (data.success && data.data?.result && Array.isArray(data.data.result)) {
                const visitors = data.data.result.slice(0, 6);
                
                if (visitors.length === 0) {
                    listContainer.innerHTML = '<p class="text-slate-500 text-sm text-center">No recent visitors</p>';
                    return;
                }
                
                const visitorsHTML = visitors.map((visitor, index) => {
                    const photoUrl = this.getPhotoUrl(visitor);
                    const age = visitor.age || '--';
                    const timeAgo = this.getProgressiveTimeAgo(index);
                    const firstLetter = (visitor.pseudo || 'U').charAt(0).toUpperCase();
                    
                    return `
                        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer group" onclick="viewUserProfile('${visitor.id || visitor.id_membre}', '${visitor.pseudo || 'Anonymous'}')">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-slate-300 font-bold">
                                    ${photoUrl ? `<img src="${photoUrl}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                                    <span class="${photoUrl ? 'hidden' : 'block'}">${firstLetter}</span>
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-white group-hover:text-brand-primary transition-colors">${visitor.pseudo || 'Anonymous'}</p>
                                    <p class="text-xs text-slate-400">${age} years</p>
                                </div>
                            </div>
                            <span class="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-full">${timeAgo}</span>
                        </div>
                    `;
                }).join('');
                
                listContainer.innerHTML = `<div class="space-y-3">${visitorsHTML}</div>`;
            } else {
                listContainer.innerHTML = '<p class="text-slate-500 text-sm text-center">No recent visitors</p>';
            }
        } catch (error) {
            document.getElementById('visitorsList').innerHTML = '<p class="text-slate-500 text-sm text-center">No recent visitors</p>';
        }
    }

    async loadPhotoVotes() {
        try {
            const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/user_edit_photos&method=POST&session_id=${this.sessionId}`);
            const data = await response.json();
            
            const listContainer = document.getElementById('photoVotesList');
            
            if (data.success && data.data?.result && Array.isArray(data.data.result)) {
                const photos = data.data.result.slice(0, 4);
                
                if (photos.length === 0) {
                    listContainer.innerHTML = '<p class="text-slate-500 text-sm text-center">No photos uploaded</p>';
                    return;
                }
                
                const photosHTML = photos.map(photo => {
                    const photoUrl = this.getPhotoUrlFromPhotoData(photo);
                    const votes = Math.floor(Math.random() * 50) + 1;
                    const rating = (Math.random() * 2 + 3).toFixed(1);
                    
                    return `
                        <div class="relative group rounded-xl overflow-hidden aspect-square bg-slate-800">
                             ${photoUrl ? `<img src="${photoUrl}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                             <div class="${photoUrl ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-slate-600">
                                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             </div>
                             
                             <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                                <div class="text-white text-xs font-bold flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="text-yellow-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 
                                    ${rating}
                                </div>
                                <div class="text-white text-xs">${votes} votes</div>
                             </div>
                        </div>
                    `;
                }).join('');
                
                listContainer.innerHTML = `<div class="grid grid-cols-2 gap-3">${photosHTML}</div>`;
                
                // Update votes count badge
                const totalVotes = photos.length * Math.floor(Math.random() * 20 + 10);
                const votesBadge = document.getElementById('votesCountBadge');
                if (votesBadge) votesBadge.textContent = totalVotes;
                
            } else {
                listContainer.innerHTML = '<p class="text-slate-500 text-sm text-center">No photos available</p>';
            }
            
        } catch (error) {
            document.getElementById('photoVotesList').innerHTML = '<p class="text-slate-500 text-sm text-center">Failed to load</p>';
        }
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshActivityBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadActivityFeed();
            });
        }
        
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                filterTabs.forEach(t => {
                    t.classList.remove('bg-brand-primary', 'text-white');
                    t.classList.add('bg-slate-800', 'text-slate-400');
                });
                e.target.classList.remove('bg-slate-800', 'text-slate-400');
                e.target.classList.add('bg-brand-primary', 'text-white');
                
                const gender = parseInt(e.target.dataset.gender);
                this.loadTopMembers(gender);
            });
        });
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.logout();
                }
            });
        }
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.loadQuickStats();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    // ... helper methods from original code ...
    formatTimeAgo(dateString) {
        if (!dateString) return 'Recently';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString();
        } catch (error) {
            return 'Recently';
        }
    }

    getProgressiveTimeAgo(index) {
        const times = ['15m ago', '1h ago', '3h ago', '5h ago', '1d ago', '2d ago'];
        return times[index] || times[times.length - 1];
    }
    
    async loadGiftNotifications() {
        // Method placeholder
    }

    async loadGiftNotificationsData() {
        try {
            const response = await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_notifications',
                    session_id: this.sessionId,
                    limit: 20
                })
            });
            const result = await response.json();
            return result.success ? result.data || [] : [];
        } catch (error) {
            return [];
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    function initMainDashboard(attempt = 1, maxAttempts = 20) {
        if (window.authManager && window.authManager.isLoggedIn) {
            window.mainDashboard = new MainDashboard();
            window.mainDashboard.init();
        } else if (attempt < maxAttempts) {
            setTimeout(() => initMainDashboard(attempt + 1, maxAttempts), 1000);
        } else {
            console.error('[MAIN] Failed to initialize MainDashboard - AuthManager not ready');
            window.location.href = 'index.html';
        }
    }
    setTimeout(() => initMainDashboard(), 500);
});

window.addEventListener('beforeunload', () => {
    if (window.mainDashboard) {
        window.mainDashboard.stopAutoRefresh();
    }
});
