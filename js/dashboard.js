/**
 * Lavrilo Dashboard JavaScript
 * Handles dashboard navigation and user profile management
 */

class Dashboard {
  constructor() {
    this.currentPage = 'profile';
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
    this.setupNavigation();
    this.setupEventListeners();
    this.createUserMenu();
    this.setupProfileEditModal(); // Setup profile editing
    this.updateUserInfo();
    this.loadUserProfile();
    
    // Initialize photo manager
    if (window.photoManager) {
      window.photoManager.init();
      console.log('[DASHBOARD] Photo manager initialized');
    }
    
    console.log('[DASHBOARD] Dashboard initialized for user:', window.authManager.currentUser.pseudo);
  }

  createUserMenu() {
    // Delegate to AuthManager to create user menu
    if (window.authManager && window.authManager.createUserMenu) {
      window.authManager.createUserMenu();
    }
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
      
      // Get user ID from localStorage
      const userDataString = localStorage.getItem('lavrilo_user');
      if (!userDataString) {
        console.log('[DASHBOARD] No user data found in localStorage');
        return;
      }
      
      const userData = JSON.parse(userDataString);
      const userId = userData.id;
      
      if (!userId) {
        console.log('[DASHBOARD] No user ID found in user data');
        return;
      }
      
      // Call API to get user profile data (POST method with required id parameter)
      const apiUrl = `/api/spice-multi-test?endpoint=/index_api/user&method=POST&session_id=${window.authManager.sessionId}&id=${userId}&get_picture_430=1&get_title=1&get_wall_news=1`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if ((data.data?.connected === 1 || data.data?.connected === "1") && data.data?.result) {
        this.updateProfileDisplay(data.data.result);
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
    // Store profile data for editing
    this.currentProfileData = profileData;
    
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
    console.log('[DASHBOARD] Loading messages system...');
    this.setupMessagesEventListeners();
    this.initializeMessagesSystem();
    await this.loadContacts();
    this.startMessagePolling();
  }

  async loadMatches() {
    console.log('[DASHBOARD] Loading matches functionality...');
    
    // Initialize matching system if not already done
    if (!window.matchingSystem) {
      // The matching system will initialize itself when the script loads
      console.log('[DASHBOARD] Waiting for matching system to initialize...');
      
      // Wait a moment for the matching system to load
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!window.matchingSystem && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.matchingSystem) {
        console.warn('[DASHBOARD] Matching system failed to initialize');
        return;
      }
    }
    
    console.log('[DASHBOARD] Matching system ready');
  }

  async loadVisitors() {
    // Placeholder for visitors functionality
    console.log('[DASHBOARD] Loading visitors...');
  }

  async loadSearch() {
    console.log('[DASHBOARD] Loading search functionality...');
    this.setupSearchEventListeners();
    this.resetSearchResults();
  }

  setupSearchEventListeners() {
    const performSearchBtn = document.getElementById('performSearch');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    if (performSearchBtn) {
      performSearchBtn.addEventListener('click', () => this.performSearch());
    }

    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => this.changePage(-1));
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => this.changePage(1));
    }

    // Search on Enter key
    const ageFromInput = document.getElementById('searchAgeFrom');
    const ageToInput = document.getElementById('searchAgeTo');

    [ageFromInput, ageToInput].forEach(input => {
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.performSearch();
          }
        });
      }
    });
  }

  resetSearchResults() {
    const searchStatus = document.getElementById('searchStatus');
    const resultsGrid = document.getElementById('resultsGrid');
    const searchPagination = document.getElementById('searchPagination');

    if (searchStatus) {
      searchStatus.innerHTML = '<p>👋 Ready to find your perfect match? Use the filters above to start searching!</p>';
      searchStatus.className = 'search-status';
    }

    if (resultsGrid) {
      resultsGrid.innerHTML = '';
    }

    if (searchPagination) {
      searchPagination.style.display = 'none';
    }

    this.currentPage = 1;
    this.totalPages = 1;
    this.currentSearchParams = null;
  }

  async performSearch(page = 1) {
    const searchBtn = document.getElementById('performSearch');
    const searchStatus = document.getElementById('searchStatus');
    const resultsGrid = document.getElementById('resultsGrid');

    try {
      // Collect filter values
      const filters = this.collectSearchFilters();
      
      console.log('[SEARCH] Performing search with filters:', filters);

      // Show loading state
      if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '🔄 Searching...';
      }

      if (searchStatus) {
        searchStatus.innerHTML = '<p>🔍 Searching for users...</p>';
        searchStatus.className = 'search-status loading';
      }

      if (resultsGrid) {
        resultsGrid.innerHTML = '';
      }

      // Call search API
      const searchResults = await this.callSearchAPI(filters, page);

      if (searchResults.success) {
        this.displaySearchResults(searchResults);
        this.updateSearchPagination(searchResults);
        this.currentSearchParams = filters;
        this.currentPage = page;
      } else {
        this.showSearchError(searchResults.error || 'Search failed');
      }

    } catch (error) {
      console.error('[SEARCH] Error:', error);
      this.showSearchError(error.message);
    } finally {
      // Reset button state
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.innerHTML = '🔍 Search Users';
      }
    }
  }

  collectSearchFilters() {
    const filters = {};

    // Gender filter
    const gender = document.getElementById('searchGender')?.value;
    if (gender) filters.sex = gender;

    // Age filters
    const ageFrom = document.getElementById('searchAgeFrom')?.value;
    const ageTo = document.getElementById('searchAgeTo')?.value;
    if (ageFrom) filters.age_from = parseInt(ageFrom);
    if (ageTo) filters.age_to = parseInt(ageTo);

    // Boolean filters
    const onlineOnly = document.getElementById('searchOnlineOnly')?.checked;
    const withPhoto = document.getElementById('searchWithPhoto')?.checked;
    
    if (onlineOnly) filters.is_online = 1;
    if (withPhoto) filters.is_photo = 1;

    return filters;
  }

  async callSearchAPI(filters, page) {
    const apiUrl = `/api/spice-multi-test?endpoint=/index_api/search&method=POST&session_id=${window.authManager.sessionId}`;
    
    // Prepare search parameters
    const params = new URLSearchParams();
    
    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    // Add pagination
    params.append('page', (page - 1).toString()); // API uses 0-based pagination
    params.append('pas', '12'); // Results per page

    console.log('[SEARCH] API call with params:', params.toString());

    const response = await fetch(`${apiUrl}&${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('[SEARCH] API Response:', result);

    // Check for success according to API documentation
    if (result.success && result.data) {
      return {
        success: true,
        users: result.data.result || [],
        total: result.data.total || 0,
        pages: result.data.nb_pages || 1,
        currentPage: page
      };
    } else {
      return {
        success: false,
        error: result.data?.error || result.error || 'Search failed'
      };
    }
  }

  displaySearchResults(searchResults) {
    const searchStatus = document.getElementById('searchStatus');
    const resultsGrid = document.getElementById('resultsGrid');

    if (!searchResults.users || searchResults.users.length === 0) {
      // No results
      if (searchStatus) {
        searchStatus.innerHTML = '<p>😔 No users found matching your criteria. Try adjusting your filters!</p>';
        searchStatus.className = 'search-status no-results';
      }
      if (resultsGrid) {
        resultsGrid.innerHTML = '';
      }
      return;
    }

    // Show results count
    if (searchStatus) {
      const total = searchResults.total;
      const resultsText = total === 1 ? 'user' : 'users';
      searchStatus.innerHTML = `<p>✨ Found ${total} ${resultsText} matching your search!</p>`;
      searchStatus.className = 'search-status';
    }

    // Display user cards
    if (resultsGrid) {
      resultsGrid.innerHTML = searchResults.users.map(user => this.createUserCard(user)).join('');
    }
  }

  createUserCard(user) {
    // Extract user information (structure may vary based on API response)
    const userId = user.id || user.user_id || 'unknown';
    const username = user.pseudo || user.username || user.name || 'Unknown';
    const age = user.age || '?';
    const city = user.ville || user.city || '';
    const isOnline = user.is_online === 1 || user.is_online === '1';
    const hasPhoto = user.photo_url || user.avatar || user.picture;
    
    const statusClass = isOnline ? 'online' : 'offline';
    const statusText = isOnline ? '🟢 Online' : '⚫ Offline';
    
    const locationText = city ? `${age}, ${city}` : `${age} years old`;

    return `
      <div class="user-card" data-user-id="${userId}">
        <div class="user-avatar">
          ${hasPhoto ? `<img src="${hasPhoto}" alt="${username}" onerror="this.style.display='none'">` : '👤'}
        </div>
        
        <div class="user-info">
          <div class="user-name">${username}</div>
          <div class="user-details">${locationText}</div>
          <div class="user-status ${statusClass}">${statusText}</div>
        </div>
        
        <div class="user-actions">
          <button class="btn-primary btn-sm" onclick="dashboard.viewUserProfile('${userId}')">
            👁️ View
          </button>
          <button class="btn-secondary btn-sm" onclick="dashboard.sendMessage('${userId}')">
            💬 Message
          </button>
        </div>
      </div>
    `;
  }

  updateSearchPagination(searchResults) {
    const searchPagination = document.getElementById('searchPagination');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    if (!searchPagination) return;

    const totalPages = searchResults.pages || 1;
    const currentPage = searchResults.currentPage || 1;

    this.totalPages = totalPages;
    this.currentPage = currentPage;

    if (totalPages <= 1) {
      searchPagination.style.display = 'none';
      return;
    }

    searchPagination.style.display = 'flex';

    if (prevPageBtn) {
      prevPageBtn.disabled = currentPage <= 1;
    }

    if (nextPageBtn) {
      nextPageBtn.disabled = currentPage >= totalPages;
    }

    if (pageInfo) {
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
  }

  async changePage(direction) {
    if (!this.currentSearchParams) return;

    const newPage = this.currentPage + direction;
    
    if (newPage < 1 || newPage > this.totalPages) return;

    await this.performSearch(newPage);
  }

  showSearchError(message) {
    const searchStatus = document.getElementById('searchStatus');
    
    if (searchStatus) {
      searchStatus.innerHTML = `<p>❌ ${message}</p>`;
      searchStatus.className = 'search-status no-results';
    }

    this.showNotification(message, 'error');
  }

  // User interaction methods (placeholders for now)
  async viewUserProfile(userId) {
    console.log('[SEARCH] Viewing user profile:', userId);
    this.showNotification(`Opening profile for user ${userId}`, 'info');
    // TODO: Implement profile viewing logic
  }

  async sendMessage(userId) {
    console.log('[SEARCH] Sending message to user:', userId);
    this.showNotification(`Opening chat with user ${userId}`, 'info');
    // TODO: Implement messaging logic
  }

  editProfile() {
    // Open profile editing modal
    this.openProfileEditor();
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

  // Profile Management Methods
  setupProfileEditModal() {
    const editBtn = document.getElementById('editProfileBtn');
    const modal = document.getElementById('profileEditModal');
    const closeBtn = document.getElementById('closeProfileModal');
    const cancelBtn = document.getElementById('cancelProfileEdit');
    const form = document.getElementById('profileEditForm');
    const overlay = modal?.querySelector('.modal-overlay');

    if (editBtn && modal) {
      editBtn.addEventListener('click', () => this.openProfileEditor());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeProfileEditor());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeProfileEditor());
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.closeProfileEditor());
    }

    if (form) {
      form.addEventListener('submit', (e) => this.handleProfileSubmit(e));
    }

    // Setup character counter for description
    const descriptionField = document.getElementById('profileDescription');
    const counter = document.getElementById('descriptionCounter');
    
    if (descriptionField && counter) {
      descriptionField.addEventListener('input', () => {
        const length = descriptionField.value.length;
        counter.textContent = length;
        
        const counterContainer = counter.parentElement;
        counterContainer.classList.remove('warning', 'error');
        
        if (length > 400) {
          counterContainer.classList.add('warning');
        }
        if (length > 500) {
          counterContainer.classList.add('error');
        }
      });
    }
  }

  openProfileEditor() {
    const modal = document.getElementById('profileEditModal');
    if (modal) {
      // Load current profile data into form
      this.loadProfileDataIntoForm();
      
      // Show modal
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeProfileEditor() {
    const modal = document.getElementById('profileEditModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Reset form
      const form = document.getElementById('profileEditForm');
      if (form) {
        form.reset();
      }
    }
  }

  loadProfileDataIntoForm() {
    if (!this.currentProfileData) return;

    const data = this.currentProfileData;
    
    // Basic Information
    this.setFormValue('fullName', data.nom_complet || '');
    this.setFormValue('firstName', data.prenom || '');
    this.setFormValue('height', data.taille || '');
    this.setFormValue('weight', data.poids || '');
    this.setFormValue('eyeColor', data.yeux || '0');
    this.setFormValue('hairColor', data.cheveux || '0');
    
    // Lifestyle & Background
    this.setFormValue('education', data.etudes || '0');
    this.setFormValue('profession', data.travail || '0');
    this.setFormValue('maritalStatus', data.situation || '0');
    this.setFormValue('children', data.child || '0');
    this.setFormValue('bodyType', data.silhouette || '0');
    this.setFormValue('personality', data.personnalite || '0');
    this.setFormValue('orientation', data.sexe2 || '1');
    this.setFormValue('onlineTime', data.horaires || '0');
    
    // Description
    this.setFormValue('profileDescription', data.description || '');
    
    // Update character counter
    const descriptionField = document.getElementById('profileDescription');
    const counter = document.getElementById('descriptionCounter');
    if (descriptionField && counter) {
      counter.textContent = descriptionField.value.length;
    }
  }

  setFormValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = value;
    }
  }

  async handleProfileSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('saveProfileChanges');
    if (submitBtn) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
    }

    try {
      const formData = new FormData(e.target);
      const profileData = {};
      
      // Convert FormData to object
      for (let [key, value] of formData.entries()) {
        profileData[key] = value;
      }

      // Validate required fields
      if (!profileData.nom_complet?.trim()) {
        throw new Error('Full name is required');
      }

      console.log('[PROFILE] Saving profile data:', profileData);

      // Save basic information
      await this.saveProfileInformation(profileData);
      
      // Save description separately if it exists
      if (profileData.description?.trim()) {
        await this.saveProfileDescription(profileData.description);
      }

      // Reload profile data
      await this.loadUserProfile();
      
      // Close modal
      this.closeProfileEditor();
      
      // Show success message
      this.showNotification('Profile updated successfully!', 'success');
      
    } catch (error) {
      console.error('[PROFILE] Error saving profile:', error);
      this.showNotification(error.message || 'Failed to save profile. Please try again.', 'error');
    } finally {
      const submitBtn = document.getElementById('saveProfileChanges');
      if (submitBtn) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    }
  }

  async saveProfileInformation(data) {
    const apiUrl = `/api/spice-multi-test?endpoint=/index_api/user/modify/informations&method=POST&session_id=${window.authManager.sessionId}`;
    
    // Add all profile data as query parameters
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'description' && value && value.toString().trim()) {
        params.append(key, value.toString().trim());
      }
    });
    
    console.log('[PROFILE] API URL:', `${apiUrl}&${params.toString()}`);
    
    const response = await fetch(`${apiUrl}&${params.toString()}`, {
      method: 'POST'
    });
    
    const result = await response.json();
    console.log('[PROFILE] API Response:', result);
    
    // Check API proxy response first
    if (!result.success) {
      throw new Error(result.error || 'API proxy error');
    }
    
    // Check actual API response - if data exists, check for acceptance
    if (result.data) {
      // If connected = 0, it means session issues, but accepted = 1 means profile update worked
      if (result.data.accepted && result.data.accepted === 1) {
        console.log('[PROFILE] Profile update accepted by API');
        return result;
      }
      
      // If there's an error in the API response
      if (result.data.error) {
        throw new Error(result.data.error);
      }
      
      // For some APIs, connected = 0 is not necessarily an error for updates
      if (result.data.connected === 0) {
        console.log('[PROFILE] Session may be expired, but checking if update was processed...');
        // Don't throw error immediately, let it continue
      }
    }
    
    return result;
  }

  async saveProfileDescription(description) {
    const apiUrl = `/api/spice-multi-test?endpoint=/index_api/user/modify/description&method=POST&session_id=${window.authManager.sessionId}&description=${encodeURIComponent(description)}`;
    
    console.log('[PROFILE] Description API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST'
    });
    
    const result = await response.json();
    console.log('[PROFILE] Description API Response:', result);
    
    // Check API proxy response first
    if (!result.success) {
      throw new Error(result.error || 'API proxy error');
    }
    
    // Check actual API response - if data exists, check for acceptance
    if (result.data) {
      // If accepted = 1, update was successful
      if (result.data.accepted && result.data.accepted === 1) {
        console.log('[PROFILE] Description update accepted by API');
        return result;
      }
      
      // If there's an error in the API response
      if (result.data.error) {
        throw new Error(result.data.error);
      }
      
      // For some APIs, connected = 0 is not necessarily an error for updates
      if (result.data.connected === 0) {
        console.log('[PROFILE] Session may be expired, but checking if description was processed...');
        // Don't throw error immediately, let it continue
      }
    }
    
    return result;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span class="notification-message">${message}</span>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('active'), 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.classList.remove('active');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  // Messages System Methods
  setupMessagesEventListeners() {
    // Refresh contacts button
    const refreshBtn = document.getElementById('refreshContacts');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadContacts());
    }

    // Contacts search
    const searchInput = document.getElementById('contactsSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterContacts(e.target.value));
    }

    // Message input handling
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    const charCount = document.getElementById('messageCharCount');

    if (messageInput) {
      messageInput.addEventListener('input', (e) => {
        const text = e.target.value;
        const length = text.length;
        
        // Update character count
        if (charCount) {
          charCount.textContent = `${length}/1000`;
        }
        
        // Enable/disable send button
        if (sendBtn) {
          sendBtn.disabled = length === 0 || length > 1000;
        }
        
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
      });

      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    // Send button click
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.handleSendMessage());
    }
  }

  initializeMessagesSystem() {
    this.currentChatUserId = null;
    this.messagePollingInterval = null;
    this.lastMessageId = null;
    this.contacts = [];
    
    // Update connection status
    this.updateConnectionStatus('online');
  }

  updateConnectionStatus(status) {
    const statusIndicator = document.getElementById('connectionStatus');
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${status}`;
      statusIndicator.textContent = status === 'online' ? 'Connected' : 'Connecting...';
    }
  }
  // Navigation Methods
  setupNavigation() {
    console.log('[DASHBOARD] Setting up navigation');
    
    // Add click listeners to navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) {
          this.navigateToPage(page);
        }
      });
    });
    
    // Setup mobile menu toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
    }
    
    // Update user name in header
    this.updateHeaderUserInfo();
  }
  
  navigateToPage(page) {
    console.log('[DASHBOARD] Navigating to page:', page);
    
    // Update current page
    this.currentPage = page;
    
    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(pageEl => {
      pageEl.style.display = 'none';
    });
    
    // Show selected page
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
      targetPage.style.display = 'block';
      
      // Load page-specific data
      this.loadPageData(page);
    }
    
    // Close mobile menu if open
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
      navMenu.classList.remove('active');
    }
  }
  
  loadPageData(page) {
    switch (page) {
      case 'profile':
        this.loadUserProfile();
        break;
      case 'messages':
        this.loadMessages();
        break;
      case 'discover':
        // Matching system will handle this
        if (window.matchingSystem && typeof window.matchingSystem.switchMode === 'function') {
          window.matchingSystem.switchMode('tinder');
        }
        break;
      case 'matches':
        this.loadMatches();
        break;
      case 'visitors':
        this.loadVisitors();
        break;
      case 'search':
        this.loadSearch();
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  }
  
  updateHeaderUserInfo() {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (window.authManager && window.authManager.currentUser) {
      if (userName) {
        userName.textContent = window.authManager.currentUser.pseudo || 'User';
      }
      
      // Update avatar if available
      if (userAvatar && window.photoManager && window.photoManager.photos) {
        const mainPhoto = window.photoManager.photos.find(p => p.is_main);
        if (mainPhoto && mainPhoto.url) {
          userAvatar.src = mainPhoto.url;
        }
      }
    }
  }
  
  // Placeholder methods for loading different page data
  loadMessages() {
    console.log('[DASHBOARD] Loading messages...');
    // Messages loading logic will be implemented
  }
  
  loadMatches() {
    console.log('[DASHBOARD] Loading matches...');
    // Matches loading logic will be implemented
  }
  
  loadVisitors() {
    console.log('[DASHBOARD] Loading visitors...');
    // Visitors loading logic will be implemented
  }
  
  loadSearch() {
    console.log('[DASHBOARD] Loading search...');
    // Search loading logic will be implemented
  }
  
  loadSettings() {
    console.log('[DASHBOARD] Loading settings...');
    // Settings loading logic will be implemented
  }
}

// Global logout function
function logout() {
  if (window.authManager && typeof window.authManager.logout === 'function') {
    window.authManager.logout();
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