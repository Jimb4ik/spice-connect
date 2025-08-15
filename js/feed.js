// Feed page functionality
class FeedManager {
    constructor() {
        this.sessionId = null;
        this.apiKey = null;
        this.baseUrl = 'https://dev2018.de5a7.com';
        this.refreshInterval = null;
    }

    async init() {
        console.log('[FEED] Initializing feed manager...');
        
        // Проверяем авторизацию
        if (!window.authManager || !window.authManager.isLoggedIn) {
            window.location.href = 'index.html';
            return;
        }

        this.sessionId = window.authManager.sessionId;
        
        // Получаем API ключ
        try {
            const apiResponse = await fetch('/api/get-api-key');
            const apiConfig = await apiResponse.json();
            this.apiKey = apiConfig.apiKey;
            this.baseUrl = apiConfig.baseUrl || this.baseUrl;
        } catch (error) {
            console.error('[FEED] Error getting API key:', error);
            return;
        }

        // Загружаем все данные
        await this.loadAllData();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        // Запускаем автообновление
        this.startAutoRefresh();
    }

    async loadAllData() {
        console.log('[FEED] Loading all feed data...');
        
        // Загружаем данные параллельно
        await Promise.all([
            this.loadQuickStats(),
            this.loadOnlineFriends(),
            this.loadActivityFeed(),
            this.loadTopMembers(),
            this.loadRecentVisitors(),
            this.loadPhotoVotes()
        ]);
    }

    async loadQuickStats() {
        try {
            console.log('[FEED] Loading quick stats...');
            
            // Используем ajax_api/online для получения статистики
            const response = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/online&method=GET&session_id=${this.sessionId}&api_key=${this.apiKey}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                // Обновляем счетчики
                const newMessages = data.data.new_messages || 0;
                const profileViews = data.data.profile_views || 0;
                const onlineFriends = data.data.online_friends || 0;
                
                document.getElementById('newMessagesCount').textContent = newMessages;
                document.getElementById('profileViewsCount').textContent = profileViews;
                document.getElementById('onlineFriendsCount').textContent = onlineFriends;
                
                // Обновляем badge в навигации
                const messagesBadge = document.getElementById('messagesBadge');
                if (messagesBadge) {
                    messagesBadge.textContent = newMessages;
                    messagesBadge.style.display = newMessages > 0 ? 'inline' : 'none';
                }
            }
        } catch (error) {
            console.error('[FEED] Error loading quick stats:', error);
        }
    }

    async loadOnlineFriends() {
        try {
            console.log('[FEED] Loading online friends...');
            
            // Используем поиск с фильтром is_online=1
            const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/search&method=POST&session_id=${this.sessionId}&api_key=${this.apiKey}&is_online=1&pas=10`);
            const data = await response.json();
            
            const friendsList = document.getElementById('onlineFriendsList');
            const onlineCount = document.getElementById('onlineCount');
            
            if (data.success && data.data && data.data.result) {
                const friends = data.data.result;
                onlineCount.textContent = friends.length;
                
                if (friends.length > 0) {
                    friendsList.innerHTML = friends.map(friend => this.createFriendItem(friend)).join('');
                } else {
                    friendsList.innerHTML = '<div class="empty-state"><p>No friends online</p></div>';
                }
            } else {
                friendsList.innerHTML = '<div class="empty-state"><p>No friends online</p></div>';
                onlineCount.textContent = '0';
            }
        } catch (error) {
            console.error('[FEED] Error loading online friends:', error);
            document.getElementById('onlineFriendsList').innerHTML = '<div class="error-state"><p>Error loading friends</p></div>';
        }
    }

    async loadActivityFeed() {
        try {
            console.log('[FEED] Loading activity feed...');
            
            // Используем ajax_api/get_pubs для получения активности
            const response = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/get_pubs&method=POST&session_id=${this.sessionId}&api_key=${this.apiKey}&page=0&pas=20`);
            const data = await response.json();
            
            const activityFeed = document.getElementById('activityFeed');
            
            if (data.success && data.data && Array.isArray(data.data)) {
                const activities = data.data;
                
                if (activities.length > 0) {
                    activityFeed.innerHTML = activities.map(activity => this.createActivityItem(activity)).join('');
                } else {
                    activityFeed.innerHTML = '<div class="empty-state"><p>No recent activity</p></div>';
                }
            } else {
                activityFeed.innerHTML = '<div class="empty-state"><p>No recent activity</p></div>';
            }
        } catch (error) {
            console.error('[FEED] Error loading activity feed:', error);
            document.getElementById('activityFeed').innerHTML = '<div class="error-state"><p>Error loading activity</p></div>';
        }
    }

    async loadTopMembers(sex = 2) {
        try {
            console.log('[FEED] Loading top members...');
            
            const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/topmembers&method=POST&session_id=${this.sessionId}&api_key=${this.apiKey}&sex=${sex}&pas=10`);
            const data = await response.json();
            
            const topMembersCarousel = document.getElementById('topMembersCarousel');
            
            if (data.success && data.data && data.data.result) {
                const members = data.data.result;
                
                if (members.length > 0) {
                    topMembersCarousel.innerHTML = `
                        <div class="top-members-grid">
                            ${members.map(member => this.createTopMemberCard(member)).join('')}
                        </div>
                    `;
                } else {
                    topMembersCarousel.innerHTML = '<div class="empty-state"><p>No top members found</p></div>';
                }
            } else {
                topMembersCarousel.innerHTML = '<div class="empty-state"><p>No top members found</p></div>';
            }
        } catch (error) {
            console.error('[FEED] Error loading top members:', error);
            document.getElementById('topMembersCarousel').innerHTML = '<div class="error-state"><p>Error loading top members</p></div>';
        }
    }

    async loadRecentVisitors() {
        try {
            console.log('[FEED] Loading recent visitors...');
            
            // Используем поиск для получения недавних посетителей
            const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/search&method=POST&session_id=${this.sessionId}&api_key=${this.apiKey}&pas=5`);
            const data = await response.json();
            
            const visitorsList = document.getElementById('visitorsList');
            
            if (data.success && data.data && data.data.result) {
                const visitors = data.data.result.slice(0, 5); // Берем только первых 5
                
                if (visitors.length > 0) {
                    visitorsList.innerHTML = visitors.map(visitor => this.createVisitorItem(visitor)).join('');
                } else {
                    visitorsList.innerHTML = '<div class="empty-state"><p>No recent visitors</p></div>';
                }
            } else {
                visitorsList.innerHTML = '<div class="empty-state"><p>No recent visitors</p></div>';
            }
        } catch (error) {
            console.error('[FEED] Error loading visitors:', error);
            document.getElementById('visitorsList').innerHTML = '<div class="error-state"><p>Error loading visitors</p></div>';
        }
    }

    async loadPhotoVotes() {
        try {
            console.log('[FEED] Loading photo votes...');
            
            // Симулируем данные голосов за фото (API endpoint не найден в документации)
            const votesList = document.getElementById('votesList');
            
            // Временно показываем заглушку
            votesList.innerHTML = `
                <div class="vote-item">
                    <div class="vote-avatar">👤</div>
                    <div class="vote-info">
                        <div class="vote-text">Someone voted for your photo</div>
                        <div class="vote-time">2 hours ago</div>
                    </div>
                    <div class="vote-rating">⭐ 5</div>
                </div>
                <div class="vote-item">
                    <div class="vote-avatar">👤</div>
                    <div class="vote-info">
                        <div class="vote-text">New vote received</div>
                        <div class="vote-time">5 hours ago</div>
                    </div>
                    <div class="vote-rating">⭐ 4</div>
                </div>
            `;
        } catch (error) {
            console.error('[FEED] Error loading photo votes:', error);
            document.getElementById('votesList').innerHTML = '<div class="error-state"><p>Error loading votes</p></div>';
        }
    }

    createFriendItem(friend) {
        const photoUrl = this.getPhotoUrl(friend);
        const name = friend.pseudo || friend.nom_complet || 'Unknown';
        
        return `
            <div class="friend-item">
                <div class="friend-avatar">
                    ${photoUrl ? `<img src="${photoUrl}" alt="${name}">` : `<span>${name.charAt(0).toUpperCase()}</span>`}
                    <div class="online-indicator"></div>
                </div>
                <div class="friend-info">
                    <div class="friend-name">${name}</div>
                    <div class="friend-status">Online now</div>
                </div>
            </div>
        `;
    }

    createActivityItem(activity) {
        const time = this.formatTime(activity.date_creation || new Date());
        const action = this.getActivityAction(activity.action || 'unknown');
        const userName = activity.pseudo || activity.nom_complet || 'Someone';
        
        return `
            <div class="activity-item">
                <div class="activity-icon">${action.icon}</div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong>${userName}</strong> ${action.text}
                    </div>
                    <div class="activity-time">${time}</div>
                </div>
            </div>
        `;
    }

    createTopMemberCard(member) {
        const photoUrl = this.getPhotoUrl(member);
        const name = member.pseudo || member.nom_complet || 'Unknown';
        const age = member.age || '--';
        const location = member.ville || member.region || 'Unknown';
        
        return `
            <div class="top-member-card">
                <div class="member-photo">
                    ${photoUrl ? `<img src="${photoUrl}" alt="${name}">` : `<div class="photo-placeholder">${name.charAt(0).toUpperCase()}</div>`}
                </div>
                <div class="member-info">
                    <div class="member-name">${name}</div>
                    <div class="member-details">${age} • ${location}</div>
                </div>
            </div>
        `;
    }

    createVisitorItem(visitor) {
        const photoUrl = this.getPhotoUrl(visitor);
        const name = visitor.pseudo || visitor.nom_complet || 'Unknown';
        const time = this.formatTime(visitor.last_visit || new Date());
        
        return `
            <div class="visitor-item">
                <div class="visitor-avatar">
                    ${photoUrl ? `<img src="${photoUrl}" alt="${name}">` : `<span>${name.charAt(0).toUpperCase()}</span>`}
                </div>
                <div class="visitor-info">
                    <div class="visitor-name">${name}</div>
                    <div class="visitor-time">${time}</div>
                </div>
            </div>
        `;
    }

    getPhotoUrl(profile) {
        if (!profile) return null;
        
        // Пробуем разные источники фотографий
        if (profile.photos_v2) {
            if (profile.photos_v2.public) {
                const publicPhotos = profile.photos_v2.public;
                const firstPhotoKey = Object.keys(publicPhotos)[0];
                if (firstPhotoKey && publicPhotos[firstPhotoKey]) {
                    return publicPhotos[firstPhotoKey].sq_430 || 
                           publicPhotos[firstPhotoKey].normal || 
                           publicPhotos[firstPhotoKey].sq_middle;
                }
            } else if (Array.isArray(profile.photos_v2) && profile.photos_v2.length > 0) {
                const mainPhoto = profile.photos_v2.find(p => p.main_photo === '1') || profile.photos_v2[0];
                return mainPhoto.sq_430 || mainPhoto.normal || mainPhoto.sq_middle;
            }
        } else if (profile.photos && profile.photos.length > 0) {
            return profile.photos[0].url_big || profile.photos[0].url_middle;
        } else if (profile.picture_430) {
            return profile.picture_430;
        } else if (profile.picture) {
            return profile.picture;
        }
        
        return null;
    }

    getActivityAction(action) {
        const actions = {
            'con': { icon: '🟢', text: 'came online' },
            'visite': { icon: '👁️', text: 'visited your profile' },
            'vote': { icon: '⭐', text: 'voted for your photo' },
            'modif': { icon: '✏️', text: 'updated their profile' },
            'add_tof': { icon: '📷', text: 'added new photos' },
            'unknown': { icon: '📱', text: 'had some activity' }
        };
        
        return actions[action] || actions['unknown'];
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }

    setupEventListeners() {
        // Обработчик обновления активности
        const refreshBtn = document.getElementById('refreshActivityBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadActivityFeed();
            });
        }

        // Обработчики фильтров топ участников
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const sex = e.target.dataset.sex;
                this.loadTopMembers(parseInt(sex));
            });
        });

        // Обработчик logout
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
        // Обновляем статистику каждые 30 секунд
        this.refreshInterval = setInterval(() => {
            this.loadQuickStats();
        }, 30000);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.feedManager = new FeedManager();
    window.feedManager.init();
});

// Очистка при выгрузке страницы
window.addEventListener('beforeunload', () => {
    if (window.feedManager) {
        window.feedManager.destroy();
    }
});
