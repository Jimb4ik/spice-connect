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
        
        // Используем endpoint user_edit_photos как в photo-manager.js
        const apiUrl = `/api/spice-multi-test?endpoint=/index_api/user_edit_photos&method=POST&session_id=${sessionId}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.warn('[HEADER-AVATAR] API request failed:', response.status, response.statusText);
            showInitials();
            return;
        }
        
        const apiData = await response.json();
        
        console.log('[HEADER-AVATAR] API response:', apiData);
        
        if (apiData && apiData.success && apiData.data) {
            const photos = apiData.data || [];
            let photoUrl = null;
            
            console.log('[HEADER-AVATAR] user_edit_photos data:', photos);
            
            // Проверяем, есть ли фотографии в user_edit_photos
            if (Array.isArray(photos) && photos.length > 0) {
                const mainPhoto = photos.find(p => p.num === 0) || photos[0];
                photoUrl = mainPhoto.sq_430 || mainPhoto.sq_middle || mainPhoto.normal || mainPhoto.sq_small;
                console.log('[HEADER-AVATAR] Found photo in user_edit_photos:', photoUrl);
            }
            
            // Если фотографий нет, пробуем fallback на /index_api/user
            if (!photoUrl) {
                console.log('[HEADER-AVATAR] No photos in user_edit_photos, trying fallback to /index_api/user');
                try {
                    const apiUrl2 = `/api/spice-multi-test?endpoint=/index_api/user&method=POST&session_id=${sessionId}&id=${userId}&get_picture_430=1`;
                    const response2 = await fetch(apiUrl2);
                    const apiData2 = await response2.json();
                    
                    console.log('[HEADER-AVATAR] Fallback API response:', apiData2);
                    
                    if (apiData2 && apiData2.success && apiData2.data?.result) {
                        const user = apiData2.data.result;
                        if (user.photos_v2 && user.photos_v2.length > 0) {
                            const mainPhoto = user.photos_v2.find(p => p.num === 0) || user.photos_v2[0];
                            photoUrl = mainPhoto.sq_430 || mainPhoto.sq_middle || mainPhoto.normal || mainPhoto.sq_small;
                        }
                    }
                } catch (error) {
                    console.warn('[HEADER-AVATAR] Fallback API failed:', error);
                }
            }
            
            const avatarImg = document.getElementById('userAvatarImg');
            const avatarText = document.getElementById('userAvatarText');
            
            if (avatarImg && avatarText) {
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
                        const firstName = userData.nom_complet || userData.pseudo || userData.login || 'D';
                        avatarText.textContent = firstName.charAt(0).toUpperCase();
                    };
                } else {
                    // Показываем первую букву имени
                    avatarImg.style.display = 'none';
                    avatarText.style.display = 'flex';
                    const firstName = userData.nom_complet || userData.pseudo || userData.login || 'D';
                    avatarText.textContent = firstName.charAt(0).toUpperCase();
                }
            }
            
            // Обновляем дропдаун с информацией о пользователе (используем данные из localStorage)
            updateDropdownUserInfo(userData);
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