// Утилита для загрузки аватара пользователя в header
// Используется на всех страницах для отображения фото пользователя

/**
 * Загружает и отображает аватар пользователя в header
 */
async function loadUserAvatar() {
    try {
        if (!window.authManager || !window.authManager.sessionId) {
            return;
        }
        
        const sessionId = window.authManager.sessionId;
        const apiConfigResponse = await fetch('/api/get-api-key');
        const apiConfig = await apiConfigResponse.json();
        
        const response = await fetch(`${apiConfig.baseUrl}/index_api/user?api_key=${apiConfig.apiKey}&session_id=${sessionId}`);
        const userData = await response.json();
        
        if (userData && userData.result) {
            const user = userData.result;
            const avatarImg = document.getElementById('userAvatarImg');
            const avatarText = document.getElementById('userAvatarText');
            
            if (avatarImg && avatarText) {
                let photoUrl = null;
                
                // Ищем главное фото пользователя в порядке приоритета
                if (user.picture_430) {
                    photoUrl = user.picture_430;
                } else if (user.picture) {
                    photoUrl = user.picture;
                } else if (user.photos_v2 && user.photos_v2.length > 0) {
                    const mainPhoto = user.photos_v2.find(p => p.main === '1') || user.photos_v2[0];
                    photoUrl = mainPhoto.normal || mainPhoto.url || mainPhoto.src;
                } else if (user.photos && user.photos.length > 0) {
                    const photo = user.photos[0];
                    photoUrl = photo.url || photo.src || photo;
                }
                
                if (photoUrl) {
                    // Показываем фото
                    avatarImg.src = photoUrl;
                    avatarImg.style.display = 'block';
                    avatarText.style.display = 'none';
                    
                    // Обработка ошибок загрузки фото
                    avatarImg.onerror = function() {
                        console.warn('[HEADER-AVATAR] Failed to load user photo, showing initials');
                        avatarImg.style.display = 'none';
                        avatarText.style.display = 'flex';
                        const firstName = user.nom_complet || user.pseudo || user.login || 'U';
                        avatarText.textContent = firstName.charAt(0).toUpperCase();
                    };
                } else {
                    // Показываем первую букву имени
                    avatarImg.style.display = 'none';
                    avatarText.style.display = 'flex';
                    const firstName = user.nom_complet || user.pseudo || user.login || 'U';
                    avatarText.textContent = firstName.charAt(0).toUpperCase();
                }
            }
        }
    } catch (error) {
        console.error('[HEADER-AVATAR] Error loading user avatar:', error);
        // Fallback: показываем стандартную букву
        const avatarText = document.getElementById('userAvatarText');
        if (avatarText) {
            avatarText.textContent = 'U';
        }
    }
}

/**
 * Инициализация загрузки аватара после загрузки страницы
 */
function initHeaderAvatar() {
    // Загружаем аватар сразу
    loadUserAvatar();
    
    // Переподгружаем аватар при изменениях в auth manager
    if (window.authManager) {
        // Можно добавить слушатель событий если нужно
    }
}

// Автоматически инициализируем когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Небольшая задержка для загрузки authManager
        setTimeout(initHeaderAvatar, 500);
    });
} else {
    // DOM уже готов
    setTimeout(initHeaderAvatar, 500);
}

// Экспортируем функции для использования в других файлах
if (typeof window !== 'undefined') {
    window.HeaderAvatar = {
        loadUserAvatar,
        initHeaderAvatar
    };
}