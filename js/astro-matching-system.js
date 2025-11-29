/**
 * AstroDate Matching System
 * 
 * Интеграция астрологического движка с системой матчинга
 * Загружает профили, рассчитывает астро-совместимость и сортирует
 */

class AstroMatchingSystem {
  constructor() {
    this.currentUserBirthDate = null;
    this.compatibilityCache = new Map();
    this.sortedProfiles = [];
    this.currentIndex = 0;
    this.isLoading = false;
    
    this.init();
  }

  async init() {
    console.log('[ASTRO-MATCHING] Initializing AstroDate matching system...');
    
    // Загружаем дату рождения текущего пользователя
    await this.loadCurrentUserBirthDate();
    
    console.log('[ASTRO-MATCHING] ✅ System initialized');
  }

  /**
   * Загружает дату рождения текущего пользователя
   */
  async loadCurrentUserBirthDate() {
    try {
      const sessionId = window.authManager?.sessionId;
      if (!sessionId) {
        console.warn('[ASTRO-MATCHING] No session ID, cannot load user birth date');
        return null;
      }

      // Сначала проверяем localStorage
      const userDataString = localStorage.getItem('lavrilo_user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        if (userData.date_naissance || userData.birth_date || userData.birthday) {
          this.currentUserBirthDate = userData.date_naissance || userData.birth_date || userData.birthday;
          console.log('[ASTRO-MATCHING] User birth date from localStorage:', this.currentUserBirthDate);
          return this.currentUserBirthDate;
        }
      }

      // Если нет в localStorage, загружаем из API
      const userId = window.authManager?.currentUser?.id || window.authManager?.userId;
      if (userId) {
        const response = await fetch(`/api/user-profile?session_id=${sessionId}&id=${userId}`);
        const data = await response.json();
        
        if (data.success && data.result) {
          this.currentUserBirthDate = data.result.date_naissance || data.result.birth_date || data.result.birthday;
          console.log('[ASTRO-MATCHING] User birth date from API:', this.currentUserBirthDate);
          return this.currentUserBirthDate;
        }
      }

      // Fallback: используем случайную дату (для тестирования)
      if (!this.currentUserBirthDate) {
        this.currentUserBirthDate = '1990-06-15'; // Default for testing
        console.warn('[ASTRO-MATCHING] Using default birth date for testing');
      }

      return this.currentUserBirthDate;
    } catch (error) {
      console.error('[ASTRO-MATCHING] Error loading user birth date:', error);
      this.currentUserBirthDate = '1990-06-15'; // Fallback
      return this.currentUserBirthDate;
    }
  }

  /**
   * Извлекает дату рождения из профиля
   */
  extractBirthDate(profile) {
    // Пробуем разные поля
    const possibleFields = [
      'date_naissance',
      'birth_date',
      'birthday',
      'date_of_birth',
      'birthdate',
      'naissance'
    ];

    for (const field of possibleFields) {
      if (profile[field]) {
        return profile[field];
      }
    }

    // Если нет явного поля даты, пробуем вычислить из возраста
    if (profile.age) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - parseInt(profile.age);
      // Используем произвольные месяц и день (середина года)
      return `${birthYear}-06-15`;
    }

    // Последний fallback
    return '1995-01-01';
  }

  /**
   * Рассчитывает совместимость для профиля
   */
  calculateCompatibilityForProfile(profile) {
    const profileId = profile.id || profile.id_membre || 'unknown';
    
    // Проверяем кэш
    if (this.compatibilityCache.has(profileId)) {
      return this.compatibilityCache.get(profileId);
    }

    // Получаем дату рождения профиля
    const partnerBirthDate = this.extractBirthDate(profile);
    
    // Рассчитываем совместимость
    const compatibility = window.astroEngine.calculateCompatibility(
      this.currentUserBirthDate,
      partnerBirthDate
    );

    // Добавляем дополнительную информацию
    compatibility.profileId = profileId;
    compatibility.partnerBirthDate = partnerBirthDate;
    compatibility.calculatedAt = new Date().toISOString();

    // Кэшируем результат
    this.compatibilityCache.set(profileId, compatibility);

    return compatibility;
  }

  /**
   * Обогащает профиль данными о совместимости
   */
  enrichProfileWithCompatibility(profile) {
    const compatibility = this.calculateCompatibilityForProfile(profile);
    
    return {
      ...profile,
      astroCompatibility: compatibility,
      astroScore: compatibility.overall,
      astroHighlight: this.getCompatibilityHighlight(compatibility)
    };
  }

  /**
   * Получает краткое описание совместимости
   */
  getCompatibilityHighlight(compatibility) {
    const { overall, spheres } = compatibility;
    
    if (overall >= 85) {
      return { 
        emoji: '🌟', 
        text: 'Exceptional Match',
        color: '#10b981'
      };
    } else if (overall >= 75) {
      return { 
        emoji: '✨', 
        text: 'Great Compatibility',
        color: '#3b82f6'
      };
    } else if (overall >= 65) {
      return { 
        emoji: '💫', 
        text: 'Good Potential',
        color: '#8b5cf6'
      };
    } else if (overall >= 55) {
      return { 
        emoji: '🌙', 
        text: 'Moderate Match',
        color: '#f59e0b'
      };
    } else {
      return { 
        emoji: '⭐', 
        text: 'Challenging',
        color: '#ef4444'
      };
    }
  }

  /**
   * Загружает и сортирует профили по астрологической совместимости
   */
  async loadAndSortProfiles(profiles) {
    console.log(`[ASTRO-MATCHING] Processing ${profiles.length} profiles...`);
    
    // Обогащаем каждый профиль данными о совместимости
    const enrichedProfiles = profiles.map(profile => 
      this.enrichProfileWithCompatibility(profile)
    );

    // Сортируем по астрологической совместимости (от большего к меньшему)
    enrichedProfiles.sort((a, b) => b.astroScore - a.astroScore);

    console.log('[ASTRO-MATCHING] Profiles sorted by compatibility:');
    enrichedProfiles.slice(0, 5).forEach((p, i) => {
      const name = p.pseudo || p.nom_complet || 'Unknown';
      console.log(`  ${i + 1}. ${name}: ${p.astroScore}% ${p.astroHighlight.emoji}`);
    });

    this.sortedProfiles = enrichedProfiles;
    this.currentIndex = 0;

    return enrichedProfiles;
  }

  /**
   * Получает следующий профиль из отсортированного списка
   */
  getNextProfile() {
    if (this.currentIndex >= this.sortedProfiles.length) {
      return null;
    }

    const profile = this.sortedProfiles[this.currentIndex];
    this.currentIndex++;
    
    return profile;
  }

  /**
   * Получает текущий профиль
   */
  getCurrentProfile() {
    if (this.currentIndex === 0 || this.sortedProfiles.length === 0) {
      return null;
    }
    
    return this.sortedProfiles[this.currentIndex - 1];
  }

  /**
   * Сбрасывает индекс для повторного просмотра
   */
  reset() {
    this.currentIndex = 0;
    console.log('[ASTRO-MATCHING] Reset to first profile');
  }

  /**
   * Получает статистику совместимости
   */
  getCompatibilityStats() {
    if (this.sortedProfiles.length === 0) {
      return null;
    }

    const scores = this.sortedProfiles.map(p => p.astroScore);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    const distribution = {
      exceptional: scores.filter(s => s >= 85).length,
      great: scores.filter(s => s >= 75 && s < 85).length,
      good: scores.filter(s => s >= 65 && s < 75).length,
      moderate: scores.filter(s => s >= 55 && s < 65).length,
      challenging: scores.filter(s => s < 55).length
    };

    return {
      total: this.sortedProfiles.length,
      average: Math.round(average),
      highest,
      lowest,
      distribution
    };
  }

  /**
   * Фильтрует профили по минимальной совместимости
   */
  filterByMinCompatibility(minScore = 60) {
    this.sortedProfiles = this.sortedProfiles.filter(p => p.astroScore >= minScore);
    this.currentIndex = 0;
    
    console.log(`[ASTRO-MATCHING] Filtered to ${this.sortedProfiles.length} profiles with score >= ${minScore}%`);
    return this.sortedProfiles;
  }

  /**
   * Получает топ совместимых профилей
   */
  getTopMatches(count = 10) {
    return this.sortedProfiles.slice(0, count);
  }

  /**
   * Экспортирует данные о совместимости
   */
  exportCompatibilityData() {
    return {
      userBirthDate: this.currentUserBirthDate,
      userSign: window.astroEngine.getZodiacSign(this.currentUserBirthDate),
      totalProfiles: this.sortedProfiles.length,
      stats: this.getCompatibilityStats(),
      topMatches: this.getTopMatches(5).map(p => ({
        id: p.id || p.id_membre,
        name: p.pseudo || p.nom_complet,
        score: p.astroScore,
        highlight: p.astroHighlight.text
      }))
    };
  }

  /**
   * Интеграция с существующей системой discover
   */
  async integrateWithDiscover() {
    console.log('[ASTRO-MATCHING] Integrating with discover system...');
    
    // Переопределяем функцию загрузки профилей в discover
    if (window.loadNextProfile) {
      const originalLoadNextProfile = window.loadNextProfile;
      
      window.loadNextProfile = async function() {
        // Вызываем оригинальную функцию
        await originalLoadNextProfile.call(this);
        
        // Добавляем астро-совместимость к текущему профилю
        if (window.currentProfile && window.astroMatchingSystem) {
          const enriched = window.astroMatchingSystem.enrichProfileWithCompatibility(window.currentProfile);
          window.currentProfile = enriched;
          
          // Добавляем визуализацию совместимости на карточку
          window.astroMatchingSystem.addCompatibilityToCurrentCard();
        }
      };
      
      console.log('[ASTRO-MATCHING] ✅ Integrated with discover system');
    }
  }

  /**
   * Добавляет визуализацию совместимости на текущую карточку
   */
  addCompatibilityToCurrentCard() {
    const cardElement = document.getElementById('discoverCard');
    if (!cardElement || !window.currentProfile) {
      return;
    }

    // Удаляем старую визуализацию если есть
    const oldBadge = cardElement.querySelector('.astro-badge-container');
    if (oldBadge) {
      oldBadge.remove();
    }

    const compatibility = window.currentProfile.astroCompatibility;
    if (!compatibility) {
      return;
    }

    // Добавляем бейдж совместимости
    const photoWrapper = cardElement.querySelector('.profile-photo-wrapper, .profile-image');
    if (photoWrapper && window.astroUI) {
      window.astroUI.addCompatibilityToProfileCard(cardElement, compatibility);
    }

    // Добавляем полную карточку совместимости под информацией о профиле
    const infoSection = cardElement.querySelector('.profile-info-section');
    if (infoSection && !infoSection.querySelector('.astro-compatibility-card')) {
      const compatibilityCard = window.astroUI.createCompatibilityCard(compatibility, window.currentProfile);
      infoSection.insertAdjacentHTML('beforeend', compatibilityCard);
      
      // Анимируем появление
      const card = infoSection.querySelector('.astro-compatibility-card');
      if (card) {
        setTimeout(() => {
          window.astroUI.animateCompatibility(card);
        }, 100);
      }
    }
  }

  /**
   * Создает отдельную страницу "Top Astro Matches"
   */
  createTopMatchesView() {
    const topMatches = this.getTopMatches(20);
    const stats = this.getCompatibilityStats();
    
    return `
      <div class="astro-top-matches-page">
        <div class="astro-page-header">
          <h1>✨ Your Top Cosmic Matches</h1>
          <p>Discover people with exceptional astrological compatibility</p>
        </div>
        
        <div class="astro-stats-cards">
          <div class="astro-stat-card">
            <div class="astro-stat-value">${stats.total}</div>
            <div class="astro-stat-label">Total Profiles</div>
          </div>
          <div class="astro-stat-card">
            <div class="astro-stat-value">${stats.average}%</div>
            <div class="astro-stat-label">Avg Compatibility</div>
          </div>
          <div class="astro-stat-card">
            <div class="astro-stat-value">${stats.distribution.exceptional}</div>
            <div class="astro-stat-label">Exceptional Matches</div>
          </div>
        </div>
        
        <div class="astro-matches-grid">
          ${topMatches.map((profile, index) => this.createMatchCard(profile, index + 1)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Создает карточку матча для топ списка
   */
  createMatchCard(profile, rank) {
    const photoUrl = this.getProfilePhoto(profile);
    const name = profile.pseudo || profile.nom_complet || 'Unknown';
    const age = profile.age || '?';
    const location = profile.ville || profile.region || 'Unknown';
    
    return `
      <div class="astro-match-card" data-profile-id="${profile.id || profile.id_membre}">
        <div class="astro-match-rank">#${rank}</div>
        <div class="astro-match-photo">
          <img src="${photoUrl}" alt="${name}" onerror="this.src='/images/default-avatar.png'">
          ${window.astroUI.createCompactCompatibilityBadge(profile.astroScore)}
        </div>
        <div class="astro-match-info">
          <h3>${name}, ${age}</h3>
          <p>${location}</p>
          <div class="astro-match-highlight">
            <span class="astro-highlight-emoji">${profile.astroHighlight.emoji}</span>
            <span class="astro-highlight-text">${profile.astroHighlight.text}</span>
          </div>
        </div>
        <button class="astro-view-profile-btn" onclick="window.astroMatchingSystem.viewProfile('${profile.id || profile.id_membre}')">
          View Profile
        </button>
      </div>
    `;
  }

  /**
   * Получает URL фото профиля
   */
  getProfilePhoto(profile) {
    if (profile.photos_v2) {
      if (profile.photos_v2.public) {
        const publicPhotos = profile.photos_v2.public;
        const firstPhotoKey = Object.keys(publicPhotos)[0];
        if (firstPhotoKey && publicPhotos[firstPhotoKey]) {
          return publicPhotos[firstPhotoKey].sq_430 || 
                 publicPhotos[firstPhotoKey].normal || 
                 publicPhotos[firstPhotoKey].sq_middle;
        }
      } else if (Array.isArray(profile.photos_v2) && profile.photos_v2.length > 0) {
        const mainPhoto = profile.photos_v2.find(p => p.main_photo === '1') || profile.photos_v2[0];
        return mainPhoto.sq_430 || mainPhoto.normal || mainPhoto.sq_middle;
      }
    } else if (profile.photos && profile.photos.length > 0) {
      return profile.photos[0].url_big || profile.photos[0].url_middle;
    } else if (profile.picture_430) {
      return profile.picture_430;
    } else if (profile.picture) {
      return profile.picture;
    }
    
    return '/images/default-avatar.png';
  }

  /**
   * Просмотр конкретного профиля
   */
  viewProfile(profileId) {
    console.log('[ASTRO-MATCHING] View profile:', profileId);
    // Здесь можно добавить переход к конкретному профилю
    // Например, открыть модальное окно или перейти на discover с этим профилем
  }
}

// Глобальный экземпляр
window.AstroMatchingSystem = AstroMatchingSystem;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  // Ждем инициализации authManager
  const initAstroMatching = () => {
    if (window.authManager && window.astroEngine) {
      if (typeof window.authManager.isAuthenticated === 'function' && window.authManager.isAuthenticated()) {
        console.log('[ASTRO-MATCHING] Initializing AstroDate matching system...');
        window.astroMatchingSystem = new AstroMatchingSystem();
      } else {
        setTimeout(initAstroMatching, 500);
      }
    } else {
      setTimeout(initAstroMatching, 500);
    }
  };
  
  setTimeout(initAstroMatching, 100);
});

console.log('[ASTRO-MATCHING] 🎯 AstroDate matching system loaded');

