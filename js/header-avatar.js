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
 * Обновляет дропдаун с информацией о пользователе
 */
async function updateDropdownUserInfo(user) {
    try {
        // Обновляем аватар в дропдауне
        const dropdownAvatarImg = document.getElementById('dropdownAvatarImg');
        const dropdownAvatarText = document.getElementById('dropdownAvatarText');
        const dropdownUsername = document.getElementById('dropdownUsername');
        
        if (dropdownUsername) {
            dropdownUsername.textContent = user.pseudo || user.nom_complet || user.login || 'User';
        }
        
        if (dropdownAvatarImg && dropdownAvatarText) {
            let photoUrl = null;
            
            // Получаем фотографии пользователя из user_edit_photos
            const sessionId = window.authManager.sessionId;
            if (sessionId) {
                try {
                    const apiUrl = `/api/spice-multi-test?endpoint=/index_api/user_edit_photos&method=POST&session_id=${sessionId}`;
                    const response = await fetch(apiUrl);
                    const apiData = await response.json();
                    
                    if (apiData && apiData.success && apiData.data) {
                        const photos = apiData.data || [];
                        if (Array.isArray(photos) && photos.length > 0) {
                            const mainPhoto = photos.find(p => p.num === 0) || photos[0];
                            photoUrl = mainPhoto.sq_430 || mainPhoto.sq_middle || mainPhoto.normal || mainPhoto.sq_small;
                        }
                    }
                    
                    // Если фотографий нет, пробуем fallback на /index_api/user
                    if (!photoUrl) {
                        const userDataString = localStorage.getItem('lavrilo_user');
                        if (userDataString) {
                            const userData = JSON.parse(userDataString);
                            const userId = userData.id;
                            
                            const apiUrl2 = `/api/spice-multi-test?endpoint=/index_api/user&method=POST&session_id=${sessionId}&id=${userId}&get_picture_430=1`;
                            const response2 = await fetch(apiUrl2);
                            const apiData2 = await response2.json();
                            
                            if (apiData2 && apiData2.success && apiData2.data?.result) {
                                const user = apiData2.data.result;
                                if (user.photos_v2 && user.photos_v2.length > 0) {
                                    const mainPhoto = user.photos_v2.find(p => p.num === 0) || user.photos_v2[0];
                                    photoUrl = mainPhoto.sq_430 || mainPhoto.sq_middle || mainPhoto.normal || mainPhoto.sq_small;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.warn('[HEADER-AVATAR] Error loading photos for dropdown:', error);
                }
            }
            
            if (photoUrl) {
                dropdownAvatarImg.src = photoUrl;
                dropdownAvatarImg.style.display = 'block';
                dropdownAvatarText.style.display = 'none';
                
                dropdownAvatarImg.onerror = function() {
                    dropdownAvatarImg.style.display = 'none';
                    dropdownAvatarText.style.display = 'flex';
                    const firstName = user.nom_complet || user.pseudo || user.login || 'U';
                    dropdownAvatarText.textContent = firstName.charAt(0).toUpperCase();
                };
            } else {
                dropdownAvatarImg.style.display = 'none';
                dropdownAvatarText.style.display = 'flex';
                const firstName = user.nom_complet || user.pseudo || user.login || 'U';
                dropdownAvatarText.textContent = firstName.charAt(0).toUpperCase();
            }
        }
    } catch (error) {
        console.error('[HEADER-AVATAR] Error updating dropdown:', error);
    }
}

/**
 * Загружает и отображает аватар пользователя в header
 */
async function loadUserAvatar() {
    try {
        console.log('[HEADER-AVATAR] Starting loadUserAvatar');
        
        // Wait for authManager if not available
        if (!window.authManager) {
            console.log('[HEADER-AVATAR] authManager not found, retrying in 1s');
            setTimeout(loadUserAvatar, 1000);
            return;
        }
        
        // Ensure sessionId is available
        if (!window.authManager.sessionId) {
            console.log('[HEADER-AVATAR] No sessionId found');
            return;
        }
        
        const sessionId = window.authManager.sessionId;
        
        // Get userId from localStorage consistently
        const userDataString = localStorage.getItem('lavrilo_user');
        if (!userDataString) {
            console.log('[HEADER-AVATAR] No user data in localStorage');
            return;
        }
        
        const userData = JSON.parse(userDataString);
        const userId = userData?.id;
        
        if (!userId) {
            console.log('[HEADER-AVATAR] No userId found in localStorage');
            return;
        }
        
        console.log(`[HEADER-AVATAR] Fetching profile for userId: ${userId}`);
        
        const profile = await window.authManager.fetchUserProfile(userId, sessionId);
        
        if (!profile) {
            console.log('[HEADER-AVATAR] No profile data received');
            return;
        }
        
        console.log('[HEADER-AVATAR] Profile data received:', profile);
        
        // Handle photos_v2 as array or object
        let mainPhoto;
        if (Array.isArray(profile.photos_v2)) {
            mainPhoto = profile.photos_v2.find(photo => photo.main === 1);
        } else if (typeof profile.photos_v2 === 'object') {
            mainPhoto = Object.values(profile.photos_v2).find(photo => photo.main === 1);
        }
        
        if (mainPhoto && mainPhoto.photo_url) {
            const avatarImg = document.querySelector('.user-avatar img');
            if (avatarImg) {
                avatarImg.src = mainPhoto.photo_url;
                avatarImg.alt = profile.pseudo || 'User';
                console.log(`[HEADER-AVATAR] Avatar updated to: ${mainPhoto.photo_url}`);
            }
        } else {
            console.log('[HEADER-AVATAR] No main photo found');
        }
        
    } catch (error) {
        console.error('[HEADER-AVATAR] Error loading avatar:', error);
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