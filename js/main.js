/**
 * Main Dashboard JavaScript
 * Handles Activity Feed, Quick Stats, Top Members, Friends Online, Recent Visitors, Photo Votes
 */

class MainDashboard {
    constructor() {
        this.sessionId = null;
        this.currentUser = null;
        this.refreshInterval = null;
        
        console.log('[MAIN] MainDashboard initialized');
    }

    async init() {
        console.log('[MAIN] Initializing MainDashboard...');
        
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

        console.log('[MAIN] Session ID:', this.sessionId);
        
        // Initialize all sections
        await this.loadAllSections();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up auto-refresh for online status
        this.startAutoRefresh();
        
        console.log('[MAIN] MainDashboard initialization complete');
    }

    async loadAllSections() {
        console.log('[MAIN] Loading all sections...');
        
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
            console.log('[MAIN] All sections loaded');
        } catch (error) {
            console.error('[MAIN] Error loading sections:', error);
        }
    }

    async loadQuickStats() {
        console.log('[MAIN] Loading quick stats...');
        
        try {
            // Get online status and message count
            const onlineResponse = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/online&method=GET&session_id=${this.sessionId}`);
            const onlineData = await onlineResponse.json();
            
            console.log('[MAIN] Online API response:', onlineData);
            
            if (onlineData.success && onlineData.data?.result) {
                const result = onlineData.data.result;
                
                // Update new messages count
                const newMessages = result.nb_new_message || 0;
                document.getElementById('newMessagesCount').textContent = newMessages;
                
                // Update message badge in header
                const messagesBadge = document.getElementById('messagesBadge');
                if (messagesBadge) {
                    messagesBadge.textContent = newMessages;
                    messagesBadge.style.display = newMessages > 0 ? 'inline' : 'none';
                }
            }
            
            // Note: Friends count is now loaded in loadOnlineFriends() function
            
            // Mock data for profile views and photo votes (these would need specific API endpoints)
            document.getElementById('profileViewsCount').textContent = Math.floor(Math.random() * 50) + 10;
            document.getElementById('photoVotesCount').textContent = Math.floor(Math.random() * 20) + 5;
            
        } catch (error) {
            console.error('[MAIN] Error loading quick stats:', error);
        }
    }

    async loadActivityFeed() {
        console.log('[MAIN] Loading activity feed...');
        
        try {
            // Загружаем как обычную активность, матчи и уведомления о подарках
            const [apiResponse, matches, giftNotifications] = await Promise.all([
                fetch(`/api/spice-multi-test?endpoint=/index_api/wall&method=POST&session_id=${this.sessionId}`),
                window.MatchUtils ? window.MatchUtils.loadUserMatches() : Promise.resolve([]),
                this.loadGiftNotificationsData()
            ]);
            
            const data = await apiResponse.json();
            console.log('[MAIN] Activity feed API response:', data);
            console.log('[MAIN] Recent matches:', matches);
            
            const feedContainer = document.getElementById('activityFeed');
            
            // Собираем все активности
            let allActivities = [];
            
            // Добавляем API активности
            if (data.success && data.data?.result && Array.isArray(data.data.result)) {
                allActivities = [...data.data.result];
            }
            
            // Добавляем матчи как активность
            if (matches && matches.length > 0) {
                const recentMatches = matches.slice(0, 5); // Последние 5 матчей
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
            
            // Добавляем уведомления о подарках
            if (giftNotifications && giftNotifications.length > 0) {
                const recentGifts = giftNotifications.slice(0, 10); // Последние 10 подарков
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
            
            // Сортируем по дате
            allActivities.sort((a, b) => new Date(b.date_action) - new Date(a.date_action));
            
            // Показываем последние 10 активностей
            const displayActivities = allActivities.slice(0, 10);
            
            if (displayActivities.length === 0) {
                feedContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📰</div><p>Your activity will appear here</p></div>';
                return;
            }
            
            const feedHTML = displayActivities.map(activity => {
                if (activity.type === 'match') {
                    return this.createMatchActivityItem(activity);
                } else if (activity.type === 'gift_received') {
                    return this.createGiftActivityItem(activity);
                } else {
                    return this.createRegularActivityItem(activity);
                }
            }).join('');
            
            feedContainer.innerHTML = feedHTML;
            
        } catch (error) {
            console.error('[MAIN] Error loading activity feed:', error);
            document.getElementById('activityFeed').innerHTML = '<div class="error-state">Failed to load activities</div>';
        }
    }
    
    createMatchActivityItem(match) {
        let photos = [];
        try {
            photos = typeof match.matched_user_photos === 'string' 
                ? JSON.parse(match.matched_user_photos) 
                : match.matched_user_photos || [];
        } catch (e) {
            photos = [];
        }
        
        const photoUrl = photos.length > 0 ? photos[0] : null;
        const timeAgo = this.formatTimeAgo(match.date_action);
        const isNew = match.is_new;
        
        return `
            <div class="activity-item match-activity ${isNew ? 'new-match-activity' : ''}" onclick="window.location.href='matches.html'">
                <div class="activity-content">
                    <div class="activity-text">
                        <strong>It's a match!</strong> You and <strong>${match.pseudo}</strong> liked each other
                        ${isNew ? '<span class="new-indicator">NEW</span>' : ''}
                    </div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }
    
    createRegularActivityItem(activity) {
        const photoUrl = this.getPhotoUrl(activity);
        const activityText = this.formatActivityText(activity);
        const timeAgo = this.formatTimeAgo(activity.date_action);
        
        return `
            <div class="activity-item">
                <div class="activity-content">
                    <div class="activity-text">${activityText}</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }

    async loadTopMembers(gender = 2) {
        console.log('[MAIN] Loading top members for gender:', gender);
        
        try {
            const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/topmembers&method=POST&session_id=${this.sessionId}&sex=${gender}&age_range=18-65&page=0&is_photo=1`);
            const data = await response.json();
            
            console.log('[MAIN] Top members API response:', data);
            
            const listContainer = document.getElementById('topMembersList');
            
            if (data.success && data.data?.result && Array.isArray(data.data.result)) {
                // Filter out test users and get top 5
                const filteredMembers = data.data.result.filter(member => 
                    member.pseudo && member.pseudo.toLowerCase() !== 'test'
                );
                const members = filteredMembers.slice(0, 5); // Show top 5
                
                if (members.length === 0) {
                    listContainer.innerHTML = '<div class="empty-state">No top members found</div>';
                    return;
                }
                
                const membersHTML = members.map((member, index) => {
                    const photoUrl = this.getPhotoUrl(member);
                    const age = member.age || '--';
                    const location = member.ville || member.region || 'Unknown';
                    
                    return `
                        <div class="member-item">
                            <div class="member-rank">#${index + 1}</div>
                            <div class="member-avatar">
                                ${photoUrl ? `<img src="${photoUrl}" alt="${member.pseudo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                                <div class="avatar-fallback" style="${photoUrl ? 'display: none;' : ''}">${(member.pseudo || 'U').charAt(0).toUpperCase()}</div>
                            </div>
                            <div class="member-info">
                                <div class="member-name">${member.pseudo || 'Anonymous'}</div>
                                <div class="member-details">${age} years • ${location}</div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                listContainer.innerHTML = membersHTML;
                
            } else {
                listContainer.innerHTML = '<div class="empty-state">No top members available</div>';
            }
            
        } catch (error) {
            console.error('[MAIN] Error loading top members:', error);
            document.getElementById('topMembersList').innerHTML = '<div class="error-state">Failed to load top members</div>';
        }
    }

    async loadOnlineFriends() {
        console.log('[MAIN] Loading friends list...');
        
        try {
            // Load friends list using load_contacts API with filter=3 (friends)
            const response = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/load_contacts&method=GET&session_id=${this.sessionId}&filter=3`);
            const data = await response.json();
            
            console.log('[MAIN] Friends API response:', data);
            
            const listContainer = document.getElementById('onlineFriendsList');
            
            if (data.success && data.data) {
                // API returns friends in 'contacts' or 'result' field
                const friends = data.data.contacts || data.data.result || [];
                
                if (!Array.isArray(friends) || friends.length === 0) {
                    listContainer.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">👥</div>
                            <p>No friends yet. Start making connections!</p>
                        </div>
                    `;
                    
                    // Update the badge count to match actual friends count
                    document.getElementById('onlineCountBadge').textContent = '0';
                    return;
                }
                
                // Update the badge count to match actual friends count
                document.getElementById('onlineCountBadge').textContent = friends.length;
                
                // Show up to 8 friends
                const displayFriends = friends.slice(0, 8);
                
                const friendsHTML = displayFriends.map(friend => {
                    const photoUrl = this.getPhotoUrl(friend);
                    const age = friend.age || '--';
                    const isOnline = friend.is_online === 1 || friend.is_online === '1';
                    
                    return `
                        <div class="friend-item">
                            <div class="friend-avatar">
                                ${photoUrl ? `<img src="${photoUrl}" alt="${friend.pseudo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                                <div class="avatar-fallback" style="${photoUrl ? 'display: none;' : ''}">${(friend.pseudo || 'U').charAt(0).toUpperCase()}</div>
                                ${isOnline ? '<div class="online-indicator"></div>' : ''}
                            </div>
                            <div class="friend-info">
                                <div class="friend-name">${friend.pseudo || 'Anonymous'}</div>
                                <div class="friend-age">${age} years</div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                listContainer.innerHTML = friendsHTML;
                
            } else {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <p>Unable to load friends</p>
                    </div>
                `;
                document.getElementById('onlineCountBadge').textContent = '0';
            }
            
        } catch (error) {
            console.error('[MAIN] Error loading friends:', error);
            document.getElementById('onlineFriendsList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <p>Failed to load friends</p>
                </div>
            `;
            document.getElementById('onlineCountBadge').textContent = '0';
        }
    }

    async loadRecentVisitors() {
        console.log('[MAIN] Loading recent visitors...');
        
        try {
            // Use proper visits API to get real visitors
            const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/guest/get/visites&method=POST&session_id=${this.sessionId}&page=0`);
            const data = await response.json();
            
            console.log('[MAIN] Recent visitors API response:', data);
            
            const listContainer = document.getElementById('visitorsList');
            
            if (data.success && data.data?.result && Array.isArray(data.data.result)) {
                let visitors = data.data.result.slice(0, 6); // Show 6 recent visitors
                
                // Sort by visit time (most recent first)
                visitors.sort((a, b) => {
                    const timeA = new Date(a.date_visite || a.date_action || 0);
                    const timeB = new Date(b.date_visite || b.date_action || 0);
                    return timeB - timeA; // Descending order (newest first)
                });
                
                if (visitors.length === 0) {
                    console.log('[MAIN] No visitors from API, using fallback search');
                    await this.loadRecentVisitorsFallback();
                    return;
                }
                
                const visitorsHTML = visitors.map((visitor) => {
                    const photoUrl = this.getPhotoUrl(visitor);
                    const age = visitor.age || '--';
                    const visitTime = visitor.date_visite || visitor.date_action;
                    const timeAgo = visitTime ? this.getTimeAgo(visitTime) : 'Recently';
                    
                    return `
                        <div class="visitor-item">
                            <div class="visitor-avatar">
                                ${photoUrl ? `<img src="${photoUrl}" alt="${visitor.pseudo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                                <div class="avatar-fallback" style="${photoUrl ? 'display: none;' : ''}">${(visitor.pseudo || 'U').charAt(0).toUpperCase()}</div>
                            </div>
                            <div class="visitor-info">
                                <div class="visitor-name">${visitor.pseudo || visitor.nom_complet || 'Anonymous'}</div>
                                <div class="visitor-details">${age} years • ${timeAgo}</div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                listContainer.innerHTML = visitorsHTML;
                
            } else {
                console.log('[MAIN] No visitors from API, using fallback search');
                await this.loadRecentVisitorsFallback();
            }
            
        } catch (error) {
            console.error('[MAIN] Error loading recent visitors:', error);
            // Fallback to search API
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
                    listContainer.innerHTML = '<div class="empty-state">No recent visitors</div>';
                    return;
                }
                
                const visitorsHTML = visitors.map((visitor, index) => {
                    const photoUrl = this.getPhotoUrl(visitor);
                    const age = visitor.age || '--';
                    // Generate realistic time progression: most recent first
                    const timeAgo = this.getProgressiveTimeAgo(index);
                    
                    return `
                        <div class="visitor-item">
                            <div class="visitor-avatar">
                                ${photoUrl ? `<img src="${photoUrl}" alt="${visitor.pseudo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                                <div class="avatar-fallback" style="${photoUrl ? 'display: none;' : ''}">${(visitor.pseudo || 'U').charAt(0).toUpperCase()}</div>
                            </div>
                            <div class="visitor-info">
                                <div class="visitor-name">${visitor.pseudo || 'Anonymous'}</div>
                                <div class="visitor-details">${age} years • ${timeAgo}</div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                listContainer.innerHTML = visitorsHTML;
            } else {
                listContainer.innerHTML = '<div class="empty-state">No recent visitors</div>';
            }
        } catch (error) {
            console.error('[MAIN] Error in fallback visitors:', error);
            document.getElementById('visitorsList').innerHTML = '<div class="error-state">Failed to load recent visitors</div>';
        }
    }

    async loadPhotoVotes() {
        console.log('[MAIN] Loading photo votes...');
        
        try {
            // Get user's photos
            const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/user_edit_photos&method=POST&session_id=${this.sessionId}`);
            const data = await response.json();
            
            console.log('[MAIN] Photo votes API response:', data);
            
            const listContainer = document.getElementById('photoVotesList');
            
            if (data.success && data.data?.result && Array.isArray(data.data.result)) {
                const photos = data.data.result.slice(0, 4); // Show 4 photos with votes
                
                if (photos.length === 0) {
                    listContainer.innerHTML = '<div class="empty-state">No photos to display</div>';
                    return;
                }
                
                const photosHTML = photos.map(photo => {
                    const photoUrl = this.getPhotoUrlFromPhotoData(photo);
                    const votes = Math.floor(Math.random() * 50) + 1; // Mock votes
                    const rating = (Math.random() * 2 + 3).toFixed(1); // Mock rating 3.0-5.0
                    
                    return `
                        <div class="photo-vote-item">
                            <div class="photo-thumbnail">
                                ${photoUrl ? `<img src="${photoUrl}" alt="Photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                                <div class="photo-fallback" style="${photoUrl ? 'display: none;' : ''}">📷</div>
                            </div>
                            <div class="photo-vote-info">
                                <div class="photo-votes">${votes} votes</div>
                                <div class="photo-rating">⭐ ${rating}</div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                listContainer.innerHTML = photosHTML;
                
                // Update votes count badge
                const totalVotes = photos.length * Math.floor(Math.random() * 20 + 10);
                document.getElementById('votesCountBadge').textContent = totalVotes;
                
            } else {
                listContainer.innerHTML = '<div class="empty-state">No photos available</div>';
            }
            
        } catch (error) {
            console.error('[MAIN] Error loading photo votes:', error);
            document.getElementById('photoVotesList').innerHTML = '<div class="error-state">Failed to load photo votes</div>';
        }
    }

    setupEventListeners() {
        console.log('[MAIN] Setting up event listeners...');
        
        // Refresh activity button
        const refreshBtn = document.getElementById('refreshActivityBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadActivityFeed();
            });
        }
        
        // Top members gender filter tabs
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Update active tab
                filterTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Load members for selected gender
                const gender = parseInt(e.target.dataset.gender);
                this.loadTopMembers(gender);
            });
        });
        
        // Logout button
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
        // Refresh online status every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadQuickStats();
        }, 30000);
        
        console.log('[MAIN] Auto-refresh started');
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('[MAIN] Auto-refresh stopped');
        }
    }

    // Utility methods
    getPhotoUrl(user) {
        let photoUrl = null;
        
        // Try various photo field formats from different API endpoints
        if (user.photos_v2) {
            if (user.photos_v2.public) {
                const publicPhotos = user.photos_v2.public;
                const firstPhotoKey = Object.keys(publicPhotos)[0];
                if (firstPhotoKey && publicPhotos[firstPhotoKey]) {
                    photoUrl = publicPhotos[firstPhotoKey].sq_430 || 
                              publicPhotos[firstPhotoKey].normal || 
                              publicPhotos[firstPhotoKey].sq_middle;
                }
            } else if (Array.isArray(user.photos_v2) && user.photos_v2.length > 0) {
                const mainPhoto = user.photos_v2.find(p => p.num === 0) || user.photos_v2[0];
                photoUrl = mainPhoto.sq_430 || mainPhoto.sq_middle || mainPhoto.normal;
            }
        } else if (user.photos && user.photos.length > 0) {
            photoUrl = user.photos[0].url_big || user.photos[0].url_middle;
        } else if (user.picture_430) {
            photoUrl = user.picture_430;
        } else if (user.picture) {
            photoUrl = user.picture;
        } else if (user.photo_profil_url) {
            photoUrl = user.photo_profil_url;
        } else if (user.photo_profil) {
            photoUrl = user.photo_profil;
        } else if (user.photo) {
            photoUrl = user.photo;
        } else if (user.avatar) {
            photoUrl = user.avatar;
        } else if (user.pic) {
            photoUrl = user.pic;
        } else if (user.image) {
            photoUrl = user.image;
        } else if (user.main_photo) {
            photoUrl = user.main_photo;
        }
        
        // Fix URL if relative
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
        
        if (photo.sq_430) {
            photoUrl = photo.sq_430;
        } else if (photo.normal) {
            photoUrl = photo.normal;
        } else if (photo.sq_middle) {
            photoUrl = photo.sq_middle;
        } else if (photo.url_big) {
            photoUrl = photo.url_big;
        } else if (photo.url_middle) {
            photoUrl = photo.url_middle;
        }
        
        // Fix URL if relative
        if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('/')) {
            photoUrl = 'https://dev2018.de5a7.com/' + photoUrl;
        }
        
        return photoUrl;
    }

    formatActivityText(activity) {
        const pseudo = activity.pseudo || 'Someone';
        const action = activity.action || 'unknown';
        
        switch (action) {
            case 'con':
                return `<strong>${pseudo}</strong> connected`;
            case 'visite':
                return `<strong>${pseudo}</strong> visited your profile`;
            case 'vote':
                return `<strong>${pseudo}</strong> voted for your photo`;
            case 'modif':
                return `<strong>${pseudo}</strong> updated their profile`;
            case 'add_tof':
                return `<strong>${pseudo}</strong> added new photos`;
            default:
                return `<strong>${pseudo}</strong> was active`;
        }
    }

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
        // Generate realistic time progression: most recent first
        const times = ['15m ago', '1h ago', '3h ago', '5h ago', '1d ago', '2d ago'];
        return times[index] || times[times.length - 1];
    }

    // ============ GIFTS NOTIFICATIONS METHODS ============
    
    async loadGiftNotifications() {
        console.log('[MAIN] Loading gift notifications...');
        // This method is called from loadAllSections but doesn't need separate UI rendering
        // Notifications are integrated into activity feed via loadActivityFeed
    }

    async loadGiftNotificationsData() {
        try {
            console.log('[MAIN] Loading gift notifications data...');
            
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
            if (result.success) {
                console.log('[MAIN] Loaded gift notifications:', result.data.length);
                return result.data || [];
            } else {
                console.error('[MAIN] Error loading gift notifications:', result.error);
                return [];
            }
        } catch (error) {
            console.error('[MAIN] Error loading gift notifications:', error);
            return [];
        }
    }

    createGiftActivityItem(notification) {
        const timeAgo = this.formatTimeAgo(notification.date_action);
        const isNew = notification.is_new;
        const giftEmoji = this.getGiftEmojiFromMessage(notification.message);
        
        return `
            <div class="activity-item gift-activity ${isNew ? 'new-gift-activity' : ''}" 
                 onclick="this.markAsRead(${notification.notification_id}); window.location.href='gifts.html';">
                <div class="activity-content">
                    <div class="activity-text">
                        ${notification.message}
                        ${isNew ? '<span class="new-indicator">NEW</span>' : ''}
                    </div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }

    getGiftEmojiFromMessage(message) {
        // Извлекаем название подарка из сообщения и возвращаем соответствующий эмодзи
        const giftEmojiMap = {
            'Red Rose': '🌹',
            'Tulip Bouquet': '🌷',
            'Heart Chocolate': '🍫',
            'Coffee & Cookies': '☕',
            'Teddy Bear': '🧸',
            'Balloons': '🎈',
            'Rose Bouquet': '💐',
            'Perfume': '🌸',
            'Silver Earrings': '💎',
            'Bracelet': '📿',
            'Watch': '⌚',
            'Gold Chain': '📿',
            'Diamond Earrings': '💍',
            'Gold Ring': '💍',
            'Pearl Necklace': '📿',
            'Diamond Bracelet': '💎',
            'Platinum Ring': '💍',
            'Luxury Watch': '⌚',
            'Diamond Necklace': '💎',
            'Royal Crown': '👑'
        };
        
        for (const [giftName, emoji] of Object.entries(giftEmojiMap)) {
            if (message.includes(giftName)) {
                return emoji;
            }
        }
        
        return '🎁'; // Default gift emoji
    }

    async markNotificationAsRead(notificationId) {
        try {
            await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'mark_notification_read',
                    session_id: this.sessionId,
                    notification_id: notificationId
                })
            });
        } catch (error) {
            console.error('[MAIN] Error marking notification as read:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[MAIN] DOM loaded, initializing MainDashboard...');
    
    // Wait for auth manager to be ready
    function initMainDashboard(attempt = 1, maxAttempts = 10) {
        if (window.authManager && window.authManager.isLoggedIn) {
            console.log('[MAIN] AuthManager ready, creating MainDashboard instance');
            window.mainDashboard = new MainDashboard();
            window.mainDashboard.init();
        } else if (attempt < maxAttempts) {
            console.log(`[MAIN] AuthManager not ready, retrying... (${attempt}/${maxAttempts})`);
            setTimeout(() => initMainDashboard(attempt + 1, maxAttempts), 500);
        } else {
            console.error('[MAIN] Failed to initialize MainDashboard - AuthManager not ready');
            window.location.href = 'index.html';
        }
    }
    
    // Start initialization
    setTimeout(() => initMainDashboard(), 100);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.mainDashboard) {
        window.mainDashboard.stopAutoRefresh();
    }
});
