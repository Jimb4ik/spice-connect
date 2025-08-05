// Утилита для загрузки аватара пользователя в header
// Используется на всех страницах для отображения фото пользователя

// Функция для отображения инициалов
function showInitials(name = 'H') {
    const avatarImg = document.getElementById('userAvatarImg');
    const avatarText = document.getElementById('userAvatarText');
    
    if (avatarImg && avatarText) {
        avatarImg.style.display = 'none';
        avatarText.style.display = 'flex';
        avatarText.textContent = name.charAt(0).toUpperCase();
    }
}

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
        
        // Получаем userId из localStorage как в profile.html
        const userDataString = localStorage.getItem('lavrilo_user');
        if (!userDataString) {
            console.log('[HEADER-AVATAR] No user data in localStorage');
            return;
        }
        
        const userData = JSON.parse(userDataString);
        const userId = userData.id;
        console.log('[HEADER-AVATAR] Using sessionId:', sessionId, 'userId:', userId);
        
        if (!userId) {
            console.log('[HEADER-AVATAR] No userId found');
            return;
        }
        
        // Используем прокси API как в profile.html
        const apiUrl = `/api/spice-multi-test?endpoint=/index_api/user&method=POST&session_id=${sessionId}&id=${userId}&get_picture_430=1`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.warn('[HEADER-AVATAR] API request failed:', response.status, response.statusText);
            showInitials();
            return;
        }
        
        const apiData = await response.json();
        
        console.log('[HEADER-AVATAR] API response:', apiData);
        
        if (apiData && apiData.success && apiData.data?.result) {
            const user = apiData.data.result;
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

// Функция для проверки и повторного вызова
function tryInitHeaderAvatar(attempt = 1, maxAttempts = 5) {
    console.log(`[HEADER-AVATAR] Attempt ${attempt}/${maxAttempts} to init header avatar`);
    
    if (window.authManager && window.authManager.sessionId) {
        console.log('[HEADER-AVATAR] AuthManager ready, initializing...');
        initHeaderAvatar();
    } else if (attempt < maxAttempts) {
        console.log('[HEADER-AVATAR] AuthManager not ready, retrying in 1s...');
        setTimeout(() => tryInitHeaderAvatar(attempt + 1, maxAttempts), 1000);
    } else {
        console.error('[HEADER-AVATAR] Failed to initialize after', maxAttempts, 'attempts');
    }
}

// Автоматически инициализируем когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => tryInitHeaderAvatar(), 1000);
    });
} else {
    // DOM уже готов
    setTimeout(() => tryInitHeaderAvatar(), 1000);
}

// Экспортируем функции для использования в других файлах
if (typeof window !== 'undefined') {
    window.HeaderAvatar = {
        loadUserAvatar,
        initHeaderAvatar
    };
}