// Matching System for Lavrilo
// Handles both Tinder-style matching and Secret Garden game

class MatchingSystem {
  constructor() {
    // Система пагинации для больших объемов профилей (50k+)
    this.currentPage = 0;
    this.profilesPerPage = 150; // Загружаем по 150 профилей за раз для более плавного UX
    this.maxRetries = 3; // Максимум попыток загрузки
    this.lastLoadedCount = 0; // Сколько профилей загрузилось в последний раз
    this.totalProfilesLoaded = 0; // Общее количество загруженных профилей
    
    // Текущая страница для fallback поиска
    this.searchPage = 0;
    // Максимальное количество страниц (обновляется из ответа API)
    this.totalSearchPages = 999;
    this.currentMode = 'tinder'; // tinder, secret-garden, my-matches
    this.tinderProfiles = [];
    this.currentProfileIndex = 0;
    this.stats = {
      totalLikes: 0,
      totalMatches: 0
    };
    
    // Tracking viewed and liked profiles
    this.viewedProfiles = new Set(); // ID просмотренных профилей
    this.likedProfiles = new Set(); // ID лайкнутых профилей
    
    // Secret Garden data
    this.gardenMode = 'flash'; // flash, guess, results
    this.flashProfiles = [];
    this.guessProfiles = [];
    this.myMatches = [];
    
    this.init();
  }

  init() {
    console.log('[MATCHING] Initializing matching system...');
    this.loadUserStats(); // Загружаем сохраненную статистику
    this.loadViewedProfiles(); // Загружаем просмотренные профили
    this.setupEventListeners();
    this.loadInitialData();
    this.updateStats();
  }

  setupEventListeners() {
    // Mode switching
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.switchMode(mode);
      });
    });

    // Tinder actions
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    const superlikeBtn = document.getElementById('superlikeBtn');

    if (likeBtn) likeBtn.addEventListener('click', () => this.handleTinderAction('like'));
    if (dislikeBtn) dislikeBtn.addEventListener('click', () => this.handleTinderAction('dislike'));
    if (superlikeBtn) superlikeBtn.addEventListener('click', () => this.handleTinderAction('superlike'));
    
    // Swipe drag отключен по UX-требованиям
    // this.initializeDragAndDrop();

    // Secret Garden tabs
    document.querySelectorAll('.garden-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const gardenMode = e.currentTarget.dataset.tab;
        this.switchGardenMode(gardenMode);
      });
    });

    // Match modal actions
    const keepSwipingBtn = document.getElementById('keepSwiping');
    const sendMessageBtn = document.getElementById('sendMessage');
    const continueGameBtn = document.getElementById('continueGame');
    const startChatBtn = document.getElementById('startChat');

    if (keepSwipingBtn) keepSwipingBtn.addEventListener('click', () => this.closeMatchModal());
    if (sendMessageBtn) sendMessageBtn.addEventListener('click', () => this.sendMessageToMatch());
    if (continueGameBtn) continueGameBtn.addEventListener('click', () => this.closeGardenMatchModal());
    if (startChatBtn) startChatBtn.addEventListener('click', () => this.startChatWithMatch());

    // Other buttons
    const startSwipingBtn = document.getElementById('startSwiping');
    const adjustFiltersBtn = document.getElementById('adjustFilters');

    if (startSwipingBtn) startSwipingBtn.addEventListener('click', () => this.switchMode('tinder'));
    if (adjustFiltersBtn) adjustFiltersBtn.addEventListener('click', () => this.openFilters());
  }

  async loadInitialData() {
    // Load user stats and initial profiles
    await this.loadUserStats();
    await this.loadTinderProfiles();
  }

  // =====================================
  // MODE SWITCHING
  // =====================================

  switchMode(mode) {
    console.log(`[MATCHING] Switching to mode: ${mode}`);
    this.currentMode = mode;

    // Update tab active states
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // Show/hide mode content
    document.querySelectorAll('.matching-mode').forEach(modeEl => {
      modeEl.classList.remove('active');
    });
    document.getElementById(`${mode}-mode`).classList.add('active');

    // Load mode-specific data
    switch (mode) {
      case 'tinder':
        this.loadTinderProfiles();
        break;
      case 'secret-garden':
        this.loadSecretGarden();
        break;
      case 'my-matches':
        this.loadMyMatches();
        break;
    }
  }

  switchGardenMode(gardenMode) {
    console.log(`[MATCHING] Switching garden mode to: ${gardenMode}`);
    this.gardenMode = gardenMode;

    // Update garden tab active states
    document.querySelectorAll('.garden-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${gardenMode}"]`).classList.add('active');

    // Show/hide garden content
    document.querySelectorAll('.garden-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${gardenMode}-content`).classList.add('active');

    // Load mode-specific data
    switch (gardenMode) {
      case 'flash':
        this.loadFlashProfiles();
        break;
      case 'guess':
        this.loadGuessingGame();
        break;
      case 'results':
        this.loadGardenResults();
        break;
    }
  }

  // =====================================
  // TINDER MATCHING
  // =====================================

  async loadTinderProfiles(forceReload = false) {
    if (forceReload) {
      this.tinderProfiles = [];
      this.currentProfileIndex = 0;
    }
    console.log('[MATCHING] Loading Tinder profiles...', forceReload ? '(forced reload)' : '');
    this.showTinderLoading(true);

    try {
      // Use authManager session ID (more reliable than localStorage)
      const sessionId = window.authManager?.sessionId || localStorage.getItem('session_id');
      console.log('[MATCHING] Using session ID:', sessionId);
      
      // Собираем список уже просмотренных ID, но ограничиваем длину (max 250 последних),
      // чтобы не превысить лимит длины URL у сервера
      const MAX_EXCLUDE = 250;
      const viewedArr = Array.from(this.viewedProfiles);
      const limitedExcludeArr = viewedArr.slice(-MAX_EXCLUDE); // берем только последние 250 id
      const excludeIds = limitedExcludeArr.join(',');
      console.log(`[MATCHING] exclude_ids limited to last ${limitedExcludeArr.length} IDs (out of ${viewedArr.length})`);
      console.log('[MATCHING] Excluding IDs:', excludeIds.length > 0 ? excludeIds : 'none');

      // --- 1. Пробуем специализированный эндпоинт /index_api/match ---
      // First, get API config
      const apiConfigResponse = await fetch('/api/get-api-key');
      const apiConfig = await apiConfigResponse.json();
      
      const matchQuery = new URLSearchParams({
        session_id: sessionId || '',
        api_key: apiConfig.apiKey,
        action: 'get_profile'
      });
      if (excludeIds) {
        matchQuery.append('exclude_ids', excludeIds);
      }

      console.log('[MATCHING] Match API URL:', `${apiConfig.baseUrl}/index_api/match?${matchQuery.toString()}`);

      const response = await fetch(`${apiConfig.baseUrl}/index_api/match?${matchQuery.toString()}`, {
        method: 'GET'
      });
      const data = await response.json();

      console.log('[MATCHING] Tinder profiles response:', data);

      let profiles = [];
      
      // Handle new API format: {connected: 1, result: [...]}
      if (data.connected === 1 && data.result && Array.isArray(data.result)) {
        profiles = data.result;
        console.log('[MATCHING] Found profiles in data.result:', profiles.length);
      } else if (data.success && data.data && data.data.profile) {
        profiles = [data.data.profile];
      } else if (data.success && data.data) {
        if (data.data.result && Array.isArray(data.data.result)) {
          profiles = data.data.result;
        } else if (data.data.membres && Array.isArray(data.data.membres)) {
          profiles = data.data.membres;
        } else if (Array.isArray(data.data)) {
          profiles = data.data;
        }
      }

      // --- 2. Если профилей нет, пробуем общий поиск /index_api/search ---
      if (false && profiles.length === 0) {  // fallback disabled for testing
        const searchBody = {
          session_id: sessionId,
          page: this.searchPage,
          pas: 20,
          get_picture_430: 1,
          searchAction: 'Last'
        };
        try {
          const searchResp = await fetch(`/api/spice-multi-test?endpoint=/index_api/search&method=POST`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchBody)
          });
          const searchData = await searchResp.json();
          console.log('[MATCHING] Fallback search response:', searchData);
          if (searchData.success && searchData.data) {
            // Обновляем totalSearchPages, если есть
            if (searchData.data.nb_pages) {
              this.totalSearchPages = searchData.data.nb_pages;
            }
            if (searchData.data.result && Array.isArray(searchData.data.result)) {
              profiles = searchData.data.result;
            } else if (Array.isArray(searchData.data.membres)) {
              profiles = searchData.data.membres;
            } else if (Array.isArray(searchData.data)) {
              profiles = searchData.data;
            }
          }
        } catch (fallbackErr) {
          console.error('[MATCHING] Fallback search error:', fallbackErr);
        }
      }

      console.log('[MATCHING] Raw profiles from API:', profiles.length);
      console.log('[MATCHING] Current page:', this.currentPage);
      console.log('[MATCHING] Sample profile structure:', profiles[0]);
      console.log('[MATCHING] Viewed profiles count:', this.viewedProfiles.size);
      
      // Сохраняем количество загруженных профилей до фильтрации
      this.lastLoadedCount = profiles.length;
      console.log(`[MATCHING] API returned ${this.lastLoadedCount} profiles (requested ${this.profilesPerPage})`);
      
      // Фильтруем уже просмотренные профили на всякий случай
      const originalCount = profiles.length;
      profiles = profiles.filter(profile => {
        const profileId = profile.id || profile.id_membre;
        return !this.viewedProfiles.has(profileId);
      });

      console.log('[MATCHING] Profiles after filtering:', profiles.length, `(${originalCount - profiles.length} already viewed)`);

      if (profiles.length > 0) {
        // Увеличиваем страницу для следующей загрузки
        this.currentPage++;
        this.totalProfilesLoaded += profiles.length;
        
        console.log(`[MATCHING] Successfully loaded ${profiles.length} profiles from page ${this.currentPage - 1}`);
        console.log(`[MATCHING] Total profiles loaded so far: ${this.totalProfilesLoaded}`);
        
        // Если это первая загрузка или нет существующих профилей
        if (!this.tinderProfiles || this.tinderProfiles.length === 0) {
          this.tinderProfiles = profiles;
          this.currentProfileIndex = 0;
          console.log(`[MATCHING] Initial load: ${profiles.length} profiles`);
          this.displayCurrentProfile();
        } else {
          // Добавляем новые профили к существующим
          this.tinderProfiles.push(...profiles);
          console.log(`[MATCHING] Added ${profiles.length} more profiles. Total buffer: ${this.tinderProfiles.length}`);
          
          // Очищаем старые профили если буфер стал слишком большим (больше 500 профилей)
          if (this.tinderProfiles.length > 500 && this.currentProfileIndex > 200) {
            const toRemove = this.currentProfileIndex - 100; // Оставляем 100 профилей назад
            this.tinderProfiles.splice(0, toRemove);
            this.currentProfileIndex -= toRemove;
            console.log(`[MATCHING] Cleaned up ${toRemove} old profiles. New index: ${this.currentProfileIndex}, buffer: ${this.tinderProfiles.length}`);
          }
          
          // Если мы на последнем профиле, покажем следующий
          if (this.currentProfileIndex >= this.tinderProfiles.length - profiles.length) {
            this.displayCurrentProfile();
          }
        }
      } else {
        console.log('[MATCHING] No new profiles found on page', this.currentPage);
        
        // Если API вернул пустой результат, пробуем следующую страницу
        if (this.lastLoadedCount === 0 && this.currentPage < 100) {
          console.log('[MATCHING] Empty result, trying next page...');
          this.currentPage++;
          this.loadTinderProfiles(false);
          return;
        }
        
        // Если API вернул меньше профилей чем ожидалось, попробуем следующую страницу
        if (this.lastLoadedCount > 0 && this.lastLoadedCount < this.profilesPerPage && this.currentPage < 100) {
          console.log(`[MATCHING] Got ${this.lastLoadedCount} profiles (expected ${this.profilesPerPage}), trying next page...`);
          this.currentPage++;
          this.loadTinderProfiles(false);
          return;
        }
        
        if (!this.tinderProfiles || this.tinderProfiles.length === 0) {
          // Если это форсированная перезагрузка и все еще нет профилей, сбросим пагинацию
          if (forceReload && this.viewedProfiles.size > 0) {
            console.log('[MATCHING] Force reload: resetting pagination and clearing viewed list...');
            this.currentPage = 0;
            this.viewedProfiles.clear();
            this.saveViewedProfiles();
            this.loadTinderProfiles(false);
            return;
          }
          this.showNoProfiles();
        }
      }
    } catch (error) {
      console.error('[MATCHING] Error loading Tinder profiles:', error);
      this.showNoProfiles();
    } finally {
      this.showTinderLoading(false);
    }
  }

  displayCurrentProfile() {
    console.log('[MATCHING] displayCurrentProfile called');
    console.log('[MATCHING] currentProfileIndex:', this.currentProfileIndex);
    console.log('[MATCHING] tinderProfiles.length:', this.tinderProfiles.length);
    
    // Проверяем, есть ли профили для показа
    if (!this.tinderProfiles || this.tinderProfiles.length === 0) {
      console.log('[MATCHING] No profiles array, showing empty state');
      this.showNoProfiles();
      return;
    }
    
    if (this.currentProfileIndex >= this.tinderProfiles.length) {
      console.log('[MATCHING] Index beyond array length, trying to load more profiles...');
      this.loadTinderProfiles(false);
      return;
    }

    const profile = this.tinderProfiles[this.currentProfileIndex];
    console.log('[MATCHING] Displaying profile:', profile);

    // Show card container
    document.getElementById('swipeCardContainer').style.display = 'block';
    document.getElementById('noProfiles').style.display = 'none';

    // Update profile information
    const cardName = document.getElementById('cardName');
    const cardLocation = document.getElementById('cardLocation');
    const cardWork = document.getElementById('cardWork');
    const cardDescription = document.getElementById('cardDescription');
    const cardMainPhoto = document.getElementById('cardMainPhoto');

    if (cardName) {
      const age = profile.age || 'N/A';
      cardName.textContent = `${profile.pseudo || profile.nom_complet || 'Unknown'}, ${age}`;
    }

    if (cardLocation) {
      cardLocation.textContent = `📍 ${profile.ville || profile.region || 'Location unknown'}`;
    }

    if (cardWork) {
      cardWork.textContent = `💼 ${profile.travail || 'Work not specified'}`;
    }

    if (cardDescription) {
      cardDescription.textContent = profile.description || 'No description available';
    }

    if (cardMainPhoto) {
      console.log('[MATCHING] Profile photo data:', {
        photos_v2: profile.photos_v2,
        photos: profile.photos,
        picture_430: profile.picture_430,
        picture: profile.picture
      });
      
      let photoUrl = '/images/default-avatar.png';
      
      // Try different photo field combinations
      if (profile.photos_v2 && profile.photos_v2.public) {
        // Handle photos_v2.public.1.normal structure
        const publicPhotos = profile.photos_v2.public;
        const firstPhotoKey = Object.keys(publicPhotos)[0];
        if (firstPhotoKey && publicPhotos[firstPhotoKey]) {
          photoUrl = publicPhotos[firstPhotoKey].sq_430 || 
                    publicPhotos[firstPhotoKey].normal || 
                    publicPhotos[firstPhotoKey].sq_middle ||
                    publicPhotos[firstPhotoKey].sq_small;
        }
      } else if (profile.photos_v2 && profile.photos_v2.length > 0) {
        photoUrl = profile.photos_v2[0].sq_430 || profile.photos_v2[0].normal;
      } else if (profile.photos && profile.photos.length > 0) {
        photoUrl = profile.photos[0].url_big || profile.photos[0].url_middle;
      } else if (profile.picture_430) {
        photoUrl = profile.picture_430;
      } else if (profile.picture) {
        photoUrl = profile.picture;
      }
      
      console.log('[MATCHING] Selected photo URL:', photoUrl);
      
      // Ensure full URL - but most photos_v2 URLs are already complete
      if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('/images/')) {
        photoUrl = `https://dev2018.de5a7.com/${photoUrl}`;
        console.log('[MATCHING] Fixed photo URL:', photoUrl);
      }
      
      cardMainPhoto.src = photoUrl;
      cardMainPhoto.alt = `${profile.pseudo || 'User'}'s photo`;
    }

    // Update photo indicators if multiple photos
    this.updatePhotoIndicators(profile.photos || []);
  }

  updatePhotoIndicators(photos) {
    const indicators = document.getElementById('photoIndicators');
    if (!indicators) return;

    indicators.innerHTML = '';
    
    if (photos.length > 1) {
      photos.forEach((photo, index) => {
        const indicator = document.createElement('div');
        indicator.className = `photo-indicator ${index === 0 ? 'active' : ''}`;
        indicators.appendChild(indicator);
      });
    }
  }

  async handleTinderAction(action) {
    const profile = this.tinderProfiles[this.currentProfileIndex];
    if (!profile) return;

    const profileId = profile.id || profile.id_membre;
    console.log(`[MATCHING] Handling Tinder action: ${action} for user:`, profileId);

    // Добавляем профиль в просмотренные
    this.viewedProfiles.add(profileId);
    
    // Если лайк, добавляем в лайкнутые
    if (action === 'like' || action === 'superlike') {
      this.likedProfiles.add(profileId);
      this.stats.totalLikes++;
    }
    
    // Сохраняем в localStorage
    this.saveViewedProfiles();

    // Visual feedback
    const card = document.getElementById('swipeCard');
    card.classList.remove('swiping-left', 'swiping-right');
    card.classList.add(action === 'like' || action === 'superlike' ? 'swiping-right' : 'swiping-left');

    // Call API with correct action - use /index_api/match with set_like/set_dislike
    try {
      // Get API config
      const apiConfigResponse = await fetch('/api/get-api-key');
      const apiConfig = await apiConfigResponse.json();
      
      const sessionId = window.authManager?.sessionId || localStorage.getItem('session_id');
      console.log('[MATCHING] Action session ID:', sessionId);
      
      // Используем только /index_api/match для лайков и дизлайков
      let apiAction;
      if (action === 'like' || action === 'superlike') {
        apiAction = 'set_like';
      } else if (action === 'pass') {
        apiAction = 'set_dislike';
      }
      
      if (apiAction) {
        const actionQuery = new URLSearchParams({
          session_id: sessionId || '',
          api_key: apiConfig.apiKey,
          action: apiAction,
          id_user: profileId
        });
        
        const apiUrl = `${apiConfig.baseUrl}/index_api/match?${actionQuery.toString()}`;
        console.log('[MATCHING] Action API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET'
        });
        const data = await response.json();
        
        console.log(`[MATCHING] ${apiAction} response:`, data);
        
        // Проверяем на матч
        if (data.connected === 1 && data.result === 'match') {
          console.log('[MATCHING] IT\'S A MATCH!');
          this.stats.totalMatches++;
          
          // Создаем контакт для обмена сообщениями
          await this.createContactForMatch(profileId);
          
          this.showMatchModal(profile);
        }
      }
    } catch (error) {
      console.error('[MATCHING] Error sending Tinder action:', error);
    }

    // Move to next profile after animation
    setTimeout(() => {
      card.classList.remove('swiping-right', 'swiping-left');
      // Запрашиваем свежий профиль сразу после действия
      this.loadTinderProfiles(true);
      this.updateStats();
    }, 300);
  }

  showMatchModal(profile) {
    const modal = document.getElementById('matchModal');
    const matchedUserName = document.getElementById('matchedUserName');
    const matchedUserNameSmall = document.getElementById('matchedUserNameSmall');
    const matchedUserPhoto = document.getElementById('matchedUserPhoto');
    const myMatchPhoto = document.getElementById('myMatchPhoto');

    if (matchedUserName) {
      matchedUserName.textContent = profile.pseudo || profile.nom_complet || 'Someone';
    }
    if (matchedUserNameSmall) {
      matchedUserNameSmall.textContent = profile.pseudo || profile.nom_complet || 'Match';
    }
        if (matchedUserPhoto) {
      const photoUrl = profile.photos_v2 && profile.photos_v2.length > 0
        ? profile.photos_v2[0].sq_430 || profile.photos_v2[0].normal
        : (profile.photos && profile.photos.length > 0
            ? profile.photos[0].url_big || profile.photos[0].url_middle
            : '/images/default-avatar.png');
      matchedUserPhoto.src = photoUrl;
    }
    if (myMatchPhoto) {
      // Load user's own photo from dashboard data
      const userPhoto = localStorage.getItem('user_photo') || '/images/default-avatar.png';
      myMatchPhoto.src = userPhoto;
    }

    // Store match data for later use
    this.currentMatch = profile;

    modal.style.display = 'flex';

    // Add confetti effect
    this.showConfetti();
  }

  closeMatchModal() {
    document.getElementById('matchModal').style.display = 'none';
  }

  async createContactForMatch(profileId) {
    console.log('[MATCHING] Creating contact for matched user:', profileId);
    
    try {
      const sessionId = window.authManager?.sessionId || localStorage.getItem('session_id');
      
      if (!sessionId) {
        console.error('[MATCHING] No session ID available');
        return false;
      }
      
      // Попробуем несколько действий для создания контакта
      const contactActions = ['add_contact', 'add_friend'];
      
      for (const action of contactActions) {
        try {
          console.log(`[MATCHING] Trying action: ${action}`);
          
          const contactResponse = await fetch('/api/contacts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: action,
              session_id: sessionId,
              user_id: profileId
            })
          });
          
          const result = await contactResponse.json();
          console.log(`[MATCHING] Contact API response (${action}):`, result);
          
          // Проверяем успешность создания контакта
          if (result.success && result.data) {
            // Проверяем различные варианты успешного ответа
            const data = result.data;
            if (data.connected === 1 || data.success === true || !data.error || data.error === 0) {
              console.log('[MATCHING] ✅ Contact created successfully!');
              return true;
            }
          }
          
        } catch (actionError) {
          console.log(`[MATCHING] Action ${action} failed:`, actionError.message);
          continue; // Пробуем следующее действие
        }
      }
      
      console.warn('[MATCHING] ⚠️ Could not create contact with any action');
      
      // Даже если создание контакта не удалось, разрешаем матч
      // Пользователь всё равно сможет попробовать написать сообщение
      return true;
      
    } catch (error) {
      console.error('[MATCHING] Error creating contact:', error);
      // Не блокируем матч из-за ошибки создания контакта
      return true;
    }
  }

  sendMessageToMatch() {
    if (this.currentMatch) {
      console.log('[MATCHING] Opening chat with matched user:', this.currentMatch);
      
      // Redirect to messages with this user
      if (window.dashboard) {
        // Use the openChatWithUser method we just added
        window.dashboard.openChatWithUser(
          this.currentMatch.id, 
          this.currentMatch.pseudo || this.currentMatch.nom_complet
        );
      } else {
        console.error('[MATCHING] Dashboard not available');
      }
    }
    this.closeMatchModal();
  }

  startChatWithMatch() {
    // Same as sendMessageToMatch for now
    this.sendMessageToMatch();
  }

  showNoProfiles() {
    document.getElementById('swipeCardContainer').style.display = 'none';
    const noProfilesEl = document.getElementById('noProfiles');
    noProfilesEl.style.display = 'flex';
    
    // Добавляем кнопку для сброса фильтров, если её еще нет
    if (!noProfilesEl.querySelector('.reset-filters-btn')) {
      const resetBtn = document.createElement('button');
      resetBtn.className = 'reset-filters-btn btn btn-primary mt-3';
      resetBtn.textContent = 'Показать просмотренные профили заново';
      resetBtn.onclick = () => this.resetViewedProfiles();
      noProfilesEl.appendChild(resetBtn);
    }
  }
  
  resetViewedProfiles() {
    // Очищаем просмотренные профили (но оставляем лайкнутые)
    this.viewedProfiles.clear();
    this.saveViewedProfiles();
    console.log('[MATCHING] Reset viewed profiles');
    
    // Перезагружаем профили
    this.loadTinderProfiles();
  }
  
  initializeDragAndDrop() {
    let startX = null;
    let currentX = null;
    let card = null;
    let isDragging = false;
    
    const handleStart = (e) => {
      card = document.getElementById('swipeCard');
      if (!card || card.parentElement.parentElement.style.display === 'none') return;
      
      isDragging = true;
      startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      card.style.transition = 'none';
    };
    
    const handleMove = (e) => {
      if (!isDragging || !card) return;
      
      e.preventDefault();
      currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      const diffX = currentX - startX;
      const rotation = diffX * 0.1;
      
      card.style.transform = `translateX(${diffX}px) rotate(${rotation}deg)`;
      
      // Показываем индикаторы
      if (diffX > 50) {
        card.classList.add('dragging-right');
        card.classList.remove('dragging-left');
      } else if (diffX < -50) {
        card.classList.add('dragging-left');
        card.classList.remove('dragging-right');
      } else {
        card.classList.remove('dragging-right', 'dragging-left');
      }
    };
    
    const handleEnd = (e) => {
      if (!isDragging || !card) return;
      
      isDragging = false;
      const diffX = currentX - startX;
      card.style.transition = '';
      
      // Определяем действие
      if (Math.abs(diffX) > 100) {
        if (diffX > 0) {
          this.handleTinderAction('like');
        } else {
          this.handleTinderAction('dislike');
        }
      } else {
        // Возвращаем карточку на место
        card.style.transform = '';
        card.classList.remove('dragging-right', 'dragging-left');
      }
    };
    
    // Mouse events
    document.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    
    // Touch events
    document.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }

  showTinderLoading(show) {
    document.getElementById('tinderLoading').style.display = show ? 'flex' : 'none';
  }

  // =====================================
  // SECRET GARDEN
  // =====================================

  async loadSecretGarden() {
    console.log('[MATCHING] Loading Secret Garden...');
    // Default to flash mode
    this.switchGardenMode('flash');
  }

  async loadFlashProfiles() {
    console.log('[MATCHING] Loading flash profiles...');
    this.showFlashLoading(true);

    try {
      const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/secretgarden&method=POST&session_id=${localStorage.getItem('session_id')}&api_key=${encodeURIComponent(localStorage.getItem('api_key') || '')}`);
      const data = await response.json();

      console.log('[MATCHING] Flash profiles response:', data);

      if (data.success && data.data && data.data.result) {
        this.flashProfiles = data.data.result;
        this.displayFlashProfiles();
      } else {
        this.showNoFlashProfiles();
      }
    } catch (error) {
      console.error('[MATCHING] Error loading flash profiles:', error);
      this.showNoFlashProfiles();
    } finally {
      this.showFlashLoading(false);
    }
  }

  displayFlashProfiles() {
    const container = document.getElementById('flashCards');
    if (!container) return;

    container.innerHTML = '';
    container.style.display = 'grid';

    this.flashProfiles.forEach(profile => {
      const card = this.createFlashCard(profile);
      container.appendChild(card);
    });
  }

  createFlashCard(profile) {
    const card = document.createElement('div');
    card.className = 'flash-card';
    card.dataset.userId = profile.id;

    const photoUrl = profile.photos_v2 && profile.photos_v2.length > 0
        ? profile.photos_v2[0].sq_430 || profile.photos_v2[0].normal
        : (profile.photos && profile.photos.length > 0
            ? profile.photos[0].url_big || profile.photos[0].url_middle
            : '/images/default-avatar.png');

    const age = profile.age || 'N/A';
    const name = profile.pseudo || profile.nom_complet || 'Unknown';
    const location = profile.ville || profile.region || 'Unknown';

    card.innerHTML = `
      <div class="flash-card-photo">
        <img src="${photoUrl}" alt="${name}'s photo">
      </div>
      <div class="flash-card-info">
        <h4>${name}, ${age}</h4>
        <p>📍 ${location}</p>
        <p>${profile.description || 'No description'}</p>
      </div>
      <div class="flash-card-actions">
        <button class="flash-btn flash-pass" data-action="pass">
          ❌ Pass
        </button>
        <button class="flash-btn flash-like" data-action="flash">
          🌹 Flash
        </button>
      </div>
    `;

    // Add event listeners
    card.querySelector('.flash-btn.flash-like').addEventListener('click', () => {
      this.handleFlashAction(profile.id, 1);
    });

    card.querySelector('.flash-btn.flash-pass').addEventListener('click', () => {
      this.handleFlashAction(profile.id, 0);
    });

    return card;
  }

  async handleFlashAction(userId, isGood) {
    console.log(`[MATCHING] Flashing user ${userId} with action: ${isGood}`);

    try {
      const response = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/setFlash&method=GET&target_id=${userId}&is_good=${isGood}&session_id=${localStorage.getItem('session_id')}&api_key=${encodeURIComponent(localStorage.getItem('api_key') || '')}`);
      const data = await response.json();

      console.log('[MATCHING] Flash action response:', data);

      // Remove the card with animation
      const card = document.querySelector(`[data-user-id="${userId}"]`);
      if (card) {
        card.style.transform = 'scale(0.8)';
        card.style.opacity = '0.5';
        setTimeout(() => {
          card.remove();
        }, 300);
      }

      if (isGood) {
        this.showNotification('🌹 Flash sent!', 'success');
      }
    } catch (error) {
      console.error('[MATCHING] Error sending flash:', error);
      this.showNotification('Failed to send flash', 'error');
    }
  }

  async loadGuessingGame() {
    console.log('[MATCHING] Loading guessing game...');
    this.showGuessLoading(true);

    try {
      const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/secretgarden/get/game&method=POST&session_id=${localStorage.getItem('session_id')}&api_key=${encodeURIComponent(localStorage.getItem('api_key') || '')}`);
      const data = await response.json();

      console.log('[MATCHING] Guessing game response:', data);

      if (data.success && data.data && data.data.result && data.data.result.length > 0) {
        this.guessProfiles = data.data.result;
        this.displayGuessingGrid();
      } else {
        this.showNoFlashes();
      }
    } catch (error) {
      console.error('[MATCHING] Error loading guessing game:', error);
      this.showNoFlashes();
    } finally {
      this.showGuessLoading(false);
    }
  }

  displayGuessingGrid() {
    const grid = document.getElementById('candidatesGrid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.style.display = 'grid';

    this.guessProfiles.forEach(profile => {
      const candidate = this.createCandidateOption(profile);
      grid.appendChild(candidate);
    });

    document.getElementById('noFlashes').style.display = 'none';
  }

  createCandidateOption(profile) {
    const option = document.createElement('div');
    option.className = 'candidate-option';
    option.dataset.userId = profile.id;

    const photoUrl = profile.photos_v2 && profile.photos_v2.length > 0
        ? profile.photos_v2[0].sq_430 || profile.photos_v2[0].normal
        : (profile.photos && profile.photos.length > 0
            ? profile.photos[0].url_big || profile.photos[0].url_middle
            : '/images/default-avatar.png');

    const age = profile.age || 'N/A';
    const name = profile.pseudo || profile.nom_complet || 'Unknown';

    option.innerHTML = `
      <div class="candidate-photo">
        <img src="${photoUrl}" alt="${name}'s photo">
      </div>
      <div class="candidate-info">
        <h4>${name}, ${age}</h4>
        <p>Click to guess</p>
      </div>
    `;

    option.addEventListener('click', () => {
      this.handleGuess(profile);
    });

    return option;
  }

  async handleGuess(profile) {
    console.log('[MATCHING] Guessing user:', profile.id);

    // Visual feedback
    document.querySelectorAll('.candidate-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    document.querySelector(`[data-user-id="${profile.id}"]`).classList.add('selected');

    try {
      const response = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/setDeviner&method=GET&id=${profile.id}&session_id=${localStorage.getItem('session_id')}&api_key=${encodeURIComponent(localStorage.getItem('api_key') || '')}`);
      const data = await response.json();

      console.log('[MATCHING] Guess response:', data);

      // Show result after a short delay
      setTimeout(() => {
        if (data.success) {
          this.showGardenMatchModal(profile);
        } else {
          this.showNotification('Wrong guess! Try again.', 'error');
          document.querySelector(`[data-user-id="${profile.id}"]`).classList.remove('selected');
        }
      }, 1000);
    } catch (error) {
      console.error('[MATCHING] Error submitting guess:', error);
      this.showNotification('Failed to submit guess', 'error');
    }
  }

  showGardenMatchModal(profile) {
    const modal = document.getElementById('gardenMatchModal');
    const secretMatchUserName = document.getElementById('secretMatchUserName');
    const secretMatchUserInfo = document.getElementById('secretMatchUserInfo');
    const secretMatchUserLocation = document.getElementById('secretMatchUserLocation');
    const secretMatchUserPhoto = document.getElementById('secretMatchUserPhoto');

    const name = profile.pseudo || profile.nom_complet || 'Someone';
    const age = profile.age || 'N/A';
    const location = profile.ville || profile.region || 'Unknown';

    if (secretMatchUserName) {
      secretMatchUserName.textContent = name;
    }
    if (secretMatchUserInfo) {
      secretMatchUserInfo.textContent = `${name}, ${age}`;
    }
    if (secretMatchUserLocation) {
      secretMatchUserLocation.textContent = `📍 ${location}`;
    }
    if (secretMatchUserPhoto) {
      const photoUrl = profile.photos_v2 && profile.photos_v2.length > 0
        ? profile.photos_v2[0].sq_430 || profile.photos_v2[0].normal
        : (profile.photos && profile.photos.length > 0
            ? profile.photos[0].url_big || profile.photos[0].url_middle
            : '/images/default-avatar.png');
      secretMatchUserPhoto.src = photoUrl;
    }

    this.currentSecretMatch = profile;
    modal.style.display = 'flex';

    // Add celebration effect
    this.showConfetti();
  }

  closeGardenMatchModal() {
    document.getElementById('gardenMatchModal').style.display = 'none';
    // Reload the guessing game to get new candidates
    this.loadGuessingGame();
  }

  startChatWithMatch() {
    if (this.currentSecretMatch) {
      // Redirect to messages with this user
      if (window.dashboard) {
        window.dashboard.switchSection('messages');
      }
    }
    this.closeGardenMatchModal();
  }

  async loadGardenResults() {
    console.log('[MATCHING] Loading garden results...');
    // Load both my flashes and found matches
    await this.loadMyFlashes();
    await this.loadFoundMatches();
  }

  async loadMyFlashes() {
    try {
      const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/secretgarden/get/my_flashs&method=POST&session_id=${localStorage.getItem('session_id')}&api_key=${encodeURIComponent(localStorage.getItem('api_key') || '')}`);
      const data = await response.json();

      console.log('[MATCHING] My flashes response:', data);
      // Handle the results display
    } catch (error) {
      console.error('[MATCHING] Error loading my flashes:', error);
    }
  }

  async loadFoundMatches() {
    try {
      const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/secretgarden/get/finded&method=POST&session_id=${localStorage.getItem('session_id')}&api_key=${encodeURIComponent(localStorage.getItem('api_key') || '')}`);
      const data = await response.json();

      console.log('[MATCHING] Found matches response:', data);
      // Handle the results display
    } catch (error) {
      console.error('[MATCHING] Error loading found matches:', error);
    }
  }

  // =====================================
  // MY MATCHES
  // =====================================

  async loadMyMatches() {
    console.log('[MATCHING] Loading my matches...');
    this.showMatchesLoading(true);

    try {
      // Get API config
      const apiConfigResponse = await fetch('/api/get-api-key');
      const apiConfig = await apiConfigResponse.json();
      
      const sessionId = window.authManager?.sessionId || localStorage.getItem('session_id');
      console.log('[MATCHING] Using session ID for matches:', sessionId);
      
      const matchesQuery = new URLSearchParams({
        session_id: sessionId || '',
        api_key: apiConfig.apiKey,
        action: 'get_matches'
      });

      console.log('[MATCHING] My matches API URL:', `${apiConfig.baseUrl}/index_api/match?${matchesQuery.toString()}`);

      const response = await fetch(`${apiConfig.baseUrl}/index_api/match?${matchesQuery.toString()}`, {
        method: 'GET'
      });
      const data = await response.json();
      


      console.log('[MATCHING] My matches response:', data);
      console.log('[MATCHING] Response connected:', data.connected);
      console.log('[MATCHING] Response result:', data.result);
      console.log('[MATCHING] Response error:', data.error);

      // Handle new API format: {connected: 1, result: {nb_total: X, tab_profils: [...]}}
      if (data.connected === 1 && data.result) {
        if (data.result.tab_profils && Array.isArray(data.result.tab_profils) && data.result.tab_profils.length > 0) {
          this.myMatches = data.result.tab_profils;
          console.log('[MATCHING] Found matches in tab_profils:', this.myMatches.length);
          this.displayMatches();
        } else if (Array.isArray(data.result) && data.result.length > 0) {
          // Fallback if result is directly an array
          this.myMatches = data.result;
          console.log('[MATCHING] Found matches in result array:', this.myMatches.length);
          this.displayMatches();
        } else {
          console.log('[MATCHING] No matches found - nb_total:', data.result.nb_total);
          console.log('[MATCHING] tab_profils:', data.result.tab_profils);
          this.showNoMatches();
        }
      } else if (data.success && data.data && data.data.result && data.data.result.length > 0) {
        // Fallback for old format
        this.myMatches = data.data.result;
        this.displayMatches();
      } else {
        console.log('[MATCHING] No matches found - result:', data.result);
        this.showNoMatches();
      }
    } catch (error) {
      console.error('[MATCHING] Error loading matches:', error);
      this.showNoMatches();
    } finally {
      this.showMatchesLoading(false);
    }
  }

  displayMatches() {
    const grid = document.getElementById('matchesGrid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.style.display = 'grid';

    this.myMatches.forEach(match => {
      const card = this.createMatchCard(match);
      grid.appendChild(card);
    });

    document.getElementById('noMatches').style.display = 'none';
  }

  createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.dataset.userId = match.id;

    const photoUrl = match.photos_v2 && match.photos_v2.length > 0
      ? match.photos_v2[0].sq_430 || match.photos_v2[0].normal
      : (match.photos && match.photos.length > 0
          ? match.photos[0].url_big || match.photos[0].url_middle
          : match.photo_profil || '/images/default-avatar.png');

    const age = match.age || 'N/A';
    const name = match.pseudo || match.nom_complet || 'Unknown';
    const location = match.ville || match.region || 'Unknown';

    card.innerHTML = `
      <div class="match-card-photo">
        <img src="${photoUrl}" alt="${name}'s photo">
        <div class="match-badge">MATCH</div>
      </div>
      <div class="match-card-info">
        <h4>${name}, ${age}</h4>
        <p>📍 ${location}</p>
        <p>${match.description || 'No description'}</p>
      </div>
      <div class="match-card-actions">
        <button class="match-action-btn view-profile">
          👤 View Profile
        </button>
        <button class="match-action-btn message">
          💬 Message
        </button>
      </div>
    `;

    // Add event listeners
    card.querySelector('.match-action-btn.message').addEventListener('click', () => {
      this.openChatWithMatch(match);
    });

    card.querySelector('.match-action-btn.view-profile').addEventListener('click', () => {
      this.viewMatchProfile(match);
    });

    return card;
  }

  openChatWithMatch(match) {
    if (window.dashboard) {
      window.dashboard.switchSection('messages');
      // Could pre-select this match in the messages interface
    }
  }

  viewMatchProfile(match) {
    // Could open a profile modal or navigate to profile view
    console.log('[MATCHING] Viewing profile of:', match);
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  async loadUserStats() {
    // This could load from API or localStorage
    const savedStats = localStorage.getItem('matching_stats');
    if (savedStats) {
      this.stats = JSON.parse(savedStats);
    }
  }
  
  loadViewedProfiles() {
    // Загружаем просмотренные профили из localStorage
    const viewedData = localStorage.getItem('viewed_profiles');
    if (viewedData) {
      this.viewedProfiles = new Set(JSON.parse(viewedData));
    }
    
    const likedData = localStorage.getItem('liked_profiles');
    if (likedData) {
      this.likedProfiles = new Set(JSON.parse(likedData));
    }
    
    console.log(`[MATCHING] Loaded ${this.viewedProfiles.size} viewed profiles and ${this.likedProfiles.size} liked profiles`);
  }
  
  saveViewedProfiles() {
    localStorage.setItem('viewed_profiles', JSON.stringify(Array.from(this.viewedProfiles)));
    localStorage.setItem('liked_profiles', JSON.stringify(Array.from(this.likedProfiles)));
  }

  updateStats() {
    // Update UI elements
    const totalLikesEl = document.getElementById('totalLikes');
    const totalMatchesEl = document.getElementById('totalMatches');

    if (totalLikesEl) totalLikesEl.textContent = this.stats.totalLikes;
    if (totalMatchesEl) totalMatchesEl.textContent = this.stats.totalMatches;

    // Save to localStorage
    localStorage.setItem('matching_stats', JSON.stringify(this.stats));
  }

  showFlashLoading(show) {
    document.getElementById('flashLoading').style.display = show ? 'flex' : 'none';
  }

  showGuessLoading(show) {
    document.getElementById('guessLoading').style.display = show ? 'flex' : 'none';
  }

  showMatchesLoading(show) {
    document.getElementById('matchesLoading').style.display = show ? 'flex' : 'none';
  }

  showNoFlashProfiles() {
    document.getElementById('flashCards').style.display = 'none';
    // Could show a message about no profiles to flash
  }

  showNoFlashes() {
    document.getElementById('candidatesGrid').style.display = 'none';
    document.getElementById('noFlashes').style.display = 'flex';
  }

  showNoMatches() {
    document.getElementById('matchesGrid').style.display = 'none';
    document.getElementById('noMatches').style.display = 'flex';
  }

  showNotification(message, type = 'info') {
    // Use the existing dashboard notification system
    if (window.dashboard && window.dashboard.showNotification) {
      window.dashboard.showNotification(message, type);
    } else {
      console.log(`[MATCHING] ${type.toUpperCase()}: ${message}`);
    }
  }

  showConfetti() {
    // Simple confetti effect using emojis
    const confettiColors = ['🎉', '🎊', '💕', '❤️', '🌟', '✨'];
    const container = document.body;

    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement('div');
      confetti.textContent = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      confetti.style.position = 'fixed';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.top = '-10px';
      confetti.style.fontSize = '24px';
      confetti.style.zIndex = '10001';
      confetti.style.pointerEvents = 'none';
      confetti.style.animation = `confettiFall ${2 + Math.random() * 3}s linear`;

      container.appendChild(confetti);

      // Remove after animation
      setTimeout(() => {
        confetti.remove();
      }, 5000);
    }

    // Add confetti animation CSS if not already present
    if (!document.getElementById('confetti-styles')) {
      const style = document.createElement('style');
      style.id = 'confetti-styles';
      style.textContent = `
        @keyframes confettiFall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  openFilters() {
    // Could open a filters modal
    console.log('[MATCHING] Opening filters...');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit to ensure other scripts are loaded
  setTimeout(() => {
    if (document.getElementById('matches-section')) {
      window.matchingSystem = new MatchingSystem();
      console.log('[MATCHING] Matching system initialized');
    }
  }, 500);
});