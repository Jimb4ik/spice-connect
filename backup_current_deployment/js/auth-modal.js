/**
 * Lavrilo Authentication Modal
 * Handles login/registration UI
 */

class AuthModal {
  constructor() {
    this.currentMode = 'login'; // 'login', 'register', 'forgot'
    this.isVisible = false;
    this.createModal();
    this.setupEventListeners();
  }

  createModal() {
    // Create modal HTML
    const modalHTML = `
      <div class="auth-modal-overlay" id="authModal">
        <div class="auth-modal">
          <button class="auth-modal-close" id="authModalClose">&times;</button>
          
          <div id="authModalContent">
            <!-- Content will be dynamically loaded here -->
          </div>
        </div>
      </div>
    `;

    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    this.modal = document.getElementById('authModal');
    this.content = document.getElementById('authModalContent');
    
    // Load initial content
    this.showLogin();
  }

  setupEventListeners() {
    // Close modal events
    document.getElementById('authModalClose').addEventListener('click', () => {
      this.hide();
    });
    
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  show() {
    this.isVisible = true;
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  hide() {
    this.isVisible = false;
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clear any error messages
    this.clearMessages();
  }

  showLogin() {
    this.currentMode = 'login';
    this.content.innerHTML = `
      <h2>Welcome Back!</h2>
      
      <div class="auth-error-message" id="authError"></div>
      <div class="auth-success-message" id="authSuccess"></div>
      
      <form class="auth-form" id="loginForm">
        <div class="auth-form-group">
          <label for="loginUsername">Username</label>
          <input type="text" id="loginUsername" required autocomplete="username">
        </div>
        
        <div class="auth-form-group">
          <label for="loginPassword">Password</label>
          <input type="password" id="loginPassword" required autocomplete="current-password">
        </div>
        
        <div class="auth-checkbox-group">
          <input type="checkbox" id="rememberMe" checked>
          <label for="rememberMe">Remember me</label>
        </div>
        
        <button type="submit" class="auth-submit-btn" id="loginSubmit">
          <span class="btn-text">Sign In</span>
        </button>
      </form>
      
      <div class="auth-modal-footer">
        <p>Don't have an account? <a class="auth-footer-link" id="showRegister">Sign up</a></p>
        <p style="margin-top: 10px;"><a class="auth-footer-link" id="showForgot">Forgot password?</a></p>
      </div>
    `;
    
    this.setupLoginEvents();
  }

  showRegister() {
    this.currentMode = 'register';
    this.content.innerHTML = `
      <h2>Join Lavrilo!</h2>
      
      <div class="auth-error-message" id="authError"></div>
      <div class="auth-success-message" id="authSuccess"></div>
      
      <form class="auth-form" id="registerForm">
        <div class="auth-form-group">
          <label for="regUsername">Username</label>
          <input type="text" id="regUsername" required>
        </div>
        
        <div class="auth-form-group">
          <label for="regEmail">Email</label>
          <input type="email" id="regEmail" required>
        </div>
        
        <div class="auth-form-group">
          <label for="regPassword">Password</label>
          <input type="password" id="regPassword" required minlength="6">
        </div>
        
        <div class="auth-form-group">
          <label for="regConfirmPassword">Confirm Password</label>
          <input type="password" id="regConfirmPassword" required>
        </div>
        
        <div class="auth-form-group">
          <label for="regGender">I am</label>
          <select id="regGender" required>
            <option value="">Select...</option>
            <option value="1">Man</option>
            <option value="2">Woman</option>
            <option value="3">Couple</option>
          </select>
        </div>
        
        <div class="auth-form-group">
          <label for="regLookingFor">Looking for</label>
          <select id="regLookingFor" required>
            <option value="">Select...</option>
            <option value="1">Men</option>
            <option value="2">Women</option>
            <option value="3">Couples</option>
          </select>
        </div>
        
        <div class="auth-form-group">
          <label for="regBirthDate">Birth Date</label>
          <input type="date" id="regBirthDate" required>
        </div>
        
        <div class="auth-checkbox-group">
          <input type="checkbox" id="fastRegistration" checked>
          <label for="fastRegistration">Quick registration (complete profile later)</label>
        </div>
        
        <button type="submit" class="auth-submit-btn" id="registerSubmit">
          <span class="btn-text">Create Account</span>
        </button>
      </form>
      
      <div class="auth-modal-footer">
        <p>Already have an account? <a class="auth-footer-link" id="showLogin">Sign in</a></p>
      </div>
    `;
    
    this.setupRegisterEvents();
  }

  showForgotPassword() {
    this.currentMode = 'forgot';
    this.content.innerHTML = `
      <h2>Reset Password</h2>
      
      <div class="auth-error-message" id="authError"></div>
      <div class="auth-success-message" id="authSuccess"></div>
      
      <p style="text-align: center; color: #64748b; margin-bottom: 25px;">
        Enter your username and we'll help you reset your password.
      </p>
      
      <form class="auth-form" id="forgotForm">
        <div class="auth-form-group">
          <label for="forgotUsername">Username</label>
          <input type="text" id="forgotUsername" required>
        </div>
        
        <button type="submit" class="auth-submit-btn" id="forgotSubmit">
          <span class="btn-text">Send Reset Instructions</span>
        </button>
      </form>
      
      <div class="auth-modal-footer">
        <p><a class="auth-footer-link" id="backToLogin">Back to login</a></p>
      </div>
    `;
    
    this.setupForgotEvents();
  }

  setupLoginEvents() {
    document.getElementById('showRegister').addEventListener('click', () => {
      this.showRegister();
    });
    
    document.getElementById('showForgot').addEventListener('click', () => {
      this.showForgotPassword();
    });
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
  }

  setupRegisterEvents() {
    document.getElementById('showLogin').addEventListener('click', () => {
      this.showLogin();
    });
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegister();
    });
    
    // Password confirmation validation
    const password = document.getElementById('regPassword');
    const confirmPassword = document.getElementById('regConfirmPassword');
    
    confirmPassword.addEventListener('input', () => {
      if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
      } else {
        confirmPassword.setCustomValidity('');
      }
    });
  }

  setupForgotEvents() {
    document.getElementById('backToLogin').addEventListener('click', () => {
      this.showLogin();
    });
    
    document.getElementById('forgotForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleForgotPassword();
    });
  }

  async handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    this.showLoading('loginSubmit', 'Signing in...');
    this.clearMessages();
    
    try {
      const result = await window.authManager.login(username, password, rememberMe);
      
      if (result.success) {
        this.showSuccess('Login successful! Welcome back.');
        // AuthManager will handle the redirect, just hide the modal after short delay
        setTimeout(() => {
          this.hide();
        }, 1000);
      } else {
        this.showError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      this.showError('Network error. Please try again.');
    }
    
    this.hideLoading('loginSubmit', 'Sign In');
  }

  async handleRegister() {
    const formData = this.getRegisterFormData();
    
    // Validate passwords match
    if (formData.pass !== formData.confirmPassword) {
      this.showError('Passwords do not match.');
      return;
    }
    
    this.showLoading('registerSubmit', 'Creating account...');
    this.clearMessages();
    
    try {
      const result = await window.authManager.register(formData);
      
      if (result.success) {
        this.showSuccess('Account created successfully! Welcome to Lavrilo.');
        // AuthManager will handle the redirect, just hide the modal after short delay
        setTimeout(() => {
          this.hide();
        }, 1000);
      } else {
        this.showError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      this.showError('Network error. Please try again.');
    }
    
    this.hideLoading('registerSubmit', 'Create Account');
  }

  async handleForgotPassword() {
    const username = document.getElementById('forgotUsername').value;
    
    this.showLoading('forgotSubmit', 'Sending...');
    this.clearMessages();
    
    // For now, show a message that this feature is coming soon
    // TODO: Implement forgot password functionality
    
    setTimeout(() => {
      this.showSuccess('Password reset instructions have been sent to your email (if the username exists).');
      this.hideLoading('forgotSubmit', 'Send Reset Instructions');
    }, 2000);
  }

  getRegisterFormData() {
    const birthDate = new Date(document.getElementById('regBirthDate').value);
    
    return {
      login: document.getElementById('regUsername').value,
      email: document.getElementById('regEmail').value, 
      pass: document.getElementById('regPassword').value,
      confirmPassword: document.getElementById('regConfirmPassword').value,
      gender: parseInt(document.getElementById('regGender').value),
      looking_for: parseInt(document.getElementById('regLookingFor').value),
      birth_year: birthDate.getFullYear(),
      birth_month: birthDate.getMonth() + 1,
      birth_day: birthDate.getDate(),
      fastRegistration: document.getElementById('fastRegistration').checked
    };
  }

  showError(message) {
    const errorEl = document.getElementById('authError');
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }

  showSuccess(message) {
    const successEl = document.getElementById('authSuccess');
    successEl.textContent = message;
    successEl.classList.add('show');
  }

  clearMessages() {
    const errorEl = document.getElementById('authError');
    const successEl = document.getElementById('authSuccess');
    
    if (errorEl) {
      errorEl.classList.remove('show');
      errorEl.textContent = '';
    }
    
    if (successEl) {
      successEl.classList.remove('show');
      successEl.textContent = '';
    }
  }

  showLoading(buttonId, text) {
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector('.btn-text');
    
    button.disabled = true;
    btnText.innerHTML = `<div class="auth-loading"></div> ${text}`;
  }

  hideLoading(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector('.btn-text');
    
    button.disabled = false;
    btnText.textContent = originalText;
  }
}

// Create global instance
window.authModal = new AuthModal();

// Setup login button click handler
document.addEventListener('DOMContentLoaded', () => {
  // Add login button click handler if it exists
  const loginBtn = document.querySelector('.login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[AUTH MODAL] Login button clicked');
      if (window.authModal) {
        window.authModal.showLogin();
        window.authModal.show();
      }
    });
  }
  
  // Also handle signup button
  const signupBtn = document.querySelector('.signup-btn');
  if (signupBtn) {
    signupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[AUTH MODAL] Signup button clicked');
      if (window.authModal) {
        window.authModal.showRegister();
        window.authModal.show();
      }
    });
  }
});

console.log('[AUTH MODAL] Authentication modal initialized');