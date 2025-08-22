/**
 * Lavrilo Authentication Manager
 * Handles user sessions, login/logout, and auto-login functionality
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.sessionId = null;
    this.tokenLogin = null;
    this.isLoggedIn = false;
    
    // Load saved session on initialization
    this.loadSavedSession();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.isLoggedIn && this.sessionId && this.currentUser;
  }

  /**
   * Get user ID
   */
  get userId() {
    return this.currentUser ? this.currentUser.id : null;
  }

  /**
   * Load saved session from localStorage
   */
  loadSavedSession() {
    try {
      const savedUser = localStorage.getItem('lavrilo_user');
      const savedToken = localStorage.getItem('lavrilo_token');
      const savedSession = localStorage.getItem('lavrilo_session');
      
      if (savedUser && savedToken && savedSession) {
        this.currentUser = JSON.parse(savedUser);
        this.tokenLogin = savedToken;
        this.sessionId = savedSession;
        this.isLoggedIn = true;
        
        console.log('[AUTH] Loaded saved session for user:', this.currentUser.pseudo);
        
        // Update UI for logged in user
        this.updateUIForLoggedInUser();
        
        // Verify session is still valid (non-blocking)
        this.verifySession().then(valid => {
          if (!valid) {
            console.log('[AUTH] Session verification failed, but allowing user to stay logged in for now');
          }
        });
      }
    } catch (error) {
      console.error('[AUTH] Error loading saved session:', error);
      this.clearSession();
    }
  }

  /**
   * Save session to localStorage
   */
  saveSession() {
    try {
      if (this.currentUser && this.tokenLogin && this.sessionId) {
        localStorage.setItem('lavrilo_user', JSON.stringify(this.currentUser));
        localStorage.setItem('lavrilo_token', this.tokenLogin);
        localStorage.setItem('lavrilo_session', this.sessionId);
        console.log('[AUTH] Session saved to localStorage');
      }
    } catch (error) {
      console.error('[AUTH] Error saving session:', error);
    }
  }

  /**
   * Clear session from localStorage
   */
  clearSession() {
    localStorage.removeItem('lavrilo_user');
    localStorage.removeItem('lavrilo_token');
    localStorage.removeItem('lavrilo_session');
    
    this.currentUser = null;
    this.sessionId = null;
    this.tokenLogin = null;
    this.isLoggedIn = false;
    
    console.log('[AUTH] Session cleared');
  }

  /**
   * Login user with username and password
   */
  async login(username, password, rememberMe = true) {
    try {
      console.log('[AUTH] Attempting login for:', username);
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          login: username,
          pass: password,
          rememberme: rememberMe ? '1' : '0'
        })
      });

      const data = await response.json();
      
      if (data.success && (data.connected === 1 || data.connected === "1")) {
        // Login successful
        this.currentUser = {
          id: data.user_id,
          pseudo: username,
          lang: data.lang_ui
        };
        this.sessionId = data.session_id;
        this.tokenLogin = data.token_login;
        this.isLoggedIn = true;
        
        if (rememberMe) {
          this.saveSession();
        }
        
        console.log('[AUTH] Login successful for:', username);
        console.log('[AUTH] About to call onLoginSuccess()');
        this.onLoginSuccess();
        
        return { success: true, user: this.currentUser };
      } else {
        console.log('[AUTH] Login failed:', data);
        return { success: false, error: data.error || 'Invalid credentials' };
      }
      
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Auto-login with saved token
   */
  async autoLogin() {
    if (!this.tokenLogin) return false;
    
    try {
      console.log('[AUTH] Attempting auto-login with token');
      
      // Use token as password for auto-login
      const result = await this.login(this.currentUser.pseudo, this.tokenLogin, true);
      
      if (result.success) {
        console.log('[AUTH] Auto-login successful');
        return true;
      } else {
        console.log('[AUTH] Auto-login failed, clearing session');
        this.clearSession();
        return false;
      }
      
    } catch (error) {
      console.error('[AUTH] Auto-login error:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      console.log('[AUTH] Attempting registration for:', userData.login);
      
      // Get user IP for registration
      const userIP = await this.getUserIP();
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register',
          login: userData.login,
          pass: userData.pass,
          mail: userData.email,
          sex: userData.gender,
          cherche1: userData.looking_for,
          year: userData.birth_year,
          month: userData.birth_month,
          day: userData.birth_day,
          ip_adress: userIP,
          city: userData.city || 1, // Default city if not provided
          region: userData.region || 1, // Default region
          countryObj: userData.country || 64, // Default to France
          'fast-part': userData.fastRegistration ? '1' : '0'
        })
      });

      const data = await response.json();
      
      if (data.success && data.session_id) {
        console.log('[AUTH] Registration successful for:', userData.login);
        
        // Auto-login after successful registration
        this.currentUser = {
          id: data.user_id,
          pseudo: userData.login,
          lang: data.lang_ui
        };
        this.sessionId = data.session_id;
        this.isLoggedIn = true;
        
        this.saveSession();
        this.onLoginSuccess();
        
        return { success: true, user: this.currentUser };
      } else {
        console.log('[AUTH] Registration failed:', data);
        return { success: false, error: data.error || 'Registration failed' };
      }
      
    } catch (error) {
      console.error('[AUTH] Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      if (this.sessionId) {
        await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'logout',
            session_id: this.sessionId
          })
        });
      }
      
      console.log('[AUTH] Logout successful');
      this.clearSession();
      this.onLogout();
      
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
      // Clear session anyway
      this.clearSession();
      this.onLogout();
    }
  }

  /**
   * Get current user email from API
   * @returns {Promise<string|null>} User email or null if failed
   */
  async getCurrentUserEmail() {
    if (!this.isLoggedIn || !this.sessionId || !this.currentUser?.id) {
      console.warn('[AUTH] Cannot get email: user not logged in');
      return null;
    }

    try {
      console.log('[AUTH] Fetching user email from API...');
      
      const response = await fetch('/api/spice-multi-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/index_api/user',
          session_id: this.sessionId,
          id: this.currentUser.id
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.result) {
        const email = result.data.result.email;
        if (email) {
          console.log('[AUTH] User email retrieved successfully');
          return email;
        } else {
          console.warn('[AUTH] No email found in user profile');
          return null;
        }
      } else {
        console.error('[AUTH] Failed to get user profile:', result.error);
        return null;
      }
    } catch (error) {
      console.error('[AUTH] Error fetching user email:', error);
      return null;
    }
  }

  /**
   * Verify current session is still valid
   */
  async verifySession() {
    if (!this.sessionId) return false;
    
    try {
      // Use any authenticated endpoint to verify session
      const response = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/online&session_id=${this.sessionId}`);
      const data = await response.json();
      
      if (data.data?.connected === "1" || data.data?.connected === 1) {
        console.log('[AUTH] Session verified as valid');
        return true;
      } else {
        console.log('[AUTH] Session invalid, but keeping user logged in');
        return false;
      }
      
    } catch (error) {
      console.error('[AUTH] Session verification error:', error);
      return false;
    }
  }

  /**
   * Get user's IP address
   */
  async getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || '127.0.0.1';
    } catch (error) {
      console.error('[AUTH] Error getting IP:', error);
      return '127.0.0.1';
    }
  }

  /**
   * Called after successful login
   */
  onLoginSuccess() {
    console.log('[AUTH] onLoginSuccess() called - starting post-login process');
    
    // Update UI elements
    this.updateUIForLoggedInUser();
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('userLoggedIn', {
      detail: { user: this.currentUser }
    }));
    
    console.log('[AUTH] About to call redirectToProfile()');
    // Redirect to profile after successful authentication
    this.redirectToProfile();
  }
  
  /**
   * Redirect user to profile
   */
  redirectToProfile() {
    console.log('[AUTH] redirectToProfile() called, scheduling redirect in 800ms');
    // Small delay to ensure UI updates are complete
    setTimeout(() => {
      console.log('[AUTH] Executing redirect to dashboard.html NOW');
      window.location.href = 'main.html';
    }, 800);
  }

  /**
   * Called after logout
   */
  onLogout() {
    // Update UI elements
    this.updateUIForLoggedOutUser();
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    // Redirect to home page after logout
    this.redirectToHome();
  }
  
  /**
   * Redirect user to home page
   */
  redirectToHome() {
    // Small delay to ensure UI updates are complete
    setTimeout(() => {
      console.log('[AUTH] Redirecting to home page...');
      window.location.href = '/';
    }, 500);
  }

  /**
   * Update UI for logged in user
   */
  updateUIForLoggedInUser() {
    // Hide login/register buttons, show user menu
    const loginBtn = document.querySelector('.login-btn');
    const registerSection = document.querySelector('.registration-section');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerSection) registerSection.style.display = 'none';
    
    // Show user info in header
    this.createUserMenu();
  }

  /**
   * Update UI for logged out user
   */
  updateUIForLoggedOutUser() {
    const loginBtn = document.querySelector('.login-btn');
    const registerSection = document.querySelector('.registration-section');
    const userMenu = document.querySelector('.user-menu');
    
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerSection) registerSection.style.display = 'block';
    if (userMenu) userMenu.remove();
  }

  /**
   * Create user menu in header
   */
  createUserMenu() {
    // Try dashboard placeholder first, then fallback to header nav
    let container = document.querySelector('.user-menu-placeholder');
    if (!container) {
      container = document.querySelector('header nav');
    }
    
    if (!container || document.querySelector('.user-menu')) return;
    
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
      <div class="user-info">
        <span class="user-name">Hello, ${this.currentUser.pseudo}!</span>
        <div class="user-dropdown">
          <button class="dashboard-btn">Profile</button>
          <button class="logout-btn">Logout</button>
        </div>
      </div>
    `;
    
    container.appendChild(userMenu);
    
    // Add event listeners
    userMenu.querySelector('.dashboard-btn').addEventListener('click', () => {
      this.goToProfile();
    });
    
    userMenu.querySelector('.logout-btn').addEventListener('click', () => {
      this.logout();
    });
  }

  /**
   * Navigate to user dashboard
   */
  goToProfile() {
    window.location.href = '/dashboard.html';
  }
}

// Create global instance
window.authManager = new AuthManager();

// Auto-login on page load if session exists
document.addEventListener('DOMContentLoaded', () => {
  if (window.authManager.tokenLogin && !window.authManager.isLoggedIn) {
    window.authManager.autoLogin();
  }
});

console.log('[AUTH] AuthManager initialized');