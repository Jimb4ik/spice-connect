// Dashboard Manager
class DashboardManager {
  constructor() {
    this.currentSex = 2; // Default to women
    this.currentAgeRange = "18-35";
    this.init();
  }

  async init() {
    console.log('[DASHBOARD] Initializing dashboard...');
    
    // Check authentication
    if (!window.authManager || !window.authManager.sessionId) {
      console.log('[DASHBOARD] User not logged in, redirecting...');
      window.location.href = 'index.html';
      return;
    }

    this.setupEventListeners();
    await this.loadInitialData();
    this.startPeriodicUpdates();
  }

  setupEventListeners() {
    // Top members filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentSex = parseInt(e.target.dataset.sex);
        this.loadTopMembers();
      });
    });

    // Refresh activity button
    const refreshBtn = document.getElementById('refreshActivityBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadActivityFeed();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.authManager.logout();
      });
    }
  }

  async loadInitialData() {
    console.log('[DASHBOARD] Loading initial data...');
    
    await Promise.all([
      this.loadQuickStats(),
      this.loadOnlineFriends(),
      this.loadActivityFeed(),
      this.loadTopMembers(),
      this.loadRecentVisitors(),
      this.loadPhotoVotes()
    ]);
  }

  startPeriodicUpdates() {
    // Update online status every 30 seconds
    setInterval(() => {
      this.updateOnlineStatus();
    }, 30000);

    // Refresh activity feed every 2 minutes
    setInterval(() => {
      this.loadActivityFeed();
      this.loadOnlineFriends();
    }, 120000);
  }

  async loadQuickStats() {
    try {
      console.log('[DASHBOARD] Loading quick stats...');
      
      // Get online status (includes new messages count)
      const onlineResponse = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/online&method=GET&session_id=${window.authManager.sessionId}`);
      const onlineData = await onlineResponse.json();
      
      if (onlineData.success && onlineData.data) {
        const messagesCount = onlineData.data.nb_new_messages || 0;
        document.getElementById('newMessagesCount').textContent = messagesCount;
        
        // Update header badge
        const messagesBadge = document.getElementById('messagesBadge');
        if (messagesBadge) {
          messagesBadge.textContent = messagesCount;
          messagesBadge.style.display = messagesCount > 0 ? 'inline' : 'none';
        }
      }

      // Get profile views from user data
      const userDataString = localStorage.getItem('lavrilo_user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const userId = userData.id;
        
        const userResponse = await fetch(`/api/spice-multi-test?endpoint=/index_api/user&method=POST&session_id=${window.authManager.sessionId}&id=${userId}`);
        const userApiData = await userResponse.json();
        
        if (userApiData.success && userApiData.data?.result) {
          const profileViews = userApiData.data.result.nb_visite || 0;
          document.getElementById('profileViewsCount').textContent = profileViews;
        }
      }

      // Load online friends count
      await this.loadOnlineFriendsCount();

    } catch (error) {
      console.error('[DASHBOARD] Error loading quick stats:', error);
      document.getElementById('newMessagesCount').textContent = '0';
      document.getElementById('profileViewsCount').textContent = '0';
      document.getElementById('onlineFriendsCount').textContent = '0';
    }
  }

  async loadOnlineFriendsCount() {
    try {
      // Get contacts and count online ones
      const contactsResponse = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/load_contacts&method=GET&session_id=${window.authManager.sessionId}&filter=3`);
      const contactsData = await contactsResponse.json();
      
      if (contactsData.success && contactsData.data?.result) {
        const contacts = contactsData.data.result.slice(0, 20); // Check max 20 contacts
        let onlineCount = 0;
        
        // Check online status for each contact
        for (const contact of contacts) {
          try {
            const onlineResponse = await fetch(`/api/spice-multi-test?endpoint=/index_api/user/is_online&method=POST&pseudo=${contact.pseudo}`);
            const onlineData = await onlineResponse.json();
            
            if (onlineData.success && onlineData.data?.is_online === 1) {
              onlineCount++;
            }
          } catch (error) {
            console.error('[DASHBOARD] Error checking online status for:', contact.pseudo, error);
          }
        }
        
        document.getElementById('onlineFriendsCount').textContent = onlineCount;
        return onlineCount;
      }
      
      document.getElementById('onlineFriendsCount').textContent = '0';
      return 0;
    } catch (error) {
      console.error('[DASHBOARD] Error loading online friends count:', error);
      document.getElementById('onlineFriendsCount').textContent = '0';
      return 0;
    }
  }

  async loadOnlineFriends() {
    try {
      console.log('[DASHBOARD] Loading online friends...');
      
      const friendsList = document.getElementById('onlineFriendsList');
      const onlineCount = document.getElementById('onlineCount');
      
      // Get contacts
      const contactsResponse = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/load_contacts&method=GET&session_id=${window.authManager.sessionId}&filter=3`);
      const contactsData = await contactsResponse.json();
      
      if (contactsData.success && contactsData.data?.result) {
        const contacts = contactsData.data.result.slice(0, 10); // Show max 10 friends
        let onlineFriends = [];
        
        // Check online status for each contact
        for (const contact of contacts) {
          try {
            const onlineResponse = await fetch(`/api/spice-multi-test?endpoint=/index_api/user/is_online&method=POST&pseudo=${contact.pseudo}`);
            const onlineData = await onlineResponse.json();
            
            if (onlineData.success && onlineData.data?.is_online === 1) {
              onlineFriends.push(contact);
            }
          } catch (error) {
            console.error('[DASHBOARD] Error checking online status for:', contact.pseudo, error);
          }
        }
        
        // Update counts
        onlineCount.textContent = onlineFriends.length;
        
        // Render online friends
        if (onlineFriends.length > 0) {
          friendsList.innerHTML = onlineFriends.map(friend => `
            <div class="online-friend-item" onclick="window.location.href='profile.html?user=${friend.pseudo}'">
              <div class="online-friend-avatar">
                ${friend.main_photo && friend.main_photo.sqsmall ? 
                  `<img src="${friend.main_photo.sqsmall}" alt="${friend.pseudo}">` :
                  friend.pseudo.charAt(0).toUpperCase()
                }
                <div class="online-status-dot"></div>
              </div>
              <div class="online-friend-info">
                <div class="online-friend-name">${friend.pseudo}</div>
                <div class="online-friend-status">Online now</div>
              </div>
            </div>
          `).join('');
        } else {
          friendsList.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">👥</div>
              <h4>No friends online</h4>
              <p>Your friends will appear here when they're online</p>
            </div>
          `;
        }
      } else {
        onlineCount.textContent = '0';
        friendsList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <h4>No friends yet</h4>
            <p>Start connecting with people to see them here</p>
          </div>
        `;
      }
      
    } catch (error) {
      console.error('[DASHBOARD] Error loading online friends:', error);
      document.getElementById('onlineFriendsList').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h4>Error loading friends</h4>
          <p>Please try again later</p>
        </div>
      `;
    }
  }

  async loadActivityFeed() {
    try {
      console.log('[DASHBOARD] Loading activity feed...');
      
      const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/wall&method=POST&session_id=${window.authManager.sessionId}`);
      const data = await response.json();
      
      const activityFeed = document.getElementById('activityFeed');
      
      if (data.success && data.data && data.data.result && data.data.result.length > 0) {
        const activities = data.data.result.slice(0, 10);
        
        activityFeed.innerHTML = activities.map(activity => {
          const icon = this.getActivityIcon(activity.action);
          const text = this.getActivityText(activity);
          const timeAgo = this.getTimeAgo(activity.date_action);
          
          return `
            <div class="activity-item">
              <div class="activity-avatar">
                ${activity.main_photo && activity.main_photo.sqsmall ? 
                  `<img src="${activity.main_photo.sqsmall}" alt="${activity.pseudo}">` :
                  activity.pseudo.charAt(0).toUpperCase()
                }
              </div>
              <div class="activity-content">
                <div class="activity-text">${text}</div>
                <div class="activity-time">${timeAgo}</div>
              </div>
              <div class="activity-icon">${icon}</div>
            </div>
          `;
        }).join('');
      } else {
        activityFeed.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🎯</div>
            <h4>No recent activity</h4>
            <p>Activity from your friends will appear here</p>
          </div>
        `;
      }
      
    } catch (error) {
      console.error('[DASHBOARD] Error loading activity feed:', error);
      document.getElementById('activityFeed').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h4>Error loading activity</h4>
          <p>Please try again later</p>
        </div>
      `;
    }
  }

  async loadTopMembers() {
    try {
      console.log('[DASHBOARD] Loading top members...');
      
      const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/topmembers&method=POST&session_id=${window.authManager.sessionId}&sex=${this.currentSex}&age_range=${this.currentAgeRange}`);
      const data = await response.json();
      
      const carousel = document.getElementById('topMembersCarousel');
      
      if (data.success && data.data && data.data.result && data.data.result.length > 0) {
        const members = data.data.result.slice(0, 8);
        
        carousel.innerHTML = members.map((member, index) => `
          <div class="top-member-card">
            <div class="top-member-avatar">
              ${member.main_photo && member.main_photo.sqsmall ? 
                `<img src="${member.main_photo.sqsmall}" alt="${member.pseudo}">` :
                member.pseudo.charAt(0).toUpperCase()
              }
              <div class="top-member-rank">${index + 1}</div>
            </div>
            <div class="top-member-name">${member.pseudo}</div>
            <div class="top-member-age">${member.age || 'N/A'} years</div>
          </div>
        `).join('');
      } else {
        carousel.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🏆</div>
            <h4>No top members</h4>
            <p>Top members will appear here</p>
          </div>
        `;
      }
      
    } catch (error) {
      console.error('[DASHBOARD] Error loading top members:', error);
      document.getElementById('topMembersCarousel').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h4>Error loading top members</h4>
          <p>Please try again later</p>
        </div>
      `;
    }
  }

  async loadRecentVisitors() {
    try {
      console.log('[DASHBOARD] Loading recent visitors...');
      
      const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/guest/get/visites&method=POST&session_id=${window.authManager.sessionId}&page=0`);
      const data = await response.json();
      
      const visitorsList = document.getElementById('visitorsList');
      
      if (data.success && data.data && data.data.result && data.data.result.length > 0) {
        const visitors = data.data.result.slice(0, 5);
        
        visitorsList.innerHTML = visitors.map(visitor => `
          <div class="visitor-item">
            <div class="visitor-avatar">
              ${visitor.main_photo && visitor.main_photo.sqsmall ? 
                `<img src="${visitor.main_photo.sqsmall}" alt="${visitor.pseudo}">` :
                visitor.pseudo.charAt(0).toUpperCase()
              }
            </div>
            <div class="visitor-info">
              <div class="visitor-name">${visitor.pseudo}</div>
              <div class="visitor-time">${this.getTimeAgo(visitor.date_visite)}</div>
            </div>
          </div>
        `).join('');
      } else {
        visitorsList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">👁️</div>
            <h4>No recent visitors</h4>
            <p>Profile visitors will appear here</p>
          </div>
        `;
      }
      
    } catch (error) {
      console.error('[DASHBOARD] Error loading visitors:', error);
      document.getElementById('visitorsList').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h4>Error loading visitors</h4>
          <p>Please try again later</p>
        </div>
      `;
    }
  }

  async loadPhotoVotes() {
    try {
      console.log('[DASHBOARD] Loading photo votes...');
      
      const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/guest/get/votes&method=POST&session_id=${window.authManager.sessionId}&page=0`);
      const data = await response.json();
      
      const votesList = document.getElementById('votesList');
      
      if (data.success && data.data && data.data.result && data.data.result.length > 0) {
        const votes = data.data.result.slice(0, 5);
        
        votesList.innerHTML = votes.map(vote => `
          <div class="vote-item">
            <div class="vote-avatar">
              ${vote.main_photo && vote.main_photo.sqsmall ? 
                `<img src="${vote.main_photo.sqsmall}" alt="${vote.pseudo}">` :
                vote.pseudo.charAt(0).toUpperCase()
              }
            </div>
            <div class="vote-info">
              <div class="vote-name">${vote.pseudo}</div>
              <div class="vote-time">${this.getTimeAgo(vote.date_vote)}</div>
              <div class="vote-rating">
                <span class="vote-stars">${this.getStars(vote.note || 5)}</span>
                <span>${vote.note || 5}/5</span>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        votesList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">⭐</div>
            <h4>No photo votes</h4>
            <p>Photo votes will appear here</p>
          </div>
        `;
      }
      
    } catch (error) {
      console.error('[DASHBOARD] Error loading photo votes:', error);
      document.getElementById('votesList').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h4>Error loading votes</h4>
          <p>Please try again later</p>
        </div>
      `;
    }
  }

  async updateOnlineStatus() {
    try {
      await fetch(`/api/spice-multi-test?endpoint=/ajax_api/online&method=GET&session_id=${window.authManager.sessionId}`);
    } catch (error) {
      console.error('[DASHBOARD] Error updating online status:', error);
    }
  }

  getActivityIcon(action) {
    const icons = {
      'con': '🟢',
      'visite': '👁️',
      'vote': '⭐',
      'modif': '✏️',
      'add_tof': '📸'
    };
    return icons[action] || '📱';
  }

  getActivityText(activity) {
    const actions = {
      'con': `${activity.pseudo} came online`,
      'visite': `${activity.pseudo} visited a profile`,
      'vote': `${activity.pseudo} voted for a photo`,
      'modif': `${activity.pseudo} updated their profile`,
      'add_tof': `${activity.pseudo} added new photos`
    };
    return actions[activity.action] || `${activity.pseudo} was active`;
  }

  getTimeAgo(dateString) {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  }

  getStars(rating) {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardManager = new DashboardManager();
});
