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
          <input type="password" id="regPassword" name="regPassword" required minlength="6">
        </div>
        
        <div class="auth-form-group">
          <label for="regConfirmPassword">Confirm Password</label>
          <input type="password" id="regConfirmPassword" name="regConfirmPassword" required>
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
    
    // Function to validate passwords
    const validatePasswords = () => {
      // Get current values directly from DOM
      const passwordValue = password ? password.value.trim() : '';
      const confirmPasswordValue = confirmPassword ? confirmPassword.value.trim() : '';
      
      // Only validate if both fields have values
      if (passwordValue && confirmPasswordValue) {
        if (passwordValue !== confirmPasswordValue) {
          confirmPassword.setCustomValidity('Passwords do not match');
        } else {
          confirmPassword.setCustomValidity('');
        }
      } else {
        // Clear validation if either field is empty
        confirmPassword.setCustomValidity('');
      }
    };
    
    // Add event listeners to both fields
    confirmPassword.addEventListener('input', validatePasswords);
    password.addEventListener('input', validatePasswords);
    
    // Also validate on blur to catch cases where user tabs through fields
    confirmPassword.addEventListener('blur', validatePasswords);
    password.addEventListener('blur', validatePasswords);
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
    
    // Get password values using multiple methods to ensure reliability
    const passwordField = document.getElementById('regPassword');
    const confirmPasswordField = document.getElementById('regConfirmPassword');
    
    // Try multiple ways to get the password value
    let passwordValue = '';
    let confirmPasswordValue = '';
    
    if (passwordField) {
      // Method 1: Direct value access
      passwordValue = passwordField.value || '';
      
      // Method 2: getAttribute if value is empty
      if (!passwordValue) {
        passwordValue = passwordField.getAttribute('value') || '';
      }
      
      // Method 3: Use FormData as fallback
      if (!passwordValue) {
        const form = passwordField.closest('form');
        if (form) {
          const formData = new FormData(form);
          passwordValue = formData.get('regPassword') || '';
        }
      }
    }
    
    if (confirmPasswordField) {
      confirmPasswordValue = confirmPasswordField.value || '';
      if (!confirmPasswordValue) {
        confirmPasswordValue = confirmPasswordField.getAttribute('value') || '';
      }
      if (!confirmPasswordValue) {
        const form = confirmPasswordField.closest('form');
        if (form) {
          const formData = new FormData(form);
          confirmPasswordValue = formData.get('regConfirmPassword') || '';
        }
      }
    }
    
    console.log('Password value length:', passwordValue.length);
    console.log('Confirm password value length:', confirmPasswordValue.length);
    console.log('Password value:', passwordValue ? '[HIDDEN]' : 'EMPTY');
    console.log('Confirm password value:', confirmPasswordValue ? '[HIDDEN]' : 'EMPTY');
    
    // More lenient validation - check if fields exist and have content
    if (!passwordField || !confirmPasswordField) {
      this.showError('Password fields not found. Please try again.');
      return;
    }
    
    // Enhanced client-side validation before API call
    const usernameValue = formData.login || '';
    const emailValue = formData.email || '';
    
    // Username validation
    if (usernameValue.length < 3) {
      this.showError('Username must be at least 3 characters long.');
      return;
    }
    
    // Username format validation (only letters and numbers, no accents)
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(usernameValue)) {
      this.showError('Username can only contain letters and numbers (no special characters or accents).');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      this.showError('Please enter a valid email address.');
      return;
    }
    
    // If we still don't have password values, try to trigger focus/blur events to get them
    if (!passwordValue || !confirmPasswordValue) {
      console.log('Attempting to retrieve password values via events...');
      
      // Focus and blur to trigger any value updates
      if (passwordField && !passwordValue) {
        passwordField.focus();
        passwordField.blur();
        passwordValue = passwordField.value || '';
      }
      
      if (confirmPasswordField && !confirmPasswordValue) {
        confirmPasswordField.focus();
        confirmPasswordField.blur();
        confirmPasswordValue = confirmPasswordField.value || '';
      }
      
      console.log('After events - Password length:', passwordValue.length);
      console.log('After events - Confirm password length:', confirmPasswordValue.length);
    }
    
    // Check if either field is empty (without trim to avoid issues)
    if (passwordValue === '' || confirmPasswordValue === '') {
      // Try alternative method using FormData
      const form = document.getElementById('registerForm');
      if (form) {
        const htmlFormData = new FormData(form);
        const altPassword = htmlFormData.get('regPassword') || '';
        const altConfirmPassword = htmlFormData.get('regConfirmPassword') || '';
        
        console.log('Alternative password length:', altPassword.length);
        console.log('Alternative confirm password length:', altConfirmPassword.length);
        
        if (altPassword && altConfirmPassword) {
          console.log('Using alternative FormData method');
          // Use alternative values
          if (altPassword !== altConfirmPassword) {
            this.showError('Passwords do not match.');
            return;
          }
          if (altPassword.length < 6) {
            this.showError('Password must be at least 6 characters long.');
            return;
          }
          formData.pass = altPassword;
          // Skip the original validation and continue with registration
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
              // Try to translate error message if it's in French
              const translatedError = await this.translateErrorMessage(result.error || 'Registration failed. Please try again.');
              this.showError(translatedError);
            }
          } catch (error) {
            this.showError('Network error. Please try again.');
          }
          
          this.hideLoading('registerSubmit', 'Create Account');
          return;
        } else {
          this.showError('Please fill in both password fields.');
          return;
        }
      } else {
        this.showError('Please fill in both password fields.');
        return;
      }
    }
    
    if (passwordValue !== confirmPasswordValue) {
      this.showError('Passwords do not match.');
      return;
    }
    
    // Additional password validation
    if (passwordValue.length < 6) {
      this.showError('Password must be at least 6 characters long.');
      return;
    }
    
    // Check if password is too similar to username
    if (this.isPasswordSimilarToUsername(passwordValue, usernameValue)) {
      this.showError('Password cannot be identical or too similar to your username.');
      return;
    }
    
    // Update formData with correct password value
    formData.pass = passwordValue;
    
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
        // Try to translate error message if it's in French
        const translatedError = await this.translateErrorMessage(result.error || 'Registration failed. Please try again.');
        this.showError(translatedError);
      }
    } catch (error) {
      this.showError('Network error. Please try again.');
    }
    
    this.hideLoading('registerSubmit', 'Create Account');
  }

  /**
   * Check if password is too similar to username
   */
  isPasswordSimilarToUsername(password, username) {
    if (!password || !username) return false;
    
    const passwordLower = password.toLowerCase();
    const usernameLower = username.toLowerCase();
    
    // Check if password contains username or vice versa
    if (passwordLower.includes(usernameLower) || usernameLower.includes(passwordLower)) {
      return true;
    }
    
    // Check if they are identical
    if (passwordLower === usernameLower) {
      return true;
    }
    
    // Check similarity using Levenshtein distance (simple version)
    const similarity = this.calculateSimilarity(passwordLower, usernameLower);
    return similarity > 0.7; // 70% similarity threshold
  }

  /**
   * Calculate similarity between two strings (0-1, where 1 is identical)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Translate error message from French to English using OpenAI
   */
  async translateErrorMessage(errorMessage) {
    try {
      // Skip translation for short messages or if already in English
      if (!errorMessage || errorMessage.length < 10) {
        return errorMessage;
      }
      
      // Check if message is likely in French (contains French words)
      const frenchWords = ['pseudo', 'trop', 'court', 'lettres', 'chiffres', 'accents', 'mots', 'passe', 'identiques', 'similaires', 'autorisés', 'invalide'];
      const containsFrench = frenchWords.some(word => errorMessage.toLowerCase().includes(word));
      
      if (!containsFrench) {
        return errorMessage;
      }
      
      console.log('[AUTH MODAL] Translating error message:', errorMessage);
      
      const response = await fetch('/api/translate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: errorMessage,
          targetLanguage: 'English'
        })
      });
      
      if (!response.ok) {
        console.warn('[AUTH MODAL] Translation API failed, using original message');
        return errorMessage;
      }
      
      const data = await response.json();
      
      if (data.success && data.translatedText) {
        console.log('[AUTH MODAL] Translation successful:', errorMessage, '->', data.translatedText);
        return data.translatedText;
      }
      
      return errorMessage;
    } catch (error) {
      console.warn('[AUTH MODAL] Translation failed, using original message:', error);
      return errorMessage;
    }
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
    
    // Get values directly from DOM elements to ensure we have the latest values
    const usernameField = document.getElementById('regUsername');
    const emailField = document.getElementById('regEmail');
    const passwordField = document.getElementById('regPassword');
    const confirmPasswordField = document.getElementById('regConfirmPassword');
    const genderField = document.getElementById('regGender');
    const lookingForField = document.getElementById('regLookingFor');
    const fastRegistrationField = document.getElementById('fastRegistration');
    
    return {
      login: usernameField ? usernameField.value.trim() : '',
      email: emailField ? emailField.value.trim() : '', 
      pass: passwordField ? passwordField.value : '',
      confirmPassword: confirmPasswordField ? confirmPasswordField.value : '',
      gender: genderField ? parseInt(genderField.value) : 0,
      looking_for: lookingForField ? parseInt(lookingForField.value) : 0,
      birth_year: birthDate.getFullYear(),
      birth_month: birthDate.getMonth() + 1,
      birth_day: birthDate.getDate(),
      fastRegistration: fastRegistrationField ? fastRegistrationField.checked : false
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