// Messages System Extension Methods
// This file extends the Dashboard class with message functionality

// Extend Dashboard prototype with message methods
Object.assign(Dashboard.prototype, {
  
  // Инициализируем кэш сообщений для быстрого доступа к превью
  messagesCache: {},
  
  async loadContacts() {
    const contactsList = document.getElementById('contactsList');
    const contactsLoading = document.getElementById('contactsLoading');
    
    console.log('[MESSAGES] Loading contacts...');
    
    try {
      // Show loading
      if (contactsLoading) {
        contactsLoading.style.display = 'flex';
      }

      const result = await this.callContactsAPI();
      
      if (result.success && result.contacts) {
        this.contacts = result.contacts;
        this.displayContacts(result.contacts);
        console.log(`[MESSAGES] Loaded ${result.contacts.length} contacts`);
      } else {
        this.showContactsError(result.error || 'Failed to load contacts');
      }
      
    } catch (error) {
      console.error('[MESSAGES] Error loading contacts:', error);
      this.showContactsError(error.message);
    } finally {
      // Hide loading
      if (contactsLoading) {
        contactsLoading.style.display = 'none';
      }
    }
  },

  async callContactsAPI() {
    const sessionId = window.authManager?.sessionId;
    if (!sessionId) {
      return { success: false, error: 'No session ID available' };
    }

    // Получаем API ключ
    const apiConfigResponse = await fetch('/api/get-api-key');
    const apiConfig = await apiConfigResponse.json();
    
    if (!apiConfig.apiKey) {
      return { success: false, error: 'No API key available' };
    }

    // Параметры согласно документации: session_id и filter (1 = contacts, 2 = blacklist, 3 = friends)
    const contactParams = new URLSearchParams({
      api_key: apiConfig.apiKey,
      session_id: sessionId,
      filter: '1'  // 1 = список контактов
    });
    
    const apiUrl = `/api/spice-multi-test?endpoint=/ajax_api/load_contacts&method=GET&${contactParams.toString()}`;
    
    console.log('[MESSAGES] API call for contacts:', apiUrl);

    const response = await fetch(apiUrl);
    const result = await response.json();
    console.log('[MESSAGES] Contacts API Response:', result);
    console.log('[MESSAGES] Raw API data structure:', result.data);

    if (result.success && result.data) {
      // Согласно документации API возвращает контакты в поле "contacts"
      const contacts = result.data.contacts || result.data.result || [];
      console.log('[MESSAGES] Parsed contacts count:', contacts.length);
      return {
        success: true,
        contacts: Array.isArray(contacts) ? contacts : []
      };
    } else {
      return {
        success: false,
        error: result.data?.error || result.error || 'Failed to load contacts'
      };
    }
  },

  displayContacts(contacts) {
    const contactsList = document.getElementById('contactsList');
    
    if (!contactsList) return;

    if (!contacts || contacts.length === 0) {
      contactsList.innerHTML = `
        <div class="contacts-empty">
          <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
            <div style="font-size: 32px; margin-bottom: 16px;">💬</div>
            <h4>No conversations yet</h4>
            <p>Start a conversation from the Search page!</p>
          </div>
        </div>
      `;
      return;
    }

    // ИСПРАВЛЕНИЕ 1: Сортируем контакты - новые сверху (по времени создания или активности)
    const sortedContacts = [...contacts].sort((a, b) => {
      // Проверяем если контакт новый (создан недавно)
      const aTime = new Date(a.last_time || a.created_at || 0).getTime();
      const bTime = new Date(b.last_time || b.created_at || 0).getTime();
      
      // Новые контакты (без сообщений) ставим сверху
      const aIsNew = !a.last_message || a.last_message === 'No messages yet';
      const bIsNew = !b.last_message || b.last_message === 'No messages yet';
      
      if (aIsNew && !bIsNew) return -1; // a сверху
      if (!aIsNew && bIsNew) return 1;  // b сверху
      
      // Если оба новые или оба со сообщениями - сортируем по времени (новые сверху)
      return bTime - aTime;
    });

    console.log('[MESSAGES] Sorted contacts:', sortedContacts.map(c => ({name: c.pseudo, lastTime: c.last_time, lastMessage: c.last_message})));

    const contactsHTML = sortedContacts.map(contact => this.createContactItem(contact)).join('');
    contactsList.innerHTML = contactsHTML;

    // Add click handlers
    const contactItems = contactsList.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
      item.addEventListener('click', () => {
        const userId = item.dataset.userId;
        this.selectChat(userId);
      });
    });

    // ИСПРАВЛЕНИЕ 2: Проверяем URL параметры для автоматического выбора чата
    this.checkAutoSelectFromURL(sortedContacts);

    // Префетчим превью последнего сообщения для первых контактов
    this.prefetchLastPreviews(sortedContacts).catch(err => {
      console.warn('[MESSAGES] Prefetch previews error:', err);
    });
  },

  // ИСПРАВЛЕНИЕ 2: Функция для автоматического выбора чата из URL параметров
  checkAutoSelectFromURL(contacts) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const contactParam = urlParams.get('contact');
      
      if (contactParam) {
        console.log('[MESSAGES] Auto-selecting contact from URL:', contactParam);
        
        // Ищем контакт по ID
        const targetContact = contacts.find(contact => {
          const contactId = contact.m_id || contact.id || contact.user_id;
          return contactId == contactParam;
        });
        
        if (targetContact) {
          const contactId = targetContact.m_id || targetContact.id || targetContact.user_id;
          console.log('[MESSAGES] Found target contact:', targetContact.pseudo);
          
          // Автоматически выбираем чат через небольшую задержку
          setTimeout(() => {
            this.selectChat(contactId);
          }, 500);
        } else {
          console.warn('[MESSAGES] Contact not found in list:', contactParam);
        }
        
        // Очищаем URL от параметров чтобы не мешались при дальнейшей навигации
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (error) {
      console.error('[MESSAGES] Error in checkAutoSelectFromURL:', error);
    }
  },

  async prefetchLastPreviews(contacts) {
    try {
      const authManager = window.authManager;
      const sessionId = authManager?.sessionId;
      const userId = authManager?.userId || authManager?.currentUser?.m_id || authManager?.currentUser?.user_id || authManager?.currentUser?.pseudo;
      if (!sessionId || !userId) return;

      const sample = contacts.slice(0, 12); // ограничим количество запросов на старте

      await Promise.all(sample.map(async (contact) => {
        const contactId = contact.m_id || contact.id || contact.user_id;
        if (!contactId) return;

        // 1) Пытаемся взять последнее наше сохранённое сообщение из БД
        try {
          const params = new URLSearchParams({
            action: 'get_messages',
            user_id: userId,
            contact_id: String(contactId),
            session_id: sessionId
          });
          const r = await fetch(`/api/messages?${params.toString()}`);
          const data = await r.json();
          if (data?.success && Array.isArray(data.data) && data.data.length) {
            const last = data.data[data.data.length - 1];
            this.updateContactPreview(String(contactId), last.message_text || '', last.created_at);
            return; // превью обновлено
          }
        } catch (e) {
          console.warn('[MESSAGES] DB preview fetch failed for', contactId, e);
        }

        // 2) Фоллбэк: берём последнее сообщение с внешнего API (для контактов без локальных записей)
        try {
          const external = await this.callMessagesAPI(String(contactId));
          if (external?.success && Array.isArray(external.messages) && external.messages.length) {
            const last = external.messages[external.messages.length - 1];
            const text = last.text || last.message || last.content || '';
            const time = last.timestamp || last.created_at || new Date().toISOString();
            this.updateContactPreview(String(contactId), text, time);
          }
        } catch (e) {
          console.warn('[MESSAGES] External preview fetch failed for', contactId, e);
        }
      }));
    } catch (error) {
      console.warn('[MESSAGES] prefetchLastPreviews error root:', error);
    }
  },

  createContactItem(contact) {
    // Согласно документации API load_contacts контакт содержит: m_id, pseudo, photo, etc.
    const userId = contact.m_id || contact.id || contact.user_id || 'unknown';
    const username = contact.pseudo || contact.username || contact.name || 'Unknown User';
    
    // ИСПРАВЛЕНИЕ 3: Улучшенная логика получения последнего сообщения
    let lastMessage = contact.last_message || contact.lastMessage || '';
    
    // Если у нас есть кэшированные сообщения для этого контакта, берем последнее
    if (this.messagesCache && this.messagesCache[userId] && this.messagesCache[userId].length > 0) {
      const lastCachedMessage = this.messagesCache[userId][this.messagesCache[userId].length - 1];
      lastMessage = lastCachedMessage.text || lastCachedMessage.message || lastMessage;
    }
    
    // Fallback если сообщений нет
    if (!lastMessage || lastMessage.trim() === '') {
      lastMessage = 'No messages yet';
    }
    
    const lastTime = contact.last_time || contact.lastTime || '';
    const photoUrl = contact.photo || contact.picture || null;
    const hasPhoto = contact.photo_url || contact.avatar || contact.picture;
    const isOnline = contact.is_online === 1 || contact.is_online === '1';
    const hasUnread = contact.unread_count > 0;

    // Format time
    const timeDisplay = this.formatMessageTime(lastTime);
    
    return `
      <div class="contact-item ${hasUnread ? 'contact-unread' : ''}" data-user-id="${userId}" id="contact-${userId}">
        <div class="contact-avatar">
          ${photoUrl ? `<img src="${photoUrl}" alt="${username}" onerror="this.style.display='none'">` : '👤'}
        </div>
        <div class="contact-info">
          <div class="contact-header">
            <div class="contact-name">${username}</div>
            <div class="contact-time">${timeDisplay}</div>
          </div>
          <div class="contact-last-message" id="last-message-${userId}">${lastMessage}</div>
        </div>
      </div>
    `;
  },

  async selectChat(userId) {
    console.log('[MESSAGES] Selecting chat with user:', userId);
    
    // Update active contact
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.userId === userId) {
        item.classList.add('active');
      }
    });

    // Find contact info (используем правильное поле m_id)
    const contact = this.contacts.find(c => (c.m_id || c.id || c.user_id) == userId);
    if (contact) {
      this.updateChatHeader(contact);
    }

    // Load chat messages
    this.currentChatUserId = userId;
    await this.loadChatMessages(userId);
    
    // Show chat interface
    this.showChatInterface();
  },

  // ИСПРАВЛЕНИЕ 3: Функция для обновления превью последнего сообщения в списке контактов
  updateContactPreview(userId, lastText = null, lastTime = null) {
    try {
      const lastMessageElement = document.getElementById(`last-message-${userId}`);
      if (!lastMessageElement) return;

      // Используем переданный текст или берем из кэша
      let messageText = lastText;
      
      if (!messageText && this.messagesCache && this.messagesCache[userId] && this.messagesCache[userId].length > 0) {
        const messages = this.messagesCache[userId];
        const lastMessage = messages[messages.length - 1];
        messageText = lastMessage.text;
      }
      
      if (messageText && messageText.trim() !== '') {
        console.log('[MESSAGES] Updating contact preview for:', userId, 'with message:', messageText);
        lastMessageElement.textContent = messageText;
        
        // Также обновляем время если передано
        if (lastTime) {
          const timeElement = lastMessageElement.parentElement.querySelector('.contact-time');
          if (timeElement) {
            timeElement.textContent = this.formatMessageTime(lastTime);
          }
        }
      }
    } catch (error) {
      console.error('[MESSAGES] Error updating contact preview:', error);
    }
  },

  updateChatHeader(contact) {
    const chatUserName = document.getElementById('chatUserName');
    const chatUserStatus = document.getElementById('chatUserStatus');
    const chatUserAvatar = document.getElementById('chatUserAvatar');
    
    if (chatUserName) {
      chatUserName.textContent = contact.pseudo || contact.username || contact.name || 'Unknown User';
    }
    
    if (chatUserStatus) {
      const isOnline = contact.is_online === 1 || contact.is_online === '1';
      chatUserStatus.textContent = isOnline ? 'Online' : 'Offline';
      chatUserStatus.className = `chat-user-status ${isOnline ? 'online' : 'offline'}`;
    }
    
    if (chatUserAvatar) {
      const photoUrl = contact.photo || contact.picture || null;
      if (photoUrl) {
        chatUserAvatar.src = photoUrl;
        chatUserAvatar.style.display = 'block';
        chatUserAvatar.onerror = () => {
          chatUserAvatar.style.display = 'none';
          chatUserAvatar.alt = '👤';
        };
      } else {
        chatUserAvatar.src = '';
        chatUserAvatar.style.display = 'none';
        chatUserAvatar.alt = '👤';
      }
    }
  },

  showChatInterface() {
    const chatEmpty = document.getElementById('chatEmpty');
    const chatActive = document.getElementById('chatActive');
    
    if (chatEmpty) chatEmpty.style.display = 'none';
    if (chatActive) chatActive.style.display = 'flex';
    // После показа активного чата убеждаемся, что область сообщений прокручивается,
    // а нижняя панель не пропадает из-за переполнения
    const chatArea = document.querySelector('.chat-area');
    const chatMessages = document.getElementById('chatMessages');
    if (chatArea) chatArea.style.minHeight = '0';
    if (chatMessages) chatMessages.style.overflowY = 'auto';
  },

  async loadChatMessages(userId) {
    const chatMessages = document.getElementById('chatMessages');
    
    console.log(`[MESSAGES] Loading messages for user: ${userId}`);
    
    try {
      // Загружаем сообщения из нашей БД
      const dbMessages = await this.getMessagesFromDB(userId);
      
      // Загружаем сообщения с внешнего API
      const result = await this.callMessagesAPI(userId);
      
      let allMessages = [];
      
      // Добавляем сообщения из нашей БД (отправленные нами)
      if (dbMessages.length > 0) {
        // Преобразуем формат БД в формат сообщений
        const formattedDbMessages = dbMessages.map(msg => ({
          message: msg.message_text,
          timestamp: msg.created_at,
          from_me: msg.is_own,
          text: msg.message_text,
          created_at: msg.created_at
        }));
        allMessages = [...formattedDbMessages];
        console.log(`[MESSAGES] Loaded ${dbMessages.length} messages from DB`);
        console.log('[MESSAGES] Formatted DB messages:', formattedDbMessages);
      } else {
        console.log('[MESSAGES] ⚠️ No messages found in DB for this conversation');
      }
      
      // Объединяем с внешними сообщениями
      if (result.success && result.messages) {
        allMessages = [...allMessages, ...result.messages];
        console.log(`[MESSAGES] Added ${result.messages.length} messages from external API`);
      }
      
      // Сортируем по времени
      allMessages.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.created_at || 0);
        const timeB = new Date(b.timestamp || b.created_at || 0);
        return timeA - timeB;
      });
      
      // ИСПРАВЛЕНИЕ 3: Сохраняем сообщения в кэш для обновления превью
      if (!this.messagesCache) this.messagesCache = {};
      this.messagesCache[userId] = allMessages.map(msg => ({
        text: msg.text || msg.message || msg.content || '',
        timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
        isOwn: msg.from_me || msg.is_own || false
      }));
      
      console.log('[MESSAGES] Cached messages for user:', userId, this.messagesCache[userId]);
      
      this.displayChatMessages(allMessages);
      console.log(`[MESSAGES] Total displayed: ${allMessages.length} messages`);

      // Обновляем превью последнего сообщения в списке контактов
      if (allMessages.length > 0) {
        const last = allMessages[allMessages.length - 1];
        const lastText = last.text || last.message || last.content || '';
        const lastTime = last.timestamp || last.created_at || new Date().toISOString();
        this.updateContactPreview(userId, lastText, lastTime);
      }
      
    } catch (error) {
      console.error('[MESSAGES] Error loading messages:', error);
      this.showChatError(error.message);
    }
  },

  // Получение сообщений из БД
  async getMessagesFromDB(contactId) {
    try {
      const authManager = window.authManager;
      const sessionId = authManager?.sessionId;
      const userId = authManager?.userId;
      
      if (!sessionId || !userId) {
        console.error('[MESSAGES] Нет данных сессии для получения сообщений');
        console.log('[MESSAGES] authManager:', authManager);
        console.log('[MESSAGES] sessionId:', sessionId, 'userId:', userId);
        console.log('[MESSAGES] currentUser:', authManager?.currentUser);
        
        // Попробуем альтернативные поля для userId
        const alternativeUserId = authManager?.currentUser?.m_id || 
                                  authManager?.currentUser?.user_id || 
                                  authManager?.currentUser?.pseudo;
        
        if (sessionId && alternativeUserId) {
          console.log('[MESSAGES] Используем альтернативный userId:', alternativeUserId);
          // Продолжаем с альтернативным ID
        } else {
          return [];
        }
      }
      
      // Определяем финальный userId
      const finalUserId = userId || authManager?.currentUser?.m_id || 
                          authManager?.currentUser?.user_id || 
                          authManager?.currentUser?.pseudo;
      
      const params = new URLSearchParams({
        action: 'get_messages',
        user_id: finalUserId,
        contact_id: contactId,
        session_id: sessionId
      });
      
      console.log('[MESSAGES] Запрос к БД:', `/api/messages?${params.toString()}`);
      
      const response = await fetch(`/api/messages?${params.toString()}`);
      const result = await response.json();
      
      console.log('[MESSAGES] ========== ДЕТАЛЬНЫЙ ОТВЕТ БД ==========');
      console.log('[MESSAGES] Response status:', response.status);
      console.log('[MESSAGES] Response ok:', response.ok);
      console.log('[MESSAGES] Result:', result);
      console.log('[MESSAGES] Result.success:', result.success);
      console.log('[MESSAGES] Result.data:', result.data);
      if (result.data && Array.isArray(result.data)) {
        console.log('[MESSAGES] Количество сообщений в БД:', result.data.length);
        result.data.forEach((msg, index) => {
          console.log(`[MESSAGES] Сообщение ${index}:`, msg);
        });
      }
      console.log('[MESSAGES] ============================================');
      
      if (result.success) {
        return result.data || [];
      } else {
        console.error('[MESSAGES] Ошибка получения из БД:', result.error);
        return [];
      }
    } catch (error) {
      console.error('[MESSAGES] Ошибка запроса к БД:', error);
      return [];
    }
  },

  // Сохранение сообщения в БД
  async saveMessageToDB(recipientId, messageText) {
    try {
      const authManager = window.authManager;
      const sessionId = authManager?.sessionId;
      const userId = authManager?.userId;
      
      // Определяем финальный userId
      const finalUserId = userId || authManager?.currentUser?.m_id || 
                          authManager?.currentUser?.user_id || 
                          authManager?.currentUser?.pseudo;
      
      if (!sessionId || !finalUserId) {
        console.error('[MESSAGES] Нет данных сессии для сохранения сообщения');
        console.log('[MESSAGES] authManager:', authManager);
        console.log('[MESSAGES] sessionId:', sessionId, 'finalUserId:', finalUserId);
        console.log('[MESSAGES] currentUser:', authManager?.currentUser);
        return null;
      }
      
      console.log('[MESSAGES] Сохраняем сообщение в БД:', {
        sender_id: finalUserId,
        recipient_id: recipientId,
        message_text: messageText,
        session_id: sessionId
      });
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'save_message',
          sender_id: finalUserId,
          recipient_id: recipientId,
          message_text: messageText,
          session_id: sessionId
        })
      });
      
      const result = await response.json();
      console.log('[MESSAGES] Ответ сохранения в БД:', result);
      
      if (result.success) {
        return result.data;
      } else {
        console.error('[MESSAGES] Ошибка сохранения в БД:', result.error);
        return null;
      }
    } catch (error) {
      console.error('[MESSAGES] Ошибка запроса к БД:', error);
      return null;
    }
  },

  async callMessagesAPI(userId) {
    const sessionId = window.authManager?.sessionId;
    if (!sessionId) {
      return { success: false, error: 'No session ID available' };
    }

    // Найдем контакт по userId для получения nickname
    const contact = this.contacts.find(c => (c.m_id || c.id || c.user_id) == userId);
    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Получаем API ключ
    const apiConfigResponse = await fetch('/api/get-api-key');
    const apiConfig = await apiConfigResponse.json();
    
    if (!apiConfig.apiKey) {
      return { success: false, error: 'No API key available' };
    }

    // Параметры согласно документации: api-key, session_id, contact (nickname), contact_id
    const messageParams = new URLSearchParams({
      api_key: apiConfig.apiKey,
      session_id: sessionId,
      contact: contact.pseudo || contact.username || contact.name || '',
      contact_id: userId
    });
    
    const apiUrl = `/api/spice-multi-test?endpoint=/ajax_api/load_messages&method=GET&${messageParams.toString()}`;
    
    console.log('[MESSAGES] API call for messages with user:', userId, 'contact:', contact.pseudo);

    const response = await fetch(apiUrl);
    const result = await response.json();
    
    console.log('🔍 [MESSAGES] ========== ДЕТАЛЬНЫЙ АНАЛИЗ API ОТВЕТА ==========');
    console.log('[MESSAGES] API URL:', apiUrl);
    console.log('[MESSAGES] Response status:', response.status);
    console.log('[MESSAGES] Raw API Response:', result);
    console.log('[MESSAGES] result.success:', result.success);
    console.log('[MESSAGES] result.data:', result.data);
    
    if (result.data) {
      console.log('[MESSAGES] result.data.result:', result.data.result);
      console.log('[MESSAGES] result.data.messages:', result.data.messages);
      console.log('[MESSAGES] Type of result.data.result:', typeof result.data.result);
      console.log('[MESSAGES] Is Array result.data.result:', Array.isArray(result.data.result));
      
      if (Array.isArray(result.data.result)) {
        console.log('[MESSAGES] Количество сообщений в result.data.result:', result.data.result.length);
        result.data.result.forEach((msg, index) => {
          console.log(`[MESSAGES] Message ${index}:`, msg);
        });
      }
    }
    console.log('🔍 [MESSAGES] ===================================================');

    if (result.success && result.data) {
      return {
        success: true,
        messages: result.data.result || result.data.messages || []
      };
    } else {
      return {
        success: false,
        error: result.data?.error || result.error || 'Failed to load messages'
      };
    }
  },

  displayChatMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    const chatArea = document.querySelector('.chat-area');
    
    if (!chatMessages) return;

    if (!messages || messages.length === 0) {
      chatMessages.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center; color: #64748b; padding: 40px 20px;">
          <h4 style="margin: 0 0 8px 0; color: #1e293b;">No messages yet</h4>
          <p style="margin: 0; font-size: 14px;">Start the conversation by sending a message!</p>
        </div>
      `;
      return;
    }

    // Создаем простой HTML для сообщений
    const messagesHTML = messages.map(message => this.createSimpleMessageItem(message)).join('');
    chatMessages.innerHTML = messagesHTML;
    
    // Ensure layout allows scrolling and scroll to bottom
    if (chatArea) chatArea.style.minHeight = '0';
    if (chatMessages) chatMessages.style.overflowY = 'auto';
    this.scrollToBottom();
  },

  createSimpleMessageItem(message) {
    const isOwn = message.isOwn || message.from_me || false;
    const text = message.text || message.message || message.content || '';
    const time = this.formatMessageTime(message.timestamp || message.created_at || Date.now());

    // Поддержка сообщений-подарков: показываем соответствующий значок подарка + текст
    const isGift = message.isGift || /Sent a gift:/i.test(text);
    let bubble = text;
    let giftIcon = '';
    if (isGift) {
      const nameMatch = text.match(/Sent a gift:\s*(.+)$/i);
      const giftName = nameMatch ? nameMatch[1] : '';
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
      const icon = emojiMap[giftName] || '🎁';
      bubble = `Sent a gift: ${giftName || text.replace(/^[^:]*:/,'').trim()}`;
      // Подарок отображается отдельно под сообщением
      giftIcon = `<div style="text-align: ${isOwn ? 'right' : 'left'}; margin-top: 8px;">
        <span style="font-size: 48px; display: inline-block;">${icon}</span>
      </div>`;
    }
    
    return `
      <div class="message-item ${isOwn ? 'own' : ''}">
        <div class="message-avatar">
          ${isOwn ? '👤' : '👤'}
        </div>
        <div class="message-content">
          <div class="message-bubble">
            ${bubble}
          </div>
          ${giftIcon}
          <div class="message-time">${time}</div>
        </div>
      </div>
    `;
  },

  groupMessagesByDate(messages) {
    const groups = [];
    let currentDate = null;
    let currentGroup = null;

    messages.forEach(message => {
      const messageDate = new Date(message.created_at || message.timestamp || Date.now());
      const dateStr = messageDate.toDateString();

      if (dateStr !== currentDate) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          date: dateStr,
          messages: []
        };
        currentDate = dateStr;
      }

      currentGroup.messages.push(message);
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  },

  createMessageGroup(group) {
    const dateDisplay = this.formatMessageDate(group.date);
    const messagesHTML = group.messages.map(message => this.createMessageItem(message)).join('');
    
    return `
      <div class="messages-date-separator">${dateDisplay}</div>
      ${messagesHTML}
    `;
  },

  createMessageItem(message) {
    const isFromMe = message.from_me === 1 || message.from_me === '1' || message.sender_id == window.authManager.userId;
    const messageClass = isFromMe ? 'sent' : 'received';
    const messageText = message.message || message.text || message.content || '';
    const messageTime = this.formatMessageTime(message.created_at || message.timestamp);

    return `
      <div class="message-item ${messageClass}">
        <div class="message-bubble">
          ${messageText}
          <div class="message-time">${messageTime}</div>
        </div>
      </div>
    `;
  },

  async handleSendMessage() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    
    if (!messageInput || !this.currentChatUserId) return;
    
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    console.log('[MESSAGES] Sending message to:', this.currentChatUserId);
    
    try {
      // Disable input during send
      messageInput.disabled = true;
      sendBtn.disabled = true;
      sendBtn.innerHTML = '⏳';

      const result = await this.callSendMessageAPI(this.currentChatUserId, messageText);
      
      if (result.success) {
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Update character count
        const charCount = document.getElementById('messageCharCount');
        if (charCount) charCount.textContent = '0/1000';
        
        // Add message to chat immediately (optimistic update)
        this.addMessageToChat({
          message: messageText,
          from_me: 1,
          created_at: new Date().toISOString()
        });
        
        // Reload contacts to update last message
        this.loadContacts();
        
        console.log('[MESSAGES] Message sent successfully');
        
      } else {
        this.showNotification(`Failed to send message: ${result.error}`, 'error');
      }
      
    } catch (error) {
      console.error('[MESSAGES] Error sending message:', error);
      this.showNotification(`Error sending message: ${error.message}`, 'error');
    } finally {
      // Re-enable input
      messageInput.disabled = false;
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<span class="send-icon">➤</span>';
      messageInput.focus();
    }
  },

  async callSendMessageAPI(userId, message) {
    const sessionId = window.authManager?.sessionId;
    if (!sessionId) {
      return { success: false, error: 'No session ID available' };
    }

    // Найдем контакт по userId для получения nickname
    const contact = this.contacts.find(c => (c.m_id || c.id || c.user_id) == userId);
    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Получаем API ключ
    const apiConfigResponse = await fetch('/api/get-api-key');
    const apiConfig = await apiConfigResponse.json();
    
    if (!apiConfig.apiKey) {
      return { success: false, error: 'No API key available' };
    }

    // Параметры согласно документации: session_id, dest (nickname), msg (текст сообщения)
    const sendParams = new URLSearchParams({
      api_key: apiConfig.apiKey,
      session_id: sessionId,
      dest: contact.pseudo || contact.username || contact.name || '',
      msg: message
    });
    
    const apiUrl = `/api/spice-multi-test?endpoint=/ajax_api/send_message&method=GET&${sendParams.toString()}`;
    
    console.log('[MESSAGES] API call to send message to:', contact.pseudo, 'message:', message);

    const response = await fetch(apiUrl);
    const result = await response.json();
    console.log('[MESSAGES] Send message API Response:', result);

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        error: result.data?.error || result.error || 'Failed to send message'
      };
    }
  },

  addMessageToChat(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    // Remove empty state if present
    const emptyState = chatMessages.querySelector('div[style*="flex-direction: column"]');
    if (emptyState && emptyState.textContent.includes('No messages yet')) {
      emptyState.remove();
    }

    // Add message using the simple format
    const messageHTML = this.createSimpleMessageItem(message);
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
    
    // Scroll to bottom
    this.scrollToBottom();

    // Обновляем превью для активного контакта
    try {
      const userId = this.currentChatUserId;
      const text = message.text || message.message || message.content || '';
      const time = message.timestamp || message.created_at || new Date().toISOString();
      if (userId && text) {
        this.updateContactPreview(userId, text, time);
      }
    } catch (e) {
      console.warn('[MESSAGES] Failed to update contact preview:', e);
    }
  },

  // Обновление превью в левом списке контактов
  updateContactPreview(userId, text, timestamp) {
    const item = document.querySelector(`.contact-item[data-user-id="${userId}"]`);
    if (!item) return;
    const lastEl = item.querySelector('.contact-last-message');
    const timeEl = item.querySelector('.contact-time');
    if (lastEl) {
      const normalized = String(text || '').replace(/\s+/g, ' ').trim();
      lastEl.textContent = normalized.length > 70 ? `${normalized.slice(0, 67)}...` : normalized || '—';
    }
    if (timeEl) {
      timeEl.textContent = this.formatMessageTime(timestamp);
    }
  },

  scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  },

  openChatWithUser(userId, userName) {
    console.log('[MESSAGES] Opening chat with user:', userId, userName);
    
    // Switch to messages section if not already there
    if (this.currentSection !== 'messages') {
      this.switchSection('messages');
    }
    
    // Find user in contacts or add them
    const existingContact = this.contacts?.find(contact => contact.id == userId);
    
    if (existingContact) {
      // Open existing contact chat using selectChat
      this.selectChat(userId);
    } else {
      // Create temporary contact for new match
      const tempContact = {
        id: userId,
        pseudo: userName || 'Match',
        nom_complet: userName || 'Match',
        is_new_match: true
      };
      
      // Add to contacts temporarily 
      if (!this.contacts) this.contacts = [];
      this.contacts.unshift(tempContact);
      
      // Refresh contacts display
      this.displayContacts(this.contacts);
      
      // Open chat with new contact using selectChat
      this.selectChat(userId);
      
      // Show notification
      this.showNotification(`New match! You can now message ${userName}`, 'success');
    }
  },

  startMessagePolling() {
    // Poll for new messages every 10 seconds
    this.messagePollingInterval = setInterval(() => {
      if (this.currentChatUserId) {
        this.loadChatMessages(this.currentChatUserId);
      }
      this.loadContacts(); // Update contact list
    }, 10000);
  },

  stopMessagePolling() {
    if (this.messagePollingInterval) {
      clearInterval(this.messagePollingInterval);
      this.messagePollingInterval = null;
    }
  },

  filterContacts(searchTerm) {
    const contactItems = document.querySelectorAll('.contact-item');
    const term = searchTerm.toLowerCase();

    contactItems.forEach(item => {
      const name = item.querySelector('.contact-name')?.textContent.toLowerCase() || '';
      const message = item.querySelector('.contact-last-message')?.textContent.toLowerCase() || '';
      
      if (name.includes(term) || message.includes(term)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  },

  formatMessageTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // This week - show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  },

  formatMessageDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  },

  showContactsError(message) {
    const contactsList = document.getElementById('contactsList');
    if (contactsList) {
      contactsList.innerHTML = `
        <div class="contacts-error" style="text-align: center; padding: 40px 20px; color: #ef4444;">
          <div style="font-size: 32px; margin-bottom: 16px;">❌</div>
          <h4>Failed to load conversations</h4>
          <p>${message}</p>
          <button class="btn-secondary btn-sm" onclick="dashboard.loadContacts()" style="margin-top: 16px;">
            Try Again
          </button>
        </div>
      `;
    }
  },

  showChatError(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      chatMessages.innerHTML = `
        <div class="chat-error" style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center; color: #ef4444; padding: 40px 20px;">
          <div style="font-size: 32px; margin-bottom: 16px;">❌</div>
          <h4>Failed to load messages</h4>
          <p>${message}</p>
        </div>
      `;
    }
  }

});