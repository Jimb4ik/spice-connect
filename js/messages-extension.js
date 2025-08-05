// Messages System Extension Methods
// This file extends the Dashboard class with message functionality

// Extend Dashboard prototype with message methods
Object.assign(Dashboard.prototype, {
  
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

    const contactsHTML = contacts.map(contact => this.createContactItem(contact)).join('');
    contactsList.innerHTML = contactsHTML;

    // Add click handlers
    const contactItems = contactsList.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
      item.addEventListener('click', () => {
        const userId = item.dataset.userId;
        this.selectChat(userId);
      });
    });
  },

  createContactItem(contact) {
    // Согласно документации API load_contacts контакт содержит: m_id, pseudo, photo, etc.
    const userId = contact.m_id || contact.id || contact.user_id || 'unknown';
    const username = contact.pseudo || contact.username || contact.name || 'Unknown User';
    const lastMessage = contact.last_message || contact.lastMessage || 'No messages yet';
    const lastTime = contact.last_time || contact.lastTime || '';
    const photoUrl = contact.photo || contact.picture || null;
    const hasPhoto = contact.photo_url || contact.avatar || contact.picture;
    const isOnline = contact.is_online === 1 || contact.is_online === '1';
    const hasUnread = contact.unread_count > 0;

    // Format time
    const timeDisplay = this.formatMessageTime(lastTime);
    
    return `
      <div class="contact-item ${hasUnread ? 'contact-unread' : ''}" data-user-id="${userId}">
        <div class="contact-avatar">
          ${photoUrl ? `<img src="${photoUrl}" alt="${username}" onerror="this.style.display='none'">` : '👤'}
        </div>
        <div class="contact-info">
          <div class="contact-header">
            <div class="contact-name">${username}</div>
            <div class="contact-time">${timeDisplay}</div>
          </div>
          <div class="contact-last-message">${lastMessage}</div>
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
  },

  async loadChatMessages(userId) {
    const chatMessages = document.getElementById('chatMessages');
    
    console.log(`[MESSAGES] Loading messages for user: ${userId}`);
    
    try {
      const result = await this.callMessagesAPI(userId);
      
      if (result.success && result.messages) {
        this.displayChatMessages(result.messages);
        console.log(`[MESSAGES] Loaded ${result.messages.length} messages`);
      } else {
        this.showChatError(result.error || 'Failed to load messages');
      }
      
    } catch (error) {
      console.error('[MESSAGES] Error loading messages:', error);
      this.showChatError(error.message);
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
      'api-key': apiConfig.apiKey,
      session_id: sessionId,
      contact: contact.pseudo || contact.username || contact.name || '',
      contact_id: userId
    });
    
    const apiUrl = `/api/spice-multi-test?endpoint=/ajax_api/load_messages&method=GET&${messageParams.toString()}`;
    
    console.log('[MESSAGES] API call for messages with user:', userId, 'contact:', contact.pseudo);

    const response = await fetch(apiUrl);
    const result = await response.json();
    console.log('[MESSAGES] Messages API Response:', result);

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
    
    if (!chatMessages) return;

    if (!messages || messages.length === 0) {
      chatMessages.innerHTML = `
        <div class="chat-empty" style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center; color: #6b7280; padding: 40px 20px;">
          <div style="font-size: 32px; margin-bottom: 16px;">💬</div>
          <h4>No messages yet</h4>
          <p>Start the conversation by sending a message!</p>
        </div>
      `;
      return;
    }

    // Group messages by date and create HTML
    const messagesHTML = this.groupMessagesByDate(messages)
      .map(group => this.createMessageGroup(group))
      .join('');
    
    chatMessages.innerHTML = messagesHTML;
    
    // Scroll to bottom
    this.scrollToBottom();
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
    const emptyState = chatMessages.querySelector('.chat-empty');
    if (emptyState) {
      emptyState.remove();
    }

    // Add message
    const messageHTML = this.createMessageItem(message);
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
    
    // Scroll to bottom
    this.scrollToBottom();
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