// Новая система матчинга v2 с Search API и базой данных Neon
// Использует пагинацию для избежания повторов и сохраняет прогресс в БД

class MatchingSystemV2 {
  constructor() {
    // Конфигурация
    this.profilesPerPage = 30; // Количество профилей на страницу
    this.preloadThreshold = 5; // Когда остается 5 профилей, загружаем следующую страницу
    this.maxRetries = 3;
    
    // Состояние
    this.currentMode = 'tinder'; // tinder, secret-garden, my-matches
    this.tinderProfiles = []; // Буфер загруженных профилей
    this.currentProfileIndex = 0; // Текущий индекс в буфере
    this.currentPage = 0; // Текущая страница в Search API
    this.isLoadingProfiles = false;
    this.hasMoreProfiles = true;
    
    // Статистика
    this.stats = {
      totalLikes: 0,
      totalMatches: 0,
      totalProfilesViewed: 0
    };
    
    // База данных
    this.userId = null;
    this.sessionId = null;
    
    this.init();
  }

  async init() {
    console.log('[MATCHING-V2] Initializing new matching system...');
    
    // Получаем данные пользователя
    this.userId = window.authManager?.userId || localStorage.getItem('user_id');
    this.sessionId = window.authManager?.sessionId || localStorage.getItem('session_id');
    
    if (!this.userId || !this.sessionId) {
      console.error('[MATCHING-V2] No user ID or session ID found');
      return;
    }
    
    console.log('[MATCHING-V2] User ID:', this.userId, 'Session ID:', this.sessionId);
    
    // Инициализируем базу данных
    await this.initDatabase();
    
    // Загружаем прогресс пользователя
    await this.loadUserProgress();
    
    // Настраиваем обработчики событий
    this.setupEventListeners();
    
    // Загружаем начальные данные
    await this.loadInitialData();
    
    // Обновляем статистику
    this.updateStats();
  }

  async initDatabase() {
    try {
      console.log('[MATCHING-V2] Initializing database...');
      const response = await fetch('/api/db-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('[MATCHING-V2] Database initialized successfully');
      } else {
        console.error('[MATCHING-V2] Database initialization failed:', result.error);
      }
    } catch (error) {
      console.error('[MATCHING-V2] Database initialization error:', error);
    }
  }

  async loadUserProgress() {
    try {
      console.log('[MATCHING-V2] Loading user progress...');
      const response = await fetch(`/api/user-progress?user_id=${this.userId}&session_id=${this.sessionId}`);
      const result = await response.json();
      
      if (result.success) {
        const progress = result.data;
        this.currentPage = progress.current_page || 0;
        this.profilesPerPage = progress.profiles_per_page || 30;
        this.currentProfileIndex = progress.last_profile_index || 0;
        
        console.log('[MATCHING-V2] Progress loaded:', {
          currentPage: this.currentPage,
          profilesPerPage: this.profilesPerPage,
          lastProfileIndex: this.currentProfileIndex,
          isNew: result.is_new
        });
      }
    } catch (error) {
      console.error('[MATCHING-V2] Error loading user progress:', error);
    }
  }

  async saveUserProgress() {
    try {
      const response = await fetch('/api/user-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userId,
          session_id: this.sessionId,
          current_page: this.currentPage,
          profiles_per_page: this.profilesPerPage,
          last_profile_index: this.currentProfileIndex
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('[MATCHING-V2] Progress saved successfully');
      }
    } catch (error) {
      console.error('[MATCHING-V2] Error saving progress:', error);
    }
  }

  setupEventListeners() {
    // Mode switching
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.switchMode(mode);
      });
    });

    // Tinder controls
    const likeBtn = document.getElementById('tinderLikeBtn');
    const dislikeBtn = document.getElementById('tinderDislikeBtn');
    
    if (likeBtn) likeBtn.addEventListener('click', () => this.handleLike());
    if (dislikeBtn) dislikeBtn.addEventListener('click', () => this.handleDislike());

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (this.currentMode === 'tinder') {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
          this.handleDislike();
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
          this.handleLike();
        }
      }
    });
  }

  async loadInitialData() {
    console.log('[MATCHING-V2] Loading initial data...');
    await this.loadTinderProfiles();
  }

  async loadTinderProfiles(forceReload = false) {
    if (this.isLoadingProfiles && !forceReload) {
      console.log('[MATCHING-V2] Already loading profiles, skipping...');
      return;
    }

    if (!this.hasMoreProfiles && !forceReload) {
      console.log('[MATCHING-V2] No more profiles available');
      return;
    }

    this.isLoadingProfiles = true;
    console.log(`[MATCHING-V2] Loading profiles from page ${this.currentPage}...`);
    this.showTinderLoading(true);

    try {
      // Используем Search API через наш proxy
      const searchParams = new URLSearchParams({
        endpoint: '/index_api/search',
        method: 'POST',
        session_id: this.sessionId,
        page: this.currentPage.toString(),
        pas: this.profilesPerPage.toString()
      });

      const response = await fetch(`/api/spice-multi-test?${searchParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('[MATCHING-V2] Search API response:', data);

      let profiles = [];
      
      // Обрабатываем ответ Search API
      if (data.success && data.data) {
        if (data.data.result && Array.isArray(data.data.result)) {
          profiles = data.data.result;
        } else if (data.data.membres && Array.isArray(data.data.membres)) {
          profiles = data.data.membres;
        } else if (Array.isArray(data.data)) {
          profiles = data.data;
        }
      }

      console.log(`[MATCHING-V2] Loaded ${profiles.length} profiles from page ${this.currentPage}`);

      if (profiles.length === 0) {
        this.hasMoreProfiles = false;
        console.log('[MATCHING-V2] No more profiles available');
        
        if (this.tinderProfiles.length === 0) {
          this.showNoProfiles();
        }
        return;
      }

      // Фильтруем уже просмотренные профили
      const viewedProfiles = await this.getViewedProfiles();
      const viewedIds = new Set(viewedProfiles.map(v => v.profile_id));
      
      const newProfiles = profiles.filter(profile => {
        const profileId = profile.id || profile.id_membre;
        return !viewedIds.has(profileId);
      });

      console.log(`[MATCHING-V2] After filtering: ${newProfiles.length} new profiles (${profiles.length - newProfiles.length} already viewed)`);

      if (newProfiles.length > 0) {
        // Добавляем новые профили к буферу
        this.tinderProfiles.push(...newProfiles);
        console.log(`[MATCHING-V2] Buffer now contains ${this.tinderProfiles.length} profiles`);
        
        // Если это первая загрузка, показываем профиль
        if (this.currentProfileIndex === 0 && this.tinderProfiles.length > 0) {
          this.displayCurrentProfile();
        }
      }

      // Увеличиваем номер страницы для следующей загрузки
      this.currentPage++;
      await this.saveUserProgress();

    } catch (error) {
      console.error('[MATCHING-V2] Error loading profiles:', error);
      this.showNoProfiles();
    } finally {
      this.showTinderLoading(false);
      this.isLoadingProfiles = false;
    }
  }

  async getViewedProfiles() {
    try {
      const response = await fetch(`/api/viewed-profiles?user_id=${this.userId}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('[MATCHING-V2] Error getting viewed profiles:', error);
      return [];
    }
  }

  async markProfileAsViewed(profileId, action = 'viewed') {
    try {
      await fetch('/api/viewed-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userId,
          profile_id: profileId,
          action: action
        })
      });
    } catch (error) {
      console.error('[MATCHING-V2] Error marking profile as viewed:', error);
    }
  }

  async saveMatch(profileData) {
    try {
      const profileId = profileData.id || profileData.id_membre;
      const profileName = profileData.pseudo || profileData.nom_complet || 'Unknown';
      const profileAge = profileData.age || null;
      const profileCity = profileData.ville || profileData.region || null;
      
      // Собираем URLs фотографий
      const photos = [];
      if (profileData.photos_v2 && Array.isArray(profileData.photos_v2)) {
        profileData.photos_v2.forEach(photo => {
          if (photo.normal) photos.push(photo.normal);
        });
      }

      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userId,
          matched_user_id: profileId,
          matched_user_name: profileName,
          matched_user_age: profileAge,
          matched_user_city: profileCity,
          matched_user_photos: photos
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('[MATCHING-V2] Match saved successfully:', result.data);
        this.stats.totalMatches++;
        this.updateStats();
      }
    } catch (error) {
      console.error('[MATCHING-V2] Error saving match:', error);
    }
  }

  async handleLike() {
    const currentProfile = this.getCurrentProfile();
    if (!currentProfile) return;

    const profileId = currentProfile.id || currentProfile.id_membre;
    console.log('[MATCHING-V2] Liking profile:', profileId);

    // Отмечаем как лайкнутый в базе данных
    await this.markProfileAsViewed(profileId, 'like');

    // Отправляем лайк через Match API
    try {
      const apiConfigResponse = await fetch('/api/get-api-key');
      const apiConfig = await apiConfigResponse.json();
      
      const params = new URLSearchParams({
        api_key: apiConfig.apiKey,
        session_id: this.sessionId,
        action: 'set_like',
        id_user: profileId
      });

      const response = await fetch(`${apiConfig.baseUrl}/index_api/match?${params.toString()}`, {
        method: 'GET'
      });

      const data = await response.json();
      console.log('[MATCHING-V2] Like response:', data);

      // Проверяем на матч
      if (data.result === 'match') {
        console.log('🎉 IT\'S A MATCH!');
        await this.saveMatch(currentProfile);
        this.showMatchModal(currentProfile);
      }

    } catch (error) {
      console.error('[MATCHING-V2] Error sending like:', error);
    }

    this.stats.totalLikes++;
    this.stats.totalProfilesViewed++;
    this.updateStats();
    
    // Переходим к следующему профилю
    this.nextProfile();
  }

  async handleDislike() {
    const currentProfile = this.getCurrentProfile();
    if (!currentProfile) return;

    const profileId = currentProfile.id || currentProfile.id_membre;
    console.log('[MATCHING-V2] Disliking profile:', profileId);

    // Отмечаем как дизлайкнутый в базе данных
    await this.markProfileAsViewed(profileId, 'dislike');

    // Отправляем дизлайк через Match API
    try {
      const apiConfigResponse = await fetch('/api/get-api-key');
      const apiConfig = await apiConfigResponse.json();
      
      const params = new URLSearchParams({
        api_key: apiConfig.apiKey,
        session_id: this.sessionId,
        action: 'set_dislike',
        id_user: profileId
      });

      await fetch(`${apiConfig.baseUrl}/index_api/match?${params.toString()}`, {
        method: 'GET'
      });

    } catch (error) {
      console.error('[MATCHING-V2] Error sending dislike:', error);
    }

    this.stats.totalProfilesViewed++;
    this.updateStats();
    
    // Переходим к следующему профилю
    this.nextProfile();
  }

  nextProfile() {
    this.currentProfileIndex++;
    
    // Проверяем, нужно ли загрузить больше профилей
    const remainingProfiles = this.tinderProfiles.length - this.currentProfileIndex;
    if (remainingProfiles <= this.preloadThreshold && this.hasMoreProfiles && !this.isLoadingProfiles) {
      console.log(`[MATCHING-V2] ${remainingProfiles} profiles remaining, loading more...`);
      this.loadTinderProfiles();
    }

    // Сохраняем прогресс
    this.saveUserProgress();

    // Показываем следующий профиль
    this.displayCurrentProfile();
  }

  getCurrentProfile() {
    return this.tinderProfiles[this.currentProfileIndex] || null;
  }

  displayCurrentProfile() {
    const profile = this.getCurrentProfile();
    
    if (!profile) {
      if (!this.hasMoreProfiles) {
        this.showNoProfiles();
      }
      return;
    }

    // Отображаем профиль в UI
    this.renderTinderProfile(profile);
    
    // Обновляем счетчик профилей
    const remainingCount = this.tinderProfiles.length - this.currentProfileIndex;
    this.updateProfileCounter(this.currentProfileIndex + 1, remainingCount);
  }

  renderTinderProfile(profile) {
    const container = document.getElementById('tinderProfileContainer');
    if (!container) return;

    const profileId = profile.id || profile.id_membre;
    const pseudo = profile.pseudo || profile.nom_complet || 'Unknown';
    const age = profile.age || 'N/A';
    const ville = profile.ville || profile.region || 'Unknown';
    
    // Получаем фотографии
    let photoUrl = '/images/default-avatar.png';
    if (profile.photos_v2 && profile.photos_v2.length > 0) {
      const mainPhoto = profile.photos_v2.find(p => p.main_photo === '1') || profile.photos_v2[0];
      if (mainPhoto && mainPhoto.normal) {
        photoUrl = mainPhoto.normal;
      }
    }

    container.innerHTML = `
      <div class="tinder-card" id="tinderCard">
        <div class="profile-image">
          <img src="${photoUrl}" alt="${pseudo}" onerror="this.src='/images/default-avatar.png'">
          <div class="profile-overlay">
            <div class="profile-info">
              <h3>${pseudo}, ${age}</h3>
              <p><i class="fas fa-map-marker-alt"></i> ${ville}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showMatchModal(profile) {
    // Создаем и показываем модальное окно матча
    const modal = document.createElement('div');
    modal.className = 'match-modal';
    modal.innerHTML = `
      <div class="match-content">
        <h2>🎉 It's a Match!</h2>
        <div class="match-profiles">
          <div class="match-profile">
            <img src="${this.getUserPhoto()}" alt="You">
            <p>You</p>
          </div>
          <div class="match-heart">❤️</div>
          <div class="match-profile">
            <img src="${this.getProfilePhoto(profile)}" alt="${profile.pseudo}">
            <p>${profile.pseudo}</p>
          </div>
        </div>
        <div class="match-actions">
          <button onclick="this.closest('.match-modal').remove()">Continue Swiping</button>
          <button onclick="this.sendMessage('${profile.id || profile.id_membre}')">Send Message</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Убираем модал через 5 секунд
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 5000);
  }

  getUserPhoto() {
    // Возвращаем фото текущего пользователя или дефолтное
    return '/images/default-avatar.png';
  }

  getProfilePhoto(profile) {
    if (profile.photos_v2 && profile.photos_v2.length > 0) {
      const mainPhoto = profile.photos_v2.find(p => p.main_photo === '1') || profile.photos_v2[0];
      if (mainPhoto && mainPhoto.normal) {
        return mainPhoto.normal;
      }
    }
    return '/images/default-avatar.png';
  }

  showTinderLoading(show) {
    const loader = document.getElementById('tinderLoading');
    if (loader) {
      loader.style.display = show ? 'block' : 'none';
    }
  }

  showNoProfiles() {
    const container = document.getElementById('tinderProfileContainer');
    if (container) {
      container.innerHTML = `
        <div class="no-profiles">
          <h3>No more profiles</h3>
          <p>You've seen all available profiles. Check back later for new members!</p>
          <button onclick="window.matchingSystem.resetProgress()" class="btn btn-primary">
            Start Over
          </button>
        </div>
      `;
    }
  }

  async resetProgress() {
    // Очищаем просмотренные профили и начинаем сначала
    try {
      await fetch('/api/viewed-profiles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userId
        })
      });

      // Сбрасываем состояние
      this.currentPage = 0;
      this.currentProfileIndex = 0;
      this.tinderProfiles = [];
      this.hasMoreProfiles = true;
      
      // Сохраняем прогресс и перезагружаем
      await this.saveUserProgress();
      await this.loadTinderProfiles(true);
      
    } catch (error) {
      console.error('[MATCHING-V2] Error resetting progress:', error);
    }
  }

  updateProfileCounter(current, remaining) {
    const counter = document.getElementById('profileCounter');
    if (counter) {
      counter.textContent = `Profile ${current} (${remaining} remaining)`;
    }
  }

  updateStats() {
    // Обновляем статистику в UI
    const statsElements = {
      'totalLikes': this.stats.totalLikes,
      'totalMatches': this.stats.totalMatches,
      'totalProfilesViewed': this.stats.totalProfilesViewed
    };

    Object.entries(statsElements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
  }

  switchMode(mode) {
    console.log('[MATCHING-V2] Switching to mode:', mode);
    this.currentMode = mode;
    
    // Обновляем активные табы
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // Показываем соответствующий контент
    document.querySelectorAll('.mode-content').forEach(content => {
      content.style.display = content.id === `${mode}Content` ? 'block' : 'none';
    });

    // Загружаем данные для режима
    if (mode === 'my-matches') {
      this.loadMyMatches();
    }
  }

  async loadMyMatches() {
    try {
      const response = await fetch(`/api/matches?user_id=${this.userId}&limit=50`);
      const result = await response.json();
      
      if (result.success) {
        this.displayMyMatches(result.data);
      }
    } catch (error) {
      console.error('[MATCHING-V2] Error loading matches:', error);
    }
  }

  displayMyMatches(matches) {
    const container = document.getElementById('myMatchesContainer');
    if (!container) return;

    if (matches.length === 0) {
      container.innerHTML = '<p>No matches yet. Keep swiping!</p>';
      return;
    }

    const matchesHTML = matches.map(match => {
      const photos = JSON.parse(match.matched_user_photos || '[]');
      const photoUrl = photos.length > 0 ? photos[0] : '/images/default-avatar.png';
      
      return `
        <div class="match-item ${!match.is_read ? 'unread' : ''}" data-user-id="${match.matched_user_id}">
          <img src="${photoUrl}" alt="${match.matched_user_name}" class="match-photo">
          <div class="match-info">
            <h4>${match.matched_user_name}</h4>
            <p>${match.matched_user_age ? `${match.matched_user_age} years old` : ''}</p>
            <p>${match.matched_user_city || ''}</p>
            <small>${new Date(match.match_date).toLocaleDateString()}</small>
          </div>
          <button onclick="window.matchingSystem.openChatWithMatch('${match.matched_user_id}', '${match.matched_user_name}')" 
                  class="btn btn-primary btn-sm">
            Message
          </button>
        </div>
      `;
    }).join('');

    container.innerHTML = matchesHTML;
  }

  async openChatWithMatch(userId, userName) {
    // Отмечаем матч как прочитанный
    await fetch('/api/matches', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: this.userId,
        matched_user_id: userId,
        is_read: true
      })
    });

    // Открываем чат через dashboard
    if (window.dashboard && window.dashboard.openChatWithUser) {
      window.dashboard.openChatWithUser(userId, userName);
    }
  }
}

// Глобальная переменная для доступа из HTML
window.MatchingSystemV2 = MatchingSystemV2;

// Инициализируем новую систему матчинга при загрузке
document.addEventListener('DOMContentLoaded', () => {
  // Ждем инициализации authManager
  const initMatching = () => {
    if (window.authManager && window.authManager.isAuthenticated()) {
      console.log('[MATCHING-V2] Initializing new matching system...');
      window.matchingSystem = new MatchingSystemV2();
    } else {
      // Если authManager еще не готов, ждем немного
      setTimeout(initMatching, 500);
    }
  };
  
  initMatching();
});