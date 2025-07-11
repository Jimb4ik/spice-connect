// Пример конфигурации для SpiceConnect
// Скопируйте этот файл как config.js и заполните ваши данные

const API_CONFIG = {
    // Базовый URL API
    BASE_URL: 'https://api.jetsetrdv.com',
    
    // Ваш API ключ (получите у провайдера Spice API)
    API_KEY: 'YOUR_API_KEY_HERE',
    
    // Пароль для server-to-server вызовов (если требуется)
    API_PASSWORD: 'YOUR_API_PASSWORD_HERE',
    
    // Настройки приложения
    APP_SETTINGS: {
        // Название приложения
        APP_NAME: 'SpiceConnect',
        
        // Версия
        VERSION: '1.0.0',
        
        // Поддерживаемые языки
        LANGUAGES: ['ru', 'en'],
        
        // Максимальный размер загружаемых файлов (в байтах)
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        
        // Поддерживаемые форматы изображений
        SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        
        // Настройки поиска
        SEARCH_SETTINGS: {
            MIN_AGE: 18,
            MAX_AGE: 100,
            DEFAULT_RADIUS: 50, // км
            MAX_RESULTS: 50
        },
        
        // Настройки сообщений
        MESSAGE_SETTINGS: {
            MAX_MESSAGE_LENGTH: 1000,
            MAX_MESSAGES_PER_REQUEST: 50,
            TYPING_TIMEOUT: 3000 // мс
        }
    },
    
    // Эндпоинты API
    ENDPOINTS: {
        // Авторизация
        LOGIN: '/index_api/login',
        LOGOUT: '/index_api/logout',
        
        // Регистрация
        REGISTER: '/index_api/subscribe',
        FAST_REGISTER: '/index_api/confirmation_eclair',
        
        // Пользователи
        USER_PROFILE: '/index_api/user',
        USER_ONLINE: '/index_api/user/is_online',
        
        // Редактирование профиля
        UPDATE_PROFILE: '/index_api/user/modify/informations',
        UPDATE_DESCRIPTION: '/index_api/user/modify/description',
        UPDATE_AGE_CITY: '/index_api/user/modify/age_sexe_ville',
        
        // Поиск
        SEARCH_USERS: '/index_api/search',
        TOP_MEMBERS: '/index_api/topmembers',
        
        // Сообщения
        SEND_MESSAGE: '/ajax_api/send_message',
        LOAD_MESSAGES: '/ajax_api/load_messages',
        LOAD_CONTACTS: '/ajax_api/load_contacts',
        
        // Контакты и друзья
        ADD_CONTACT: '/ajax_api/setContact',
        ADD_FRIEND: '/ajax_api/setFriend',
        BLOCK_USER: '/ajax_api/setIgnore',
        
        // Фотографии
        UPLOAD_PHOTO: '/ajax_api/upload_photo',
        UPLOAD_AVATAR: '/ajax_api/upload_avatar',
        EDIT_PHOTOS: '/index_api/user_edit_photos',
        DELETE_PHOTO: '/index_api/user_edit_photos/del',
        
        // Голосование и лайки
        VOTE_PHOTO: '/ajax_api/gal_vote',
        SEND_FLASH: '/ajax_api/setFlash',
        
        // Активность
        GET_ACTIVITIES: '/ajax_api/getActivities',
        GET_VISITS: '/index_api/guest/get/visites',
        GET_VOTES: '/index_api/guest/get/votes',
        
        // Дополнительные функции
        GET_ARRAYS: '/index_api/array/get',
        GEOLOCATION: '/ajax_api/getGeoInfos',
        REGIONS_AUTOCOMPLETE: '/ajax_api/getRegionsAutocomp',
        
        // Информационные страницы
        FAQ: '/index_api/faq',
        TERMS: '/index_api/cgu',
        PRIVACY: '/index_api/pcd',
        CONTACT: '/index_api/contact'
    },
    
    // Настройки отладки
    DEBUG: {
        ENABLED: true,
        LOG_API_CALLS: true,
        SHOW_ERRORS: true,
        DEMO_MODE: true // Использовать заглушки вместо реальных API вызовов
    }
};

// Экспорт конфигурации
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
} else {
    window.API_CONFIG = API_CONFIG;
}

// Инструкции по настройке:
/*
1. Получите API ключ у провайдера Spice API
2. Замените 'YOUR_API_KEY_HERE' на ваш реальный API ключ
3. При необходимости настройте BASE_URL для вашего домена
4. Настройте APP_SETTINGS в соответствии с вашими требованиями
5. Для production установите DEBUG.ENABLED = false
6. Для тестирования оставьте DEBUG.DEMO_MODE = true
*/ 