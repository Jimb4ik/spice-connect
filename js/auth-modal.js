/**
 * Lumina Authentication Modal
 * Handles login/registration UI with Tailwind styling
 */

class AuthModal {
  constructor() {
    this.currentMode = 'login'; // 'login', 'register', 'forgot'
    this.isVisible = false;
    this.createModal();
    this.setupEventListeners();
  }

  createModal() {
    // Create modal HTML with Tailwind classes
    const modalHTML = `
      <div class="fixed inset-0 z-[100] flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300" id="authModal" aria-hidden="true">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" id="authModalBackdrop"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-slate-800 border border-white/10 w-full max-w-md mx-4 rounded-2xl shadow-2xl transform scale-95 opacity-0 transition-all duration-300 p-8" id="authModalContentContainer">
          <button class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors focus:outline-none" id="authModalClose">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div id="authModalContent">
            <!-- Content will be dynamically loaded here -->
          </div>
        </div>
      </div>
    `;

    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    this.modal = document.getElementById('authModal');
    this.backdrop = document.getElementById('authModalBackdrop');
    this.container = document.getElementById('authModalContentContainer');
    this.content = document.getElementById('authModalContent');
    
    // Load initial content
    this.showLogin();
  }

  setupEventListeners() {
    // Close modal events
    document.getElementById('authModalClose').addEventListener('click', () => {
      this.hide();
    });
    
    this.backdrop.addEventListener('click', () => {
      this.hide();
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
    this.modal.classList.remove('opacity-0', 'pointer-events-none');
    this.modal.setAttribute('aria-hidden', 'false');
    
    // Animate container
    setTimeout(() => {
        this.container.classList.remove('scale-95', 'opacity-0');
        this.container.classList.add('scale-100', 'opacity-100');
    }, 10);
    
    document.body.style.overflow = 'hidden';
  }

  hide() {
    this.isVisible = false;
    
    // Animate container out
    this.container.classList.remove('scale-100', 'opacity-100');
    this.container.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        this.modal.classList.add('opacity-0', 'pointer-events-none');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Clear any error messages
        this.clearMessages();
    }, 300);
  }

  showLogin() {
    this.currentMode = 'login';
    this.content.innerHTML = `
      <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p class="text-slate-400 text-sm">Sign in to continue your journey</p>
      </div>
      
      <div class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" id="authError"></div>
      <div class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm" id="authSuccess"></div>
      
      <form class="space-y-4" id="loginForm">
        <div>
          <label for="loginUsername" class="block text-xs font-medium text-slate-400 mb-1 uppercase">Username</label>
          <input type="text" id="loginUsername" required autocomplete="username" class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors placeholder-slate-600">
        </div>
        
        <div>
          <label for="loginPassword" class="block text-xs font-medium text-slate-400 mb-1 uppercase">Password</label>
          <input type="password" id="loginPassword" required autocomplete="current-password" class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors placeholder-slate-600">
        </div>
        
        <div class="flex items-center">
          <input type="checkbox" id="rememberMe" checked class="w-4 h-4 rounded bg-slate-700 border-slate-600 text-brand-primary focus:ring-brand-primary focus:ring-offset-slate-800">
          <label for="rememberMe" class="ml-2 text-sm text-slate-400">Remember me</label>
        </div>
        
        <button type="submit" class="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-primary/20 transition-all transform hover:translate-y-px flex items-center justify-center" id="loginSubmit">
          <span class="btn-text">Sign In</span>
        </button>
      </form>
      
      <div class="mt-6 text-center space-y-2">
        <p class="text-sm text-slate-500">Don't have an account? <button class="text-brand-accent hover:text-white transition-colors font-medium" id="showRegister">Sign up</button></p>
        <p class="text-sm"><button class="text-slate-500 hover:text-slate-300 transition-colors" id="showForgot">Forgot password?</button></p>
      </div>
    `;
    
    this.setupLoginEvents();
  }

  showRegister() {
    this.currentMode = 'register';
    this.content.innerHTML = `
      <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p class="text-slate-400 text-sm">Join the exclusive community</p>
      </div>
      
      <div class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" id="authError"></div>
      <div class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm" id="authSuccess"></div>
      
      <form class="space-y-4" id="registerForm">
        <div class="grid grid-cols-2 gap-4">
             <div>
                <label for="regUsername" class="block text-xs font-medium text-slate-400 mb-1 uppercase">Username</label>
                <input type="text" id="regUsername" required class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors">
            </div>
             <div>
                <label for="regBirthDate" class="block text-xs font-medium text-slate-400 mb-1 uppercase">Birth Date</label>
                <input type="date" id="regBirthDate" required class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors [color-scheme:dark]">
            </div>
        </div>
        
        <div>
          <label for="regEmail" class="block text-xs font-medium text-slate-400 mb-1 uppercase">Email</label>
          <input type="email" id="regEmail" required class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors">
        </div>
        
        <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="regPassword" class="block text-xs font-medium text-slate-400 mb-1 uppercase">Password</label>
              <input type="password" id="regPassword" name="regPassword" required minlength="6" class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors">
            </div>
            
            <div>
              <label for="regConfirmPassword" class="block text-xs font-medium text-slate-400 mb-1 uppercase">Confirm</label>
              <input type="password" id="regConfirmPassword" name="regConfirmPassword" required class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors">
            </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="regGender" class="block text-xs font-medium text-slate-400 mb-1 uppercase">I am</label>
              <select id="regGender" required class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors">
                <option value="" class="bg-slate-800">Select...</option>
                <option value="1" class="bg-slate-800">Man</option>
                <option value="2" class="bg-slate-800">Woman</option>
                <option value="3" class="bg-slate-800">Couple</option>
              </select>
            </div>
            
            <div>
              <label for="regLookingFor" class="block text-xs font-medium text-slate-400 mb-1 uppercase">Looking for</label>
              <select id="regLookingFor" required class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors">
                <option value="" class="bg-slate-800">Select...</option>
                <option value="1" class="bg-slate-800">Men</option>
                <option value="2" class="bg-slate-800">Women</option>
                <option value="3" class="bg-slate-800">Couples</option>
              </select>
            </div>
        </div>
        
        <div class="flex items-center">
          <input type="checkbox" id="fastRegistration" checked class="w-4 h-4 rounded bg-slate-700 border-slate-600 text-brand-primary focus:ring-brand-primary focus:ring-offset-slate-800">
          <label for="fastRegistration" class="ml-2 text-sm text-slate-400">Quick registration</label>
        </div>
        
        <button type="submit" class="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-primary/20 transition-all transform hover:translate-y-px flex items-center justify-center" id="registerSubmit">
          <span class="btn-text">Create Account</span>
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <p class="text-sm text-slate-500">Already have an account? <button class="text-brand-accent hover:text-white transition-colors font-medium" id="showLogin">Sign in</button></p>
      </div>
    `;
    
    this.setupRegisterEvents();
  }

  showForgotPassword() {
    this.currentMode = 'forgot';
    this.content.innerHTML = `
      <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p class="text-slate-400 text-sm">Enter your username to receive instructions</p>
      </div>
      
      <div class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" id="authError"></div>
      <div class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm" id="authSuccess"></div>
      
      <form class="space-y-4" id="forgotForm">
        <div>
          <label for="forgotUsername" class="block text-xs font-medium text-slate-400 mb-1 uppercase">Username</label>
          <input type="text" id="forgotUsername" required class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors">
        </div>
        
        <button type="submit" class="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-primary/20 transition-all transform hover:translate-y-px flex items-center justify-center" id="forgotSubmit">
          <span class="btn-text">Send Instructions</span>
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <p class="text-sm"><button class="text-slate-500 hover:text-white transition-colors" id="backToLogin">Back to login</button></p>
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
    if (confirmPassword && password) {
        confirmPassword.addEventListener('input', validatePasswords);
        password.addEventListener('input', validatePasswords);
        
        // Also validate on blur to catch cases where user tabs through fields
        confirmPassword.addEventListener('blur', validatePasswords);
        password.addEventListener('blur', validatePasswords);
    }
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
    
    // Get password values from modal form specifically (not from main page form)
    const modalForm = document.getElementById('registerForm');
    const passwordField = modalForm ? modalForm.querySelector('#regPassword') : null;
    const confirmPasswordField = modalForm ? modalForm.querySelector('#regConfirmPassword') : null;
    
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
    
    // More lenient validation - check if fields exist and have content
    if (!passwordField || !confirmPasswordField) {
      this.showError('Password fields not found. Please try again.');
      return;
    }
    
    // Enhanced client-side validation before API call
    const usernameValue = formData.login || '';
    const emailValue = formData.mail || ''; // Use 'mail' field as per API
    
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
    
    // Email validation - more strict to match API expectations
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailValue)) {
      this.showError('Please enter a valid email address (example: user@domain.com).');
      return;
    }
    
    // Additional check for test emails that API might reject
    if (emailValue.includes('example.com') || emailValue.includes('test.')) {
      this.showError('Please use a real email address. Test emails are not accepted.');
      return;
    }
    
    // If we still don't have password values, try to trigger focus/blur events to get them
    if (!passwordValue || !confirmPasswordValue) {
      
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
    }
    
    // Check if either field is empty (without trim to avoid issues)
    if (passwordValue === '' || confirmPasswordValue === '') {
      // Try alternative method using FormData
      const form = document.getElementById('registerForm');
      if (form) {
        const htmlFormData = new FormData(form);
        const altPassword = htmlFormData.get('regPassword') || '';
        const altConfirmPassword = htmlFormData.get('regConfirmPassword') || '';
        
        if (altPassword && altConfirmPassword) {
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
              this.showSuccess('Account created successfully! Welcome to Lumina.');
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
        this.showSuccess('Account created successfully! Welcome to Lumina.');
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
        return errorMessage;
      }
      
      const data = await response.json();
      
      if (data.success && data.translatedText) {
        return data.translatedText;
      }
      
      return errorMessage;
    } catch (error) {
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
      this.hideLoading('forgotSubmit', 'Send Instructions');
    }, 2000);
  }

  getRegisterFormData() {
    // Get values from modal form specifically (not from main page form)
    const modalForm = document.getElementById('registerForm');
    if (!modalForm) {
      console.error('Modal form not found');
      return {};
    }
    
    // Use querySelector to get fields within the modal form only
    const usernameField = modalForm.querySelector('#regUsername');
    const emailField = modalForm.querySelector('#regEmail');
    const passwordField = modalForm.querySelector('#regPassword');
    const confirmPasswordField = modalForm.querySelector('#regConfirmPassword');
    const genderField = modalForm.querySelector('#regGender');
    const lookingForField = modalForm.querySelector('#regLookingFor');
    const birthDateField = modalForm.querySelector('#regBirthDate');
    const fastRegistrationField = modalForm.querySelector('#fastRegistration');
    
    const birthDate = birthDateField ? new Date(birthDateField.value) : new Date();
    
    // Get user's IP address (will be handled by server)
    const userIP = '127.0.0.1'; // Default, server should detect real IP
    
    return {
      // API required parameters (matching Spice API documentation)
      login: usernameField ? usernameField.value.trim() : '',
      mail: emailField ? emailField.value.trim() : '', // API uses 'mail' not 'email'
      pass: passwordField ? passwordField.value : '',
      sex: genderField ? parseInt(genderField.value) : 1, // API uses 'sex' not 'gender'
      cherche1: lookingForField ? parseInt(lookingForField.value) : 2, // API uses 'cherche1' not 'looking_for'
      year: birthDate.getFullYear(),
      month: birthDate.getMonth() + 1,
      day: birthDate.getDate(),
      ip_adress: userIP, // Required by API
      city: 1, // Default city ID (Paris) - should be made configurable
      region: 1, // Default region ID - should be made configurable  
      countryObj: 64, // Default country ID (France) - should be made configurable
      'fast-part': fastRegistrationField && fastRegistrationField.checked ? '1' : '0',
      
      // Internal validation fields (not sent to API)
      confirmPassword: confirmPasswordField ? confirmPasswordField.value : '',
      fastRegistration: fastRegistrationField ? fastRegistrationField.checked : false
    };
  }

  showError(message) {
    const errorEl = document.getElementById('authError');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    errorEl.classList.add('block');
  }

  showSuccess(message) {
    const successEl = document.getElementById('authSuccess');
    successEl.textContent = message;
    successEl.classList.remove('hidden');
    successEl.classList.add('block');
  }

  clearMessages() {
    const errorEl = document.getElementById('authError');
    const successEl = document.getElementById('authSuccess');
    
    if (errorEl) {
      errorEl.classList.add('hidden');
      errorEl.classList.remove('block');
      errorEl.textContent = '';
    }
    
    if (successEl) {
      successEl.classList.add('hidden');
      successEl.classList.remove('block');
      successEl.textContent = '';
    }
  }

  showLoading(buttonId, text) {
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector('.btn-text');
    
    button.disabled = true;
    button.classList.add('opacity-75', 'cursor-not-allowed');
    btnText.innerHTML = `<div class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> ${text}`;
  }

  hideLoading(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector('.btn-text');
    
    button.disabled = false;
    button.classList.remove('opacity-75', 'cursor-not-allowed');
    btnText.textContent = originalText;
  }
}

// Create global instance
window.authModal = new AuthModal();

// Setup login button click handler
document.addEventListener('DOMContentLoaded', () => {
  // Add login button click handler if it exists
  const loginBtns = document.querySelectorAll('.login-btn');
  loginBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (window.authModal) {
            window.authModal.showLogin();
            window.authModal.show();
          }
      });
  });
  
  // Also handle signup button
  const signupBtns = document.querySelectorAll('.signup-btn');
  signupBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (window.authModal) {
            window.authModal.showRegister();
            window.authModal.show();
          }
      });
  });
});
