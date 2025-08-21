/**
 * Wallet Management System
 * Handles wallet balance, transactions, and payments
 */

class WalletManager {
    constructor() {
        this.userId = null;
        this.sessionId = null;
        this.currentWallet = null;
        this.selectedAmount = null;
        
        this.init();
    }
    
    async init() {
        console.log('[WALLET] Initializing wallet manager...');
        
        // Check authentication
        if (!window.authManager || !window.authManager.isLoggedIn) {
            console.error('[WALLET] User not authenticated');
            window.location.href = 'index.html';
            return;
        }
        
        this.userId = window.authManager.currentUser?.id;
        this.sessionId = window.authManager.sessionId;
        
        if (!this.userId || !this.sessionId) {
            console.error('[WALLET] No user ID or session ID');
            return;
        }
        
        console.log('[WALLET] User ID:', this.userId, 'Session ID:', this.sessionId);
        
        // Load wallet data
        await this.loadWalletData();
        await this.loadRecentTransactions();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    async loadWalletData() {
        try {
            console.log('[WALLET] Loading wallet data...');
            
            const response = await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_wallet',
                    user_id: this.userId,
                    session_id: this.sessionId
                })
            });
            
            const result = await response.json();
            console.log('[WALLET] Wallet data response:', result);
            
            if (result.success && result.data) {
                this.currentWallet = result.data;
                this.displayBalance(result.data.balance);
            } else {
                console.error('[WALLET] Failed to load wallet:', result.error);
                this.displayBalance(0);
            }
        } catch (error) {
            console.error('[WALLET] Error loading wallet:', error);
            this.displayBalance(0);
        }
    }
    
    async loadRecentTransactions(limit = 5) {
        try {
            console.log('[WALLET] Loading recent transactions...');
            
            const response = await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_transactions',
                    user_id: this.userId,
                    limit: limit
                })
            });
            
            const result = await response.json();
            console.log('[WALLET] Transactions response:', result);
            
            if (result.success && result.data) {
                this.displayTransactions(result.data);
            } else {
                console.error('[WALLET] Failed to load transactions:', result.error);
                this.displayNoTransactions();
            }
        } catch (error) {
            console.error('[WALLET] Error loading transactions:', error);
            this.displayNoTransactions();
        }
    }
    
    displayBalance(balance) {
        const balanceElement = document.getElementById('walletBalance');
        if (balanceElement) {
            balanceElement.textContent = Math.floor(balance || 0);
        }
    }
    
    displayTransactions(transactions) {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;
        
        if (transactions.length === 0) {
            this.displayNoTransactions();
            return;
        }
        
        transactionsList.innerHTML = transactions.map(transaction => {
            const isPositive = transaction.transaction_type === 'deposit' || transaction.transaction_type === 'refund';
            const amountClass = isPositive ? 'positive' : 'negative';
            const amountPrefix = isPositive ? '+' : '-';
            const iconType = this.getTransactionIcon(transaction.transaction_type);
            
            return `
                <div class="transaction-item">
                    <div class="transaction-icon ${transaction.transaction_type}">
                        <img src="icons/${iconType}" alt="${transaction.transaction_type}">
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-title">${this.getTransactionTitle(transaction.transaction_type)}</div>
                        <div class="transaction-description">${transaction.description || 'No description'}</div>
                        <div class="transaction-date">${this.formatDate(transaction.created_at)}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountPrefix}$${parseFloat(transaction.amount).toFixed(2)}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    displayNoTransactions() {
        const transactionsList = document.getElementById('transactionsList');
        if (transactionsList) {
            transactionsList.innerHTML = `
                <div class="no-transactions">
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <h3 style="margin: 0 0 8px; font-size: 18px;">No transactions yet</h3>
                        <p style="margin: 0; font-size: 14px;">Your transaction history will appear here</p>
                    </div>
                </div>
            `;
        }
    }
    
    getTransactionIcon(type) {
        const iconMap = {
            'deposit': 'plus-circle.png',
            'withdrawal': 'minus-circle.png',
            'purchase': 'shopping-cart.png',
            'refund': 'refresh.png'
        };
        return iconMap[type] || 'wallet.png';
    }
    
    getTransactionTitle(type) {
        const titleMap = {
            'deposit': 'Wallet Top-up',
            'withdrawal': 'Withdrawal',
            'purchase': 'Purchase',
            'refund': 'Refund'
        };
        return titleMap[type] || 'Transaction';
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 24 * 7) {
            return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }
    
    setupEventListeners() {
        // Quick amount selection
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
        
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // Form input formatting
        this.setupFormFormatting();
        
        // Agreement validation
        this.setupAgreementValidation();
        
        // Credits conversion
        this.setupCreditsConversion();
    }
    
    setupFormFormatting() {
        // Card number formatting
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;
            });
        }
        
        // Expiry date formatting
        const expiryInput = document.getElementById('expiryDate');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }
        
        // CVV formatting
        const cvvInput = document.getElementById('cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }
    }
    
    setupAgreementValidation() {
        const termsCheckbox = document.getElementById('termsAgreement');
        const ageCheckbox = document.getElementById('ageConfirmation');
        const proceedBtn = document.getElementById('proceedBtn');
        
        if (termsCheckbox && ageCheckbox && proceedBtn) {
            const validateAgreements = () => {
                const isValid = termsCheckbox.checked && ageCheckbox.checked;
                proceedBtn.disabled = !isValid;
            };
            
            termsCheckbox.addEventListener('change', validateAgreements);
            ageCheckbox.addEventListener('change', validateAgreements);
        }
    }
    
    setupCreditsConversion() {
        const amountInput = document.getElementById('topupAmount');
        const creditsDisplay = document.getElementById('creditsAmount');
        
        if (amountInput && creditsDisplay) {
            const updateCredits = () => {
                const amount = parseFloat(amountInput.value) || 0;
                const credits = Math.floor(amount * 10); // 1 USD = 10 Credits
                creditsDisplay.textContent = `${credits} Credits`;
            };
            
            amountInput.addEventListener('input', updateCredits);
        }
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    validateAgreements() {
        const termsCheckbox = document.getElementById('termsAgreement');
        const ageCheckbox = document.getElementById('ageConfirmation');
        
        if (!termsCheckbox.checked || !ageCheckbox.checked) {
            this.showAgreementError();
            return false;
        }
        
        return true;
    }
    
    showAgreementError() {
        // Удаляем предыдущее уведомление если есть
        const existingError = document.querySelector('.agreement-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Создаем уведомление об ошибке
        const errorDiv = document.createElement('div');
        errorDiv.className = 'agreement-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">❌</span>
                <div class="error-text">
                    <strong>Action Required</strong>
                    <p>You must agree to both the Terms of Service and confirm your age (18+) before proceeding with payment.</p>
                </div>
            </div>
        `;
        
        // Вставляем перед кнопками
        const modalFooter = document.querySelector('#topupModal .modal-footer');
        modalFooter.parentNode.insertBefore(errorDiv, modalFooter);
        
        // Автоматически убираем через 5 секунд
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    async saveUserConsent(sessionId) {
        try {
            const consentData = {
                action: 'save_consent',
                session_id: sessionId,
                terms_agreed: true,
                age_confirmed: true,
                consent_timestamp: new Date().toISOString(),
                ip_address: 'unknown', // В реальном приложении получаем IP
                user_agent: navigator.userAgent
            };
            
            console.log('[WALLET] Saving user consent:', consentData);
            
            const response = await fetch('/api/database', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(consentData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('[WALLET] User consent saved successfully');
                return true;
            } else {
                console.error('[WALLET] Error saving consent:', result.error);
                return false;
            }
        } catch (error) {
            console.error('[WALLET] Error saving consent:', error);
            return false;
        }
    }
    
    async addTransaction(type, amount, description, paymentMethod = null, paymentReference = null) {
        try {
            console.log('[WALLET] Adding transaction:', { type, amount, description });
            
            const response = await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_transaction',
                    user_id: this.userId,
                    transaction_type: type,
                    amount: amount,
                    description: description,
                    payment_method: paymentMethod,
                    payment_reference: paymentReference
                })
            });
            
            const result = await response.json();
            console.log('[WALLET] Transaction result:', result);
            
            if (result.success) {
                // Update displayed balance
                this.displayBalance(result.data.new_balance);
                
                // Reload transactions
                await this.loadRecentTransactions();
                
                return true;
            } else {
                console.error('[WALLET] Transaction failed:', result.error);
                return false;
            }
        } catch (error) {
            console.error('[WALLET] Error adding transaction:', error);
            return false;
        }
    }
}

// ============ GLOBAL FUNCTIONS ============

let walletManager = null;

// Initialize wallet when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    walletManager = new WalletManager();
});

// Refresh wallet data
async function loadWalletData() {
    if (walletManager) {
        await walletManager.loadWalletData();
        await walletManager.loadRecentTransactions();
    }
}

// Quick amount selection
function selectAmount(amount) {
    walletManager.selectedAmount = amount;
    openTopUpModal(amount);
}

function selectCustomAmount() {
    openTopUpModal();
    // Focus on amount input
    setTimeout(() => {
        const amountInput = document.getElementById('topupAmount');
        if (amountInput) {
            amountInput.focus();
        }
    }, 100);
}

// Top-up modal functions
function openTopUpModal(amount = null) {
    const modal = document.getElementById('topupModal');
    const amountInput = document.getElementById('topupAmount');
    
    if (modal) {
        modal.style.display = 'flex';
        
        if (amount && amountInput) {
            amountInput.value = amount.toFixed(2);
        }
    }
}

function closeTopUpModal() {
    const modal = document.getElementById('topupModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function proceedToPayment() {
    const amountInput = document.getElementById('topupAmount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (amount > 1000) {
        alert('Maximum top-up amount is $1000');
        return;
    }
    
    // Close top-up modal and open payment modal
    closeTopUpModal();
    openPaymentModal(amount);
}

// Payment modal functions
function openPaymentModal(amount) {
    const modal = document.getElementById('paymentModal');
    const paymentAmount = document.getElementById('paymentAmount');
    const paymentTotal = document.getElementById('paymentTotal');
    
    if (modal) {
        modal.style.display = 'flex';
        
        if (paymentAmount) {
            paymentAmount.textContent = `$${amount.toFixed(2)}`;
        }
        
        if (paymentTotal) {
            paymentTotal.textContent = `$${amount.toFixed(2)}`;
        }
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function processPayment() {
    const paymentForm = document.getElementById('paymentForm');
    const payBtn = document.getElementById('payBtn');
    const amountText = document.getElementById('paymentAmount').textContent;
    const amount = parseFloat(amountText.replace('$', ''));
    
    // Validate form
    const cardNumber = document.getElementById('cardNumber').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const cardName = document.getElementById('cardName').value;
    
    if (!cardNumber || !expiryDate || !cvv || !cardName) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Disable button and show loading
    payBtn.disabled = true;
    payBtn.innerHTML = '<img src="icons/loading.gif" alt="Processing" class="btn-icon"> Processing...';
    
    try {
        // Simulate payment processing (replace with real payment gateway)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Add transaction to wallet
        const success = await walletManager.addTransaction(
            'deposit',
            amount,
            `Wallet top-up via ${cardNumber.slice(-4)}`,
            'card',
            `card_${Date.now()}`
        );
        
        if (success) {
            closePaymentModal();
            showSuccessMessage(`Successfully added $${amount.toFixed(2)} to your wallet!`);
        } else {
            alert('Payment failed. Please try again.');
        }
    } catch (error) {
        console.error('[WALLET] Payment error:', error);
        alert('Payment failed. Please try again.');
    } finally {
        // Reset button
        payBtn.disabled = false;
        payBtn.innerHTML = '<img src="icons/lock.png" alt="Secure" class="btn-icon"> Pay Securely';
    }
}

// Transaction history
function viewTransactionHistory() {
    // Scroll to Recent Transactions section
    const transactionsSection = document.querySelector('.transactions-section');
    if (transactionsSection) {
        transactionsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function viewAllTransactions() {
    viewTransactionHistory();
}

// Success message
function showSuccessMessage(message) {
    // Create and show success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <img src="icons/check-circle.png" alt="Success" class="notification-icon">
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Logout function
function logout() {
    if (window.authManager) {
        window.authManager.logout();
    }
}

console.log('[WALLET] Wallet.js loaded');
