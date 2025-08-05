// Утилита для загрузки аватара пользователя в header
// Используется на всех страницах для отображения фото пользователя

/**
 * Загружает и отображает аватар пользователя в header
 */
async function loadUserAvatar() {
    try {
        console.log('[HEADER-AVATAR] Starting loadUserAvatar');
        
        if (!window.authManager) {
            console.log('[HEADER-AVATAR] authManager not found, retrying in 1s');
            setTimeout(loadUserAvatar, 1000);
            return;
        }
        
        if (!window.authManager.sessionId) {
            console.log('[HEADER-AVATAR] No sessionId found');
            return;
        }
        
        const sessionId = window.authManager.sessionId;
        const userId = window.authManager.userId;
        console.log('[HEADER-AVATAR] Using sessionId:', sessionId, 'userId:', userId);
        
        if (!userId) {
            console.log('[HEADER-AVATAR] No userId found');
            return;
        }
        
        const apiConfigResponse = await fetch('/api/get-api-key');
        const apiConfig = await apiConfigResponse.json();
        
        // Используем POST запрос согласно API документации
        const formData = new URLSearchParams();
        formData.append('session_id', sessionId);
        formData.append('id', userId);
        formData.append('get_picture_430', '1');  // Получаем фотографии
        
        const response = await fetch(`${apiConfig.baseUrl}/index_api/user?api_key=${apiConfig.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
        const userData = await response.json();
        
        console.log('[HEADER-AVATAR] API response:', userData);
        
        if (userData && userData.result) {
            const user = userData.result;
            const avatarImg = document.getElementById('userAvatarImg');
            const avatarText = document.getElementById('userAvatarText');
            
            if (avatarImg && avatarText) {
                let photoUrl = null;
                
                // Ищем главное фото пользователя согласно API документации
                if (user.photos_v2 && user.photos_v2.length > 0) {
                    // Первая фотография (num: 0) - это главная фотография
                    const mainPhoto = user.photos_v2.find(p => p.num === 0) || user.photos_v2[0];
                    // Приоритет: sq_430 (430x430), sq_middle (215x215), normal (оригинал), sq_small (80x80)
                    photoUrl = mainPhoto.sq_430 || mainPhoto.sq_middle || mainPhoto.normal || mainPhoto.sq_small;
                }
                
                if (photoUrl) {
                    console.log('[HEADER-AVATAR] Found photo URL:', photoUrl);
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
        // Увеличенная задержка для загрузки authManager
        setTimeout(initHeaderAvatar, 2000);
    });
} else {
    // DOM уже готов
    setTimeout(initHeaderAvatar, 2000);
}

// Экспортируем функции для использования в других файлах
if (typeof window !== 'undefined') {
    window.HeaderAvatar = {
        loadUserAvatar,
        initHeaderAvatar
    };
}