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
        const photos = getProfilePhotos(matchedProfile);
        const matchData = {
            action: 'save_match',
            user_id: userId,
            matched_user_id: matchedProfile.id || matchedProfile.id_membre,
            matched_user_name: matchedProfile.pseudo || matchedProfile.nom_complet || 'Unknown',
            matched_user_age: parseInt(matchedProfile.age) || null,
            matched_user_city: matchedProfile.ville || matchedProfile.region || null,
            matched_user_photos: photos
        };
        
        // Валидация обязательных полей
        if (!matchData.matched_user_id) {
            console.error('[MATCH-UTILS] No matched user ID found in profile:', matchedProfile);
            return false;
        }

        console.log('[MATCH-UTILS] Match data to save:', matchData);
        console.log('[MATCH-UTILS] Profile ID found:', matchedProfile.id || matchedProfile.id_membre);
        console.log('[MATCH-UTILS] Current user ID:', userId);
        console.log('[MATCH-UTILS] Photos found:', photos);
        
        const response = await fetch('/api/database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(matchData)
        });
        
        if (!response.ok) {
            console.error('[MATCH-UTILS] HTTP error:', response.status, response.statusText);
            return false;
        }
        
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
        if (!sessionId) {
            console.error('[MATCH-UTILS] No session ID available');
            return null;
        }
        
        console.log('[MATCH-UTILS] Session ID:', sessionId);
        
        // Проверяем есть ли сохраненный user ID в localStorage
        const userData = localStorage.getItem('lavrilo_user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.id) {
                    console.log('[MATCH-UTILS] Using cached user ID:', user.id);
                    return user.id;
                }
            } catch (e) {
                console.warn('[MATCH-UTILS] Failed to parse cached user data');
            }
        }
        
        const apiConfigResponse = await fetch('/api/get-api-key');
        const apiConfig = await apiConfigResponse.json();
        
        const response = await fetch(`${apiConfig.baseUrl}/index_api/user?api_key=${apiConfig.apiKey}&session_id=${sessionId}`);
        const userApiData = await response.json();
        
        console.log('[MATCH-UTILS] API user data:', userApiData);
        
        if (userApiData && userApiData.result) {
            const userId = userApiData.result.id || userApiData.result.id_membre || sessionId;
            console.log('[MATCH-UTILS] Extracted user ID:', userId);
            return userId;
        }
        
        console.log('[MATCH-UTILS] Using session ID as fallback user ID');
        return sessionId; // fallback
    } catch (error) {
        console.error('[MATCH-UTILS] Error getting user ID:', error);
        return window.authManager?.sessionId || null;
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
 * Загрузить все матчи пользователя из API и локальной базы данных
 * @param {String} userId - ID пользователя (опционально)
 * @returns {Promise<Array>} - Массив матчей
 */
async function loadUserMatches(userId = null) {
    try {
        console.log('[MATCH-UTILS] Loading matches from API and database...');
        
        // Загружаем матчи из официального API
        const apiMatches = await loadMatchesFromAPI();
        console.log('[MATCH-UTILS] API matches:', apiMatches);
        
        // Загружаем матчи из локальной базы данных
        const dbMatches = await loadMatchesFromDatabase(userId);
        console.log('[MATCH-UTILS] Database matches:', dbMatches);
        
        // Объединяем матчи, убираем дубликаты
        const allMatches = mergeMatches(apiMatches, dbMatches);
        console.log('[MATCH-UTILS] Merged matches:', allMatches);
        
        return allMatches;
        
    } catch (error) {
        console.error('[MATCH-UTILS] Error loading matches:', error);
        return [];
    }
}

/**
 * Загрузить матчи из официального API
 * @returns {Promise<Array>} - Массив матчей из API
 */
async function loadMatchesFromAPI() {
    try {
        const sessionId = window.authManager?.sessionId;
        if (!sessionId) {
            console.warn('[MATCH-UTILS] No session ID for API matches');
            return [];
        }
        
        const apiConfigResponse = await fetch('/api/get-api-key');
        const apiConfig = await apiConfigResponse.json();
        
        const matchQuery = new URLSearchParams({
            session_id: sessionId,
            api_key: apiConfig.apiKey,
            action: 'get_matches'
        });
        
        const apiUrl = `${apiConfig.baseUrl}/index_api/match?${matchQuery.toString()}`;
        console.log('[MATCH-UTILS] Loading matches from API:', apiUrl);
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        console.log('[MATCH-UTILS] API response:', data);
        
        if (data && data.result && Array.isArray(data.result)) {
            return data.result.map(match => ({
                id: match.id || match.id_membre,
                matched_user_id: match.id || match.id_membre,
                matched_user_name: match.pseudo || match.nom_complet || 'Unknown',
                matched_user_age: match.age,
                matched_user_city: match.ville || match.region,
                matched_user_photos: getProfilePhotos(match),
                match_date: new Date().toISOString(),
                is_read: false,
                source: 'api'
            }));
        }
        
        return [];
        
    } catch (error) {
        console.error('[MATCH-UTILS] Error loading API matches:', error);
        return [];
    }
}

/**
 * Загрузить матчи из локальной базы данных
 * @param {String} userId - ID пользователя
 * @returns {Promise<Array>} - Массив матчей из БД
 */
async function loadMatchesFromDatabase(userId = null) {
    try {
        if (!userId) {
            userId = await getCurrentUserId();
        }
        
        if (!userId) {
            console.warn('[MATCH-UTILS] No user ID for database matches');
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
            return (result.data || []).map(match => ({
                ...match,
                source: 'database'
            }));
        } else {
            console.error('[MATCH-UTILS] Failed to load database matches:', result.error);
            return [];
        }
        
    } catch (error) {
        console.error('[MATCH-UTILS] Error loading database matches:', error);
        return [];
    }
}

/**
 * Объединить матчи из API и базы данных, убрать дубликаты
 * @param {Array} apiMatches - Матчи из API
 * @param {Array} dbMatches - Матчи из БД
 * @returns {Array} - Объединенный массив матчей
 */
function mergeMatches(apiMatches, dbMatches) {
    const matchesMap = new Map();
    
    // Добавляем матчи из API
    apiMatches.forEach(match => {
        const key = match.matched_user_id;
        matchesMap.set(key, match);
    });
    
    // Добавляем матчи из БД (только если их нет в API)
    dbMatches.forEach(match => {
        const key = match.matched_user_id;
        if (!matchesMap.has(key)) {
            matchesMap.set(key, match);
        }
    });
    
    return Array.from(matchesMap.values()).sort((a, b) => 
        new Date(b.match_date) - new Date(a.match_date)
    );
}

// Экспортируем функции для использования в других файлах
if (typeof window !== 'undefined') {
    window.MatchUtils = {
        saveMatchToDatabase,
        getCurrentUserId,
        getProfilePhotos,
        loadUserMatches,
        loadMatchesFromAPI,
        loadMatchesFromDatabase,
        mergeMatches
    };
}