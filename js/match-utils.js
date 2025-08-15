// Утилиты для работы с матчами
// Общая логика сохранения матчей для всех компонентов

/**
 * Универсальная функция сохранения матча в базу данных
 * @param {Object} matchedProfile - Профиль пользователя с которым произошел матч
 * @param {String} currentUserId - ID текущего пользователя (опционально)
 * @returns {Promise<boolean>} - true если матч сохранен успешно
 */
async function saveMatchToDatabase(matchedProfile, currentUserId = null) {
    try {
        console.log('[MATCH-UTILS] Saving match to database:', matchedProfile);
        
        // Получаем ID текущего пользователя если не передан
        let userId = currentUserId;
        if (!userId) {
            userId = await getCurrentUserId();
        }
        
        if (!userId) {
            console.error('[MATCH-UTILS] No user ID for saving match');
            return false;
        }
        
        // Подготавливаем данные матча
        const matchData = {
            action: 'save_match',
            user_id: userId,
            matched_user_id: matchedProfile.id || matchedProfile.id_membre,
            matched_user_name: matchedProfile.pseudo || matchedProfile.nom_complet || 'Unknown',
            matched_user_age: matchedProfile.age || null,
            matched_user_city: matchedProfile.ville || matchedProfile.region || null,
            matched_user_photos: getProfilePhotos(matchedProfile)
        };
        
        console.log('[MATCH-UTILS] Match data to save:', matchData);
        console.log('[MATCH-UTILS] Profile ID found:', matchedProfile.id || matchedProfile.id_membre);
        console.log('[MATCH-UTILS] Current user ID:', userId);
        
        const response = await fetch('/api/database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(matchData)
        });
        
        const result = await response.json();
        console.log('[MATCH-UTILS] Match saved result:', result);
        
        if (result.success) {
            console.log('✅ Match successfully saved to database!');
            return true;
        } else {
            console.error('❌ Failed to save match:', result.error);
            return false;
        }
        
    } catch (error) {
        console.error('[MATCH-UTILS] Error saving match to database:', error);
        return false;
    }
}

/**
 * Получить ID текущего пользователя
 * @returns {Promise<string|null>} - ID пользователя или null
 */
async function getCurrentUserId() {
    try {
        const sessionId = window.authManager?.sessionId;
        if (!sessionId) return null;
        
        const apiConfigResponse = await fetch('/api/get-api-key');
        const apiConfig = await apiConfigResponse.json();
        
        const response = await fetch(`${apiConfig.baseUrl}/index_api/user?api_key=${apiConfig.apiKey}&session_id=${sessionId}`);
        const userData = await response.json();
        
        if (userData && userData.result) {
            return userData.result.id || userData.result.id_membre || sessionId;
        }
        
        return sessionId; // fallback
    } catch (error) {
        console.error('[MATCH-UTILS] Error getting user ID:', error);
        return null;
    }
}

/**
 * Собрать все фотографии профиля в единый массив
 * @param {Object} profile - Объект профиля
 * @returns {Array<string>} - Массив URL фотографий
 */
function getProfilePhotos(profile) {
    const photos = [];
    
    // Собираем фотографии из разных полей
    if (profile.photos_v2 && Array.isArray(profile.photos_v2)) {
        photos.push(...profile.photos_v2.map(p => p.url || p.src || p.normal || p));
    }
    
    if (profile.photos && Array.isArray(profile.photos)) {
        photos.push(...profile.photos.map(p => p.url || p.src || p.normal || p));
    }
    
    if (profile.picture_430) photos.push(profile.picture_430);
    if (profile.picture) photos.push(profile.picture);
    
    return photos.filter(photo => photo && typeof photo === 'string');
}

/**
 * Загрузить все матчи пользователя из базы данных
 * @param {String} userId - ID пользователя (опционально)
 * @returns {Promise<Array>} - Массив матчей
 */
async function loadUserMatches(userId = null) {
    try {
        if (!userId) {
            userId = await getCurrentUserId();
        }
        
        if (!userId) {
            console.error('[MATCH-UTILS] No user ID for loading matches');
            return [];
        }
        
        const response = await fetch('/api/database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'get_matches',
                user_id: userId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('[MATCH-UTILS] Matches loaded:', result.data);
            return result.data || [];
        } else {
            console.error('[MATCH-UTILS] Failed to load matches:', result.error);
            return [];
        }
        
    } catch (error) {
        console.error('[MATCH-UTILS] Error loading matches:', error);
        return [];
    }
}

// Экспортируем функции для использования в других файлах
if (typeof window !== 'undefined') {
    window.MatchUtils = {
        saveMatchToDatabase,
        getCurrentUserId,
        getProfilePhotos,
        loadUserMatches
    };
}