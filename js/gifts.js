// ============ GIFTS PAGE MANAGER ============
class GiftsManager {
    constructor() {
        this.selectedGifts = new Set();
        this.currentFilter = 'all';
        this.currentHistoryType = 'receive';
        this.receivedGifts = [];
        this.sentGifts = [];
        this.transactions = [];
        this.currencies = {
            'EUR': { symbol: '€', rate: 1 },
            'USD': { symbol: '$', rate: 1.18 },
            'GBP': { symbol: '£', rate: 0.86 },
            'CAD': { symbol: 'C$', rate: 1.47 },
            'AUD': { symbol: 'A$', rate: 1.59 }
        };
    }

    async init() {
        console.log('[GIFTS] Initializing gifts page...');
        
        // Проверяем авторизацию
        if (!window.authManager || !window.authManager.isLoggedIn) {
            console.log('[GIFTS] User not logged in, redirecting...');
            window.location.href = 'auth.html';
            return;
        }

        this.setupEventListeners();
        await this.loadGiftsData();
        this.updateStats();
    }

    setupEventListeners() {
        // Фильтры инвентаря
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.status);
            });
        });

        // Табы истории
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setHistoryType(e.target.dataset.type);
            });
        });

        // Выбор валюты для монетизации
        const currencySelect = document.getElementById('monetizationCurrency');
        if (currencySelect) {
            currencySelect.addEventListener('change', () => {
                this.updateMonetizationValue();
            });
        }

        // Кнопка монетизации
        const monetizeBtn = document.getElementById('monetizeBtn');
        if (monetizeBtn) {
            monetizeBtn.addEventListener('click', () => {
                this.openMonetizationModal();
            });
        }
    }

    async loadGiftsData() {
        const sessionId = window.authManager.sessionId;
        
        try {
            console.log('[GIFTS] Loading gifts data...');
            
            // Загружаем полученные подарки
            const receivedResponse = await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_received_gifts',
                    session_id: sessionId,
                    user_id: window.authManager.userId
                })
            });
            
            const receivedResult = await receivedResponse.json();
            if (receivedResult.success) {
                this.receivedGifts = receivedResult.data;
                console.log('[GIFTS] Loaded received gifts:', this.receivedGifts.length);
            }

            // Загружаем отправленные подарки
            const sentResponse = await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_sent_gifts',
                    session_id: sessionId,
                    user_id: window.authManager.userId
                })
            });
            
            const sentResult = await sentResponse.json();
            if (sentResult.success) {
                this.sentGifts = sentResult.data;
                console.log('[GIFTS] Loaded sent gifts:', this.sentGifts.length);
            }

            // Загружаем транзакции
            await this.loadTransactions();

            // Обновляем UI
            this.renderInventory();
            this.renderHistory();

        } catch (error) {
            console.error('[GIFTS] Error loading gifts data:', error);
        }
    }

    async loadTransactions() {
        const sessionId = window.authManager.sessionId;
        
        try {
            const response = await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_gift_transactions',
                    session_id: sessionId,
                    user_id: window.authManager.userId,
                    limit: 100
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.transactions = result.data;
                console.log('[GIFTS] Loaded transactions:', this.transactions.length);
            }
        } catch (error) {
            console.error('[GIFTS] Error loading transactions:', error);
        }
    }

    setFilter(status) {
        this.currentFilter = status;
        
        // Обновляем активную кнопку
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-status="${status}"]`).classList.add('active');
        
        this.renderInventory();
    }

    setHistoryType(type) {
        this.currentHistoryType = type;
        
        // Обновляем активную вкладку
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
        
        this.renderHistory();
    }

    renderInventory() {
        const grid = document.getElementById('inventoryGrid');
        const empty = document.getElementById('inventoryEmpty');
        
        let gifts = this.receivedGifts;
        
        // Применяем фильтр
        if (this.currentFilter === 'sent') {
            gifts = gifts.filter(gift => gift.status === 'sent');
        } else if (this.currentFilter === 'monetized') {
            gifts = gifts.filter(gift => gift.status === 'monetized');
        }
        
        if (gifts.length === 0) {
            grid.style.display = 'none';
            empty.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        empty.style.display = 'none';
        
        grid.innerHTML = gifts.map(gift => this.createGiftCard(gift)).join('');
        
        // Добавляем обработчики клика
        grid.querySelectorAll('.gift-item').forEach(item => {
            item.addEventListener('click', () => {
                if (item.classList.contains('monetized')) return;
                
                const giftId = parseInt(item.dataset.id);
                this.toggleGiftSelection(giftId, item);
            });
        });
        
        this.updateMonetizationValue();
    }

    createGiftCard(gift) {
        const isMonetized = gift.status === 'monetized';
        const isSelected = this.selectedGifts.has(gift.id);
        const value = this.calculateGiftValue(gift.purchase_price_credits);
        
        return `
            <div class="gift-item ${isMonetized ? 'monetized' : ''} ${isSelected ? 'selected' : ''}" 
                 data-id="${gift.id}" data-credits="${gift.purchase_price_credits}">
                <div class="gift-image">
                    ${this.getGiftEmoji(gift.gift_name)}
                </div>
                <div class="gift-info">
                    <h4>${gift.gift_name}</h4>
                    <div class="gift-meta">
                        <span class="gift-value">€${value.toFixed(2)}</span>
                        <span class="gift-credits">${gift.purchase_price_credits} credits</span>
                    </div>
                    <div class="gift-date">${this.formatDate(gift.sent_at)}</div>
                </div>
            </div>
        `;
    }

    getGiftEmoji(giftName) {
        const emojiMap = {
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
        
        return emojiMap[giftName] || '🎁';
    }

    toggleGiftSelection(giftId, element) {
        if (this.selectedGifts.has(giftId)) {
            this.selectedGifts.delete(giftId);
            element.classList.remove('selected');
        } else {
            this.selectedGifts.add(giftId);
            element.classList.add('selected');
        }
        
        this.updateMonetizationValue();
    }

    calculateGiftValue(credits) {
        // 30% от стоимости, 1 кредит = 0.1 USD
        return credits * 0.1 * 0.3;
    }

    updateMonetizationValue() {
        const selectedGifts = Array.from(this.selectedGifts);
        const currency = document.getElementById('monetizationCurrency').value;
        const currencyInfo = this.currencies[currency];
        
        let totalCredits = 0;
        selectedGifts.forEach(giftId => {
            const gift = this.receivedGifts.find(g => g.id === giftId);
            if (gift && gift.status !== 'monetized') {
                totalCredits += gift.purchase_price_credits;
            }
        });
        
        const usdValue = this.calculateGiftValue(totalCredits);
        const convertedValue = usdValue * currencyInfo.rate;
        
        // Обновляем UI
        document.getElementById('readyToMonetizeCount').textContent = `${selectedGifts.length} gifts`;
        document.getElementById('monetizationValue').textContent = convertedValue.toFixed(2);
        document.querySelector('.currency-symbol').textContent = currencyInfo.symbol;
        
        const monetizeBtn = document.getElementById('monetizeBtn');
        monetizeBtn.disabled = selectedGifts.length === 0;
    }

    renderHistory() {
        const content = document.getElementById('historyContent');
        const empty = document.getElementById('historyEmpty');
        
        let items = [];
        
        switch (this.currentHistoryType) {
            case 'receive':
                items = this.transactions.filter(t => t.transaction_type === 'receive');
                break;
            case 'purchase':
                items = this.transactions.filter(t => t.transaction_type === 'purchase');
                break;
            case 'monetize':
                items = this.transactions.filter(t => t.transaction_type === 'monetize');
                break;
        }
        
        if (items.length === 0) {
            content.style.display = 'none';
            empty.style.display = 'block';
            return;
        }
        
        content.style.display = 'block';
        empty.style.display = 'none';
        
        content.innerHTML = items.map(item => this.createHistoryItem(item)).join('');
    }

    createHistoryItem(transaction) {
        const typeConfig = {
            'receive': { icon: '🎁', color: '#d6246a' },
            'purchase': { icon: '🎁', color: '#d6246a' },
            'monetize': { icon: '🎁', color: '#d6246a' }
        };
        
        const config = typeConfig[transaction.transaction_type];
        const amount = transaction.credits_spent || transaction.usd_earned || 0;
        const currency = transaction.transaction_type === 'monetize' ? 
            `€${amount.toFixed(2)}` : `${amount} credits`;
        
        // Имя отправителя/получателя вместо ID, если доступно
        const counterpartName = transaction.related_user_pseudo || transaction.related_user_name || transaction.related_user_id || '';
        const description = transaction.description ? transaction.description.replace(/\b\d{3,}\b/g, counterpartName) : '';
        
        const giftEmoji = this.getGiftEmoji(transaction.gift_name || '');
        return `
            <div class="history-item">
                <div class="history-icon" style="background-color: ${config.color}20; color: ${config.color};">
                    ${giftEmoji}
                </div>
                <div class="history-details">
                    <div class="history-title">${transaction.gift_name || 'Gift Transaction'}</div>
                    <div class="history-description">${description}</div>
                </div>
                <div class="history-meta">
                    <div class="history-amount">${currency}</div>
                    <div class="history-date">${this.formatDate(transaction.created_at)}</div>
                </div>
            </div>
        `;
    }

    updateStats() {
        const receivedCount = this.receivedGifts.length;
        const sentCount = this.sentGifts.length;
        const monetizedTransactions = this.transactions.filter(t => t.transaction_type === 'monetize');
        const totalEarnings = monetizedTransactions.reduce((sum, t) => sum + (parseFloat(t.usd_earned) || 0), 0);
        
        const availableGifts = this.receivedGifts.filter(g => g.status !== 'monetized');
        const availableValue = availableGifts.reduce((sum, g) => sum + this.calculateGiftValue(g.purchase_price_credits), 0);
        
        // Обновляем статистику
        document.getElementById('receivedGiftsCount').textContent = receivedCount;
        document.getElementById('sentGiftsCount').textContent = sentCount;
        document.getElementById('totalEarnings').textContent = `€${totalEarnings.toFixed(2)}`;
        document.getElementById('availableValue').textContent = `€${availableValue.toFixed(2)}`;
    }

    openMonetizationModal() {
        if (this.selectedGifts.size === 0) return;
        
        const currency = document.getElementById('monetizationCurrency').value;
        const currencyInfo = this.currencies[currency];
        
        let totalCredits = 0;
        Array.from(this.selectedGifts).forEach(giftId => {
            const gift = this.receivedGifts.find(g => g.id === giftId);
            if (gift) totalCredits += gift.purchase_price_credits;
        });
        
        const usdValue = this.calculateGiftValue(totalCredits);
        const convertedValue = usdValue * currencyInfo.rate;
        
        // Заполняем модальное окно
        document.getElementById('monetizeGiftsCount').textContent = this.selectedGifts.size;
        document.getElementById('monetizeAmount').textContent = `${currencyInfo.symbol}${convertedValue.toFixed(2)}`;
        document.getElementById('monetizeCurrency').textContent = currency;
        
        // Показываем модальное окно
        document.getElementById('monetizationModal').style.display = 'flex';
    }

    async confirmMonetization() {
        const selectedGiftIds = Array.from(this.selectedGifts);
        const currency = document.getElementById('monetizationCurrency').value;
        const sessionId = window.authManager.sessionId;
        const userId = window.authManager.userId;
        
        try {
            console.log('[GIFTS] Monetizing gifts:', selectedGiftIds);
            
            const response = await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'monetize_gifts',
                    session_id: sessionId,
                    user_id: userId,
                    gift_ids: selectedGiftIds,
                    currency: currency
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('[GIFTS] Monetization successful:', result.data);
                
                // Показываем уведомление
                this.showSuccessMessage(`Successfully monetized ${result.data.monetized_gifts.length} gifts for ${result.data.total_usd_value.toFixed(2)} ${currency}`);
                
                // Закрываем модальное окно
                this.closeMonetizationModal();
                
                // Очищаем выбранные подарки
                this.selectedGifts.clear();
                
                // Перезагружаем данные
                await this.loadGiftsData();
                this.updateStats();
                
            } else {
                console.error('[GIFTS] Monetization error:', result.error);
                this.showErrorMessage('Failed to monetize gifts: ' + result.error);
            }
            
        } catch (error) {
            console.error('[GIFTS] Error monetizing gifts:', error);
            this.showErrorMessage('Failed to monetize gifts');
        }
    }

    closeMonetizationModal() {
        document.getElementById('monetizationModal').style.display = 'none';
    }

    showSuccessMessage(message) {
        // Простое уведомление - можно заменить на более красивое
        alert('✅ ' + message);
    }

    showErrorMessage(message) {
        // Простое уведомление - можно заменить на более красивое
        alert('❌ ' + message);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) {
            return 'Today';
        } else if (diffInDays === 1) {
            return 'Yesterday';
        } else if (diffInDays < 7) {
            return `${diffInDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// ============ GLOBAL FUNCTIONS ============
function closeMonetizationModal() {
    giftsManager.closeMonetizationModal();
}

function confirmMonetization() {
    giftsManager.confirmMonetization();
}

// ============ INITIALIZATION ============
let giftsManager;

document.addEventListener('DOMContentLoaded', async () => {
    giftsManager = new GiftsManager();
    await giftsManager.init();
});
