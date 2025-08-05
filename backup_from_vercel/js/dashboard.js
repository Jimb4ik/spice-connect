/**
 * Lavrilo Dashboard JavaScript
 * Handles dashboard navigation and user profile management
 */

class Dashboard {
  constructor() {
    this.currentSection = 'profile';
    this.init();
  }

  init() {
    // Check if user is logged in
    if (!window.authManager || !window.authManager.isLoggedIn) {
      console.log('[DASHBOARD] User not logged in, redirecting to home');
      window.location.href = '/';
      return;
    }

    // Initialize dashboard
    this.setupEventListeners();
    this.updateUserInfo();
    this.loadUserProfile();
    
    console.log('[DASHBOARD] Dashboard initialized for user:', window.authManager.currentUser.pseudo);
  }

  setupEventListeners() {
    // Navigation cards
    const navCards = document.querySelectorAll('.nav-card');
    navCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const section = card.dataset.section;
        this.switchSection(section);
      });
    });

    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        this.editProfile();
      });
    }

    // Settings buttons
    this.setupSettingsButtons();
  }

  setupSettingsButtons() {
    const settingsButtons = document.querySelectorAll('.settings-card button');
    settingsButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.textContent.trim();
        
        switch (action) {
          case 'Manage Privacy':
            this.showComingSoon('Privacy settings');
            break;
          case 'Notification Settings':
            this.showComingSoon('Notification settings');
            break;
          case 'Security Settings':
            this.showComingSoon('Security settings');
            break;
          case 'Delete Account':
            this.confirmDeleteAccount();
            break;
        }
      });
    });
  }

  switchSection(sectionName) {
    // Update active nav card
    document.querySelectorAll('.nav-card').forEach(card => {
      card.classList.remove('active');
    });
    
    const activeCard = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeCard) {
      activeCard.classList.add('active');
    }

    // Update active content section
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    
    const activeSection = document.getElementById(`${sectionName}-section`);
    if (activeSection) {
      activeSection.classList.add('active');
      this.currentSection = sectionName;
    }

    // Load section-specific data
    this.loadSectionData(sectionName);
  }

  async loadSectionData(sectionName) {
    switch (sectionName) {
      case 'profile':
        await this.loadUserProfile();
        break;
      case 'messages':
        await this.loadMessages();
        break;
      case 'matches':
        await this.loadMatches();
        break;
      case 'visitors':
        await this.loadVisitors();
        break;
      case 'search':
        await this.loadSearch();
        break;
      case 'settings':
        // Settings is static for now
        break;
    }
  }

  updateUserInfo() {
    const user = window.authManager.currentUser;
    
    // Update welcome message
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    
    if (welcomeTitle && user) {
      welcomeTitle.textContent = `Welcome back, ${user.pseudo}!`;
    }
    
    if (welcomeSubtitle) {
      welcomeSubtitle.textContent = 'Manage your profile, find connections, and explore new possibilities.';
    }
  }

  async loadUserProfile() {
    if (!window.authManager.sessionId) return;

    try {
      this.showLoading(true);
      
      // Call API to get user profile data
      const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/user&session_id=${window.authManager.sessionId}&get_picture_430=1`);
      const data = await response.json();
      
      if (data.connected === 1 && data.result) {
        this.updateProfileDisplay(data.result);
      } else {
        console.log('[DASHBOARD] Could not load profile data:', data);
      }
      
    } catch (error) {
      console.error('[DASHBOARD] Error loading profile:', error);
    } finally {
      this.showLoading(false);
    }
  }

  updateProfileDisplay(profileData) {
    // Update profile name
    const profileName = document.getElementById('profileName');
    if (profileName && profileData.pseudo) {
      profileName.textContent = profileData.pseudo;
    }

    // Update location
    const profileLocation = document.getElementById('profileLocation');
    if (profileLocation && profileData.zone_name) {
      profileLocation.textContent = profileData.zone_name;
    }

    // Update age
    const profileAge = document.getElementById('profileAge');
    if (profileAge && profileData.age) {
      profileAge.textContent = `${profileData.age} years old`;
    }

    // Update profile completion
    this.updateProfileCompletion(profileData);
  }

  updateProfileCompletion(profileData) {
    let completionPercentage = 25; // Base for having an account
    
    // Add points for completed fields
    if (profileData.nom_complet && profileData.nom_complet.trim()) completionPercentage += 15;
    if (profileData.description && profileData.description.trim()) completionPercentage += 20;
    if (profileData.photo > 0) completionPercentage += 25;
    if (profileData.ville) completionPercentage += 10;
    if (profileData.travail && profileData.travail > 0) completionPercentage += 5;
    
    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${Math.min(completionPercentage, 100)}%`;
    }
    
    // Update percentage text
    const percentageText = document.querySelector('.profile-completion span:last-child');
    if (percentageText) {
      percentageText.textContent = `${Math.min(completionPercentage, 100)}%`;
    }
  }

  async loadMessages() {
    // Placeholder for messages functionality
    console.log('[DASHBOARD] Loading messages...');
  }

  async loadMatches() {
    // Placeholder for matches functionality
    console.log('[DASHBOARD] Loading matches...');
  }

  async loadVisitors() {
    // Placeholder for visitors functionality
    console.log('[DASHBOARD] Loading visitors...');
  }

  async loadSearch() {
    // Placeholder for search functionality
    console.log('[DASHBOARD] Loading search...');
  }

  editProfile() {
    // For now, show a coming soon message
    this.showComingSoon('Profile editing');
  }

  confirmDeleteAccount() {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmed) {
      const doubleConfirmed = confirm('This will permanently delete all your data, photos, and connections. Are you absolutely sure?');
      if (doubleConfirmed) {
        this.deleteAccount();
      }
    }
  }

  async deleteAccount() {
    if (!window.authManager.sessionId) return;

    try {
      this.showLoading(true);
      
      const response = await fetch('/api/spice-multi-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: '/index_api/delete_account',
          session_id: window.authManager.sessionId,
          ActionDelete: 1
        })
      });

      const data = await response.json();
      
      if (data.result === 'Deletion effectuée' || data.result === 'Suppression effectuée') {
        alert('Your account has been successfully deleted.');
        await window.authManager.logout();
        window.location.href = '/';
      } else {
        alert('There was an error deleting your account. Please try again or contact support.');
      }
      
    } catch (error) {
      console.error('[DASHBOARD] Error deleting account:', error);
      alert('There was an error deleting your account. Please check your connection and try again.');
    } finally {
      this.showLoading(false);
    }
  }

  showComingSoon(feature) {
    alert(`${feature} is coming soon! We're working hard to bring you this feature.`);
  }

  showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      if (show) {
        loadingOverlay.classList.add('active');
      } else {
        loadingOverlay.classList.remove('active');
      }
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for AuthManager to initialize
  setTimeout(() => {
    window.dashboard = new Dashboard();
  }, 100);
});

console.log('[DASHBOARD] Dashboard script loaded');