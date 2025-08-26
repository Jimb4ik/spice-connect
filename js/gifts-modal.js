// ============ GIFTS MODAL MANAGER ============
class GiftsModalManager {
    constructor() {
        this.gifts = [];
        this.selectedGift = null;
        this.currentCategory = 'all';
        this.userBalance = 0;
        this.currentReceiverId = null;
        this.currentReceiverUserId = null;
    }

    async init() {
        console.log('[GIFTS_MODAL] Initializing gifts modal...');
        
        this.setupEventListeners();
        await this.loadGiftsCatalog();
        await this.loadUserBalance();
    }

    setupEventListeners() {
        // Кнопка подарка
        const giftBtn = document.getElementById('giftBtn');
        if (giftBtn) {
            giftBtn.addEventListener('click', () => {
                this.openGiftModal();
            });
        }

        // Кнопки категорий
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn')) {
                this.setCategory(e.target.dataset.category);
            }
        });

        // Счетчик символов в сообщении
        const personalMessage = document.getElementById('personalMessage');
        if (personalMessage) {
            personalMessage.addEventListener('input', () => {
                this.updateMessageCounter();
            });
        }
    }

    async loadGiftsCatalog() {
        try {
            console.log('[GIFTS_MODAL] Loading gifts catalog...');
            
            const response = await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_gifts_catalog'
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.gifts = result.data;
                console.log('[GIFTS_MODAL] Loaded gifts catalog:', this.gifts.length, 'items');
            } else {
                console.error('[GIFTS_MODAL] Error loading gifts:', result.error);
            }
        } catch (error) {
            console.error('[GIFTS_MODAL] Error loading gifts catalog:', error);
        }
    }

    async loadUserBalance() {
        if (!window.authManager || !window.authManager.sessionId) return;
        
        try {
            const response = await fetch('/api/wallet-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_wallet',
                    session_id: window.authManager.sessionId
                })
            });
            
            const result = await response.json();
            if (result.success && result.data) {
                this.userBalance = parseFloat(result.data.balance) || 0;
                console.log('[GIFTS_MODAL] User balance:', this.userBalance, 'credits');
            }
        } catch (error) {
            console.error('[GIFTS_MODAL] Error loading user balance:', error);
        }
    }

    openGiftModal() {
        // Проверяем, есть ли активный чат
        if (!window.messagesSystem || !window.messagesSystem.currentChatUserId) {
            alert('Please select a chat first to send a gift');
            return;
        }

        this.currentReceiverId = window.messagesSystem.currentChatUserId;
        this.currentReceiverUserId = window.messagesSystem.currentChatUserId; // Упрощенно

        // Обновляем баланс
        this.updateBalanceDisplay();
        
        // Рендерим подарки
        this.renderGifts();
        
        // Показываем модальное окно
        const modal = document.getElementById('giftModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Скрываем детали выбранного подарка
            const details = document.getElementById('selectedGiftDetails');
            if (details) {
                details.style.display = 'none';
            }
            
            // Сбрасываем выбранный подарок
            this.selectedGift = null;
            this.updateSendButton();
        }
    }

    closeGiftModal() {
        const modal = document.getElementById('giftModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Сбрасываем состояние
        this.selectedGift = null;
        this.currentCategory = 'all';
        
        // Очищаем персональное сообщение
        const personalMessage = document.getElementById('personalMessage');
        if (personalMessage) {
            personalMessage.value = '';
        }
        
        this.updateMessageCounter();
    }

    setCategory(category) {
        this.currentCategory = category;
        
        // Обновляем активную кнопку
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        this.renderGifts();
    }

    renderGifts() {
        const grid = document.getElementById('giftsGrid');
        const loading = document.getElementById('giftsLoading');
        
        if (this.gifts.length === 0) {
            loading.style.display = 'block';
            grid.style.display = 'none';
            return;
        }
        
        loading.style.display = 'none';
        grid.style.display = 'grid';
        
        // Фильтруем подарки по категории
        let filteredGifts = this.gifts;
        if (this.currentCategory !== 'all') {
            filteredGifts = this.gifts.filter(gift => gift.category === this.currentCategory);
        }
        
        grid.innerHTML = filteredGifts.map(gift => this.createGiftItem(gift)).join('');
        
        // Добавляем обработчики клика
        grid.querySelectorAll('.gift-item-modal').forEach(item => {
            item.addEventListener('click', () => {
                if (item.classList.contains('insufficient-credits')) return;
                
                const giftId = parseInt(item.dataset.id);
                this.selectGift(giftId);
            });
        });
    }

    createGiftItem(gift) {
        const hasEnoughCredits = this.userBalance >= gift.price_credits;
        const isSelected = this.selectedGift && this.selectedGift.id === gift.id;
        
        return `
            <div class="gift-item-modal ${!hasEnoughCredits ? 'insufficient-credits' : ''} ${isSelected ? 'selected' : ''}" 
                 data-id="${gift.id}">
                ${!hasEnoughCredits ? '<div class="insufficient-label">💰</div>' : ''}
                <div class="gift-emoji">${this.getGiftEmoji(gift.name)}</div>
                <div class="gift-name-modal">${gift.name}</div>
                <div class="gift-price-modal">${gift.price_credits} Credits</div>
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

    selectGift(giftId) {
        this.selectedGift = this.gifts.find(gift => gift.id === giftId);
        
        if (!this.selectedGift) return;
        
        // Обновляем визуальное выделение
        document.querySelectorAll('.gift-item-modal').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`[data-id="${giftId}"]`).classList.add('selected');
        
        // Показываем детали подарка
        this.showGiftDetails();
        this.updateSendButton();
    }

    showGiftDetails() {
        if (!this.selectedGift) return;
        
        const details = document.getElementById('selectedGiftDetails');
        const icon = document.getElementById('selectedGiftIcon');
        const name = document.getElementById('selectedGiftName');
        const price = document.getElementById('selectedGiftPrice');
        
        if (details && icon && name && price) {
            icon.textContent = this.getGiftEmoji(this.selectedGift.name);
            name.textContent = this.selectedGift.name;
            price.textContent = `${this.selectedGift.price_credits} Credits`;
            
            details.style.display = 'block';
        }
    }

    updateBalanceDisplay() {
        const balanceElement = document.getElementById('userCreditsBalance');
        if (balanceElement) {
            balanceElement.textContent = `${this.userBalance} Credits`;
        }
    }

    updateMessageCounter() {
        const messageInput = document.getElementById('personalMessage');
        const counter = document.getElementById('messageCharCount');
        
        if (messageInput && counter) {
            const length = messageInput.value.length;
            counter.textContent = length;
            
            // Меняем цвет если приближаемся к лимиту
            if (length > 180) {
                counter.style.color = '#e63946';
            } else if (length > 150) {
                counter.style.color = '#ff8c00';
            } else {
                counter.style.color = '#666';
            }
        }
    }

    updateSendButton() {
        const sendBtn = document.getElementById('sendGiftBtn');
        if (sendBtn) {
            const canSend = this.selectedGift && this.userBalance >= this.selectedGift.price_credits;
            sendBtn.disabled = !canSend;
            
            if (canSend) {
                sendBtn.textContent = `Send Gift (${this.selectedGift.price_credits} Credits)`;
            } else {
                sendBtn.textContent = 'Send Gift';
            }
        }
    }

    async sendSelectedGift() {
        if (!this.selectedGift || !this.currentReceiverId) {
            console.error('[GIFTS_MODAL] No gift selected or no receiver');
            return;
        }

        if (this.userBalance < this.selectedGift.price_credits) {
            alert('Insufficient credits to send this gift');
            return;
        }

        const personalMessage = document.getElementById('personalMessage')?.value || '';
        const sessionId = window.authManager?.sessionId;
        const userId = window.authManager?.userId;

        try {
            console.log('[GIFTS_MODAL] Sending gift:', this.selectedGift.name, 'to', this.currentReceiverId);
            
            const response = await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'purchase_gift',
                    gift_id: this.selectedGift.id,
                    sender_session_id: sessionId,
                    sender_user_id: userId,
                    receiver_session_id: this.currentReceiverId,
                    receiver_user_id: this.currentReceiverUserId,
                    personal_message: personalMessage
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('[GIFTS_MODAL] Gift sent successfully:', result.data);
                
                // Обновляем баланс
                this.userBalance -= this.selectedGift.price_credits;
                this.updateBalanceDisplay();
                
                // Показываем уведомление
                this.showSuccessMessage(`Gift "${this.selectedGift.name}" sent successfully!`);
                
                // Закрываем модальное окно
                this.closeGiftModal();
                
                // Добавляем сообщение в чат
                this.addGiftMessageToChat(this.selectedGift, personalMessage);
                
            } else {
                console.error('[GIFTS_MODAL] Error sending gift:', result.error);
                this.showErrorMessage('Failed to send gift: ' + result.error);
            }
            
        } catch (error) {
            console.error('[GIFTS_MODAL] Error sending gift:', error);
            this.showErrorMessage('Failed to send gift');
        }
    }

    addGiftMessageToChat(gift, personalMessage) {
        // Добавляем визуальное сообщение о подарке в чат
        if (window.messagesSystem && window.messagesSystem.addMessageToChat) {
            const giftMessage = {
                text: `🎁 Sent a gift: ${gift.name}${personalMessage ? '\n💌 "' + personalMessage + '"' : ''}`,
                isOwn: true,
                timestamp: new Date().toISOString(),
                sender: 'You',
                isGift: true
            };
            
            window.messagesSystem.addMessageToChat(giftMessage);
        }
    }

    showSuccessMessage(message) {
        // Простое уведомление - можно заменить на более красивое
        alert('✅ ' + message);
    }

    showErrorMessage(message) {
        // Простое уведомление - можно заменить на более красивое
        alert('❌ ' + message);
    }
}

// ============ GLOBAL FUNCTIONS ============
function closeGiftModal() {
    if (window.giftsModalManager) {
        window.giftsModalManager.closeGiftModal();
    }
}

function sendSelectedGift() {
    if (window.giftsModalManager) {
        window.giftsModalManager.sendSelectedGift();
    }
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
    window.giftsModalManager = new GiftsModalManager();
    await window.giftsModalManager.init();
});
