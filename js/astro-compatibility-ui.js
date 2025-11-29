/**
 * AstroDate Compatibility UI Component
 * 
 * Визуальный компонент для отображения астрологической совместимости
 * с красивой инфографикой и анимациями
 */

class AstroCompatibilityUI {
  constructor() {
    this.animationDuration = 1500; // ms
  }

  /**
   * Создает HTML для карточки совместимости
   */
  createCompatibilityCard(compatibility, profile) {
    const formatted = window.astroEngine.formatCompatibilityForDisplay(compatibility);
    
    return `
      <div class="astro-compatibility-card fade-in">
        <!-- Общая совместимость -->
        <div class="astro-overall-score">
          <div class="astro-score-circle" data-score="${formatted.overallScore}">
            <svg class="astro-score-ring" width="120" height="120">
              <circle class="astro-ring-background" cx="60" cy="60" r="54"></circle>
              <circle class="astro-ring-progress" cx="60" cy="60" r="54" 
                      style="--score: ${formatted.overallScore}"></circle>
            </svg>
            <div class="astro-score-text">
              <span class="astro-score-number">${formatted.overallScore}</span>
              <span class="astro-score-percent">%</span>
            </div>
          </div>
          <div class="astro-match-label">Cosmic Match</div>
        </div>

        <!-- Знаки зодиака -->
        <div class="astro-signs-display">
          <div class="astro-sign-item">
            <div class="astro-sign-icon">${formatted.sign1.split(' ')[0]}</div>
            <div class="astro-sign-name">${formatted.sign1.split(' ')[1]}</div>
          </div>
          <div class="astro-heart-connector">
            <div class="astro-heart-pulse">💫</div>
          </div>
          <div class="astro-sign-item">
            <div class="astro-sign-icon">${formatted.sign2.split(' ')[0]}</div>
            <div class="astro-sign-name">${formatted.sign2.split(' ')[1]}</div>
          </div>
        </div>

        <!-- Описание -->
        <div class="astro-description">
          ${formatted.description}
        </div>

        <!-- Совместимость по сферам -->
        <div class="astro-spheres-grid">
          ${this.createSphereBar('Love', '❤️', compatibility.spheres.love)}
          ${this.createSphereBar('Friendship', '🤝', compatibility.spheres.friendship)}
          ${this.createSphereBar('Passion', '🔥', compatibility.spheres.sex)}
          ${this.createSphereBar('Partnership', '💼', compatibility.spheres.work)}
          ${this.createSphereBar('Emotional', '💕', compatibility.spheres.emotional)}
          ${this.createSphereBar('Mental', '🧠', compatibility.spheres.intellectual)}
        </div>

        <!-- Детали -->
        <div class="astro-details-section">
          <button class="astro-details-toggle" onclick="window.astroUI.toggleDetails(this)">
            <span>View Detailed Analysis</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 9L1 4h10z"/>
            </svg>
          </button>
          <div class="astro-details-content" style="display: none;">
            <div class="astro-detail-row">
              <span class="astro-detail-label">Your Ascendant:</span>
              <span class="astro-detail-value">${formatted.ascendant1}</span>
            </div>
            <div class="astro-detail-row">
              <span class="astro-detail-label">Their Ascendant:</span>
              <span class="astro-detail-value">${formatted.ascendant2}</span>
            </div>
            <div class="astro-detail-row">
              <span class="astro-detail-label">Elemental Harmony:</span>
              <span class="astro-detail-value">${Math.round(compatibility.details.elementalHarmony)}%</span>
            </div>
            <div class="astro-detail-row">
              <span class="astro-detail-label">Planetary Harmony:</span>
              <span class="astro-detail-value">${Math.round(compatibility.details.planetaryHarmony)}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Создает прогресс-бар для отдельной сферы совместимости
   */
  createSphereBar(label, emoji, score) {
    const color = this.getScoreColor(score);
    return `
      <div class="astro-sphere-item">
        <div class="astro-sphere-header">
          <span class="astro-sphere-emoji">${emoji}</span>
          <span class="astro-sphere-label">${label}</span>
          <span class="astro-sphere-score">${score}%</span>
        </div>
        <div class="astro-sphere-bar-container">
          <div class="astro-sphere-bar-bg"></div>
          <div class="astro-sphere-bar-fill" 
               style="--score: ${score}; --color: ${color}"
               data-score="${score}"></div>
        </div>
      </div>
    `;
  }

  /**
   * Определяет цвет на основе процента совместимости
   */
  getScoreColor(score) {
    if (score >= 85) return 'var(--color-excellent, #10b981)';
    if (score >= 70) return 'var(--color-great, #3b82f6)';
    if (score >= 55) return 'var(--color-good, #8b5cf6)';
    return 'var(--color-moderate, #f59e0b)';
  }

  /**
   * Анимирует отображение совместимости
   */
  animateCompatibility(containerElement) {
    // Анимация круга совместимости
    const scoreRing = containerElement.querySelector('.astro-ring-progress');
    if (scoreRing) {
      setTimeout(() => {
        scoreRing.classList.add('animate');
      }, 100);
    }

    // Анимация прогресс-баров
    const sphereBars = containerElement.querySelectorAll('.astro-sphere-bar-fill');
    sphereBars.forEach((bar, index) => {
      setTimeout(() => {
        bar.classList.add('animate');
      }, 300 + index * 100);
    });

    // Пульсация сердца
    const heartPulse = containerElement.querySelector('.astro-heart-pulse');
    if (heartPulse) {
      setInterval(() => {
        heartPulse.style.animation = 'none';
        setTimeout(() => {
          heartPulse.style.animation = 'pulse 1.5s ease-in-out';
        }, 10);
      }, 2000);
    }
  }

  /**
   * Переключает детальную информацию
   */
  toggleDetails(buttonElement) {
    const content = buttonElement.nextElementSibling;
    const svg = buttonElement.querySelector('svg');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      svg.style.transform = 'rotate(180deg)';
      buttonElement.querySelector('span').textContent = 'Hide Details';
    } else {
      content.style.display = 'none';
      svg.style.transform = 'rotate(0deg)';
      buttonElement.querySelector('span').textContent = 'View Detailed Analysis';
    }
  }

  /**
   * Создает компактную версию для профиля в списке
   */
  createCompactCompatibilityBadge(score) {
    const color = this.getScoreColor(score);
    const emoji = score >= 85 ? '🌟' : score >= 70 ? '✨' : score >= 55 ? '💫' : '🌙';
    
    return `
      <div class="astro-compact-badge" style="--badge-color: ${color}">
        <span class="astro-badge-emoji">${emoji}</span>
        <span class="astro-badge-score">${score}%</span>
      </div>
    `;
  }

  /**
   * Создает мини-визуализацию для карточки профиля
   */
  createMiniVisualization(compatibility) {
    return `
      <div class="astro-mini-viz">
        <div class="astro-mini-score">${compatibility.overall}%</div>
        <div class="astro-mini-bars">
          ${this.createMiniBar(compatibility.spheres.love)}
          ${this.createMiniBar(compatibility.spheres.friendship)}
          ${this.createMiniBar(compatibility.spheres.sex)}
          ${this.createMiniBar(compatibility.spheres.work)}
        </div>
      </div>
    `;
  }

  /**
   * Создает мини-бар для компактного отображения
   */
  createMiniBar(score) {
    const height = Math.max(20, score);
    const color = this.getScoreColor(score);
    return `<div class="astro-mini-bar" style="height: ${height}%; background: ${color};"></div>`;
  }

  /**
   * Отображает совместимость в модальном окне
   */
  showCompatibilityModal(compatibility, profile) {
    const modalHtml = `
      <div class="astro-compatibility-modal" id="astroCompatibilityModal">
        <div class="astro-modal-overlay" onclick="window.astroUI.closeCompatibilityModal()"></div>
        <div class="astro-modal-content">
          <button class="astro-modal-close" onclick="window.astroUI.closeCompatibilityModal()">
            ×
          </button>
          <div class="astro-modal-header">
            <h2>✨ Astrological Compatibility</h2>
            <p class="astro-modal-subtitle">Cosmic connection analysis</p>
          </div>
          <div class="astro-modal-body">
            ${this.createCompatibilityCard(compatibility, profile)}
          </div>
        </div>
      </div>
    `;

    // Удаляем старое модальное окно если есть
    const existingModal = document.getElementById('astroCompatibilityModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Добавляем новое
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Анимируем
    const modal = document.getElementById('astroCompatibilityModal');
    setTimeout(() => {
      modal.classList.add('active');
      this.animateCompatibility(modal);
    }, 10);
  }

  /**
   * Закрывает модальное окно совместимости
   */
  closeCompatibilityModal() {
    const modal = document.getElementById('astroCompatibilityModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  /**
   * Добавляет индикатор совместимости на карточку профиля
   */
  addCompatibilityToProfileCard(cardElement, compatibility) {
    const badge = this.createCompactCompatibilityBadge(compatibility.overall);
    
    // Ищем место для вставки
    const photoWrapper = cardElement.querySelector('.profile-photo-wrapper, .profile-image');
    if (photoWrapper) {
      const badgeContainer = document.createElement('div');
      badgeContainer.className = 'astro-badge-container';
      badgeContainer.innerHTML = badge;
      badgeContainer.style.cssText = 'position: absolute; top: 10px; right: 10px; z-index: 10;';
      
      // Делаем кликабельным для показа деталей
      badgeContainer.onclick = (e) => {
        e.stopPropagation();
        this.showCompatibilityModal(compatibility, {});
      };
      
      photoWrapper.style.position = 'relative';
      photoWrapper.appendChild(badgeContainer);
    }
  }

  /**
   * Создает текстовое объяснение совместимости
   */
  generateCompatibilityInsight(compatibility) {
    const { overall, spheres, details } = compatibility;
    
    let insights = [];
    
    // Главный инсайт
    if (overall >= 85) {
      insights.push(`💝 You have an exceptional cosmic connection with this person!`);
    } else if (overall >= 70) {
      insights.push(`✨ Your astrological charts show strong harmony.`);
    } else if (overall >= 55) {
      insights.push(`🌟 You have good potential for a meaningful connection.`);
    } else {
      insights.push(`🌙 This connection may require extra effort and understanding.`);
    }
    
    // Лучшая сфера
    const bestSphere = Object.entries(spheres).reduce((a, b) => a[1] > b[1] ? a : b);
    if (bestSphere[1] >= 80) {
      insights.push(`Your strongest connection is in ${bestSphere[0]} (${bestSphere[1]}%).`);
    }
    
    // Комментарий о стихиях
    if (details.elementalHarmony >= 80) {
      insights.push(`Your elemental balance creates natural harmony.`);
    }
    
    return insights.join(' ');
  }

  /**
   * Создает анимированную звездную визуализацию
   */
  createStarryBackground(containerElement) {
    const starsHtml = Array.from({length: 20}, (_, i) => {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 3;
      const duration = 2 + Math.random() * 2;
      return `<div class="astro-star" style="left: ${left}%; top: ${top}%; animation-delay: ${delay}s; animation-duration: ${duration}s;"></div>`;
    }).join('');
    
    const starsContainer = document.createElement('div');
    starsContainer.className = 'astro-stars-container';
    starsContainer.innerHTML = starsHtml;
    containerElement.appendChild(starsContainer);
  }
}

// Глобальный экземпляр
window.AstroCompatibilityUI = AstroCompatibilityUI;
window.astroUI = new AstroCompatibilityUI();

console.log('[ASTRO-UI] 🎨 AstroDate compatibility UI initialized');

