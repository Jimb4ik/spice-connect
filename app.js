// SpiceConnect - Основное приложение (Live версия с реальным Spice API)

// API Configuration - Правильные endpoints для Spice API V2
const API_CONFIG = {
    PROXY_URL: '/api/spice-proxy', // Наша serverless функция
    ENDPOINTS: {
        LOGIN: '/index_api/login',
        REGISTER: '/index_api/subscribe', 
        SEARCH: '/index_api/search',
        USER_PROFILE: '/index_api/user',
        SEND_MESSAGE: '/ajax_api/send_message',
        LOAD_MESSAGES: '/ajax_api/load_messages',
        LOAD_CONTACTS: '/ajax_api/load_contacts',
        UPLOAD_PHOTO: '/ajax_api/upload_photo'
    }
};

// Global state
let currentUser = null;
let sessionId = null;

// Utility functions
function showLoading(show = true) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Добавляем стили
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
        background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
    `;
    
    document.body.appendChild(notification);
    
    // Убираем через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Функция для вызова Spice API через наш proxy
async function callSpiceAPI(endpoint, params = {}, method = 'POST') {
    try {
        showLoading(true);
        
        const response = await fetch(API_CONFIG.PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                endpoint: endpoint,
                method: method,
                params: params
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка API');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message || 'Ошибка соединения с сервером', 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

// Функции для работы с API

// Регистрация пользователя
async function register(formData) {
    try {
        const params = {
            login: formData.nickname,
            pass: formData.password,
            mail: formData.email,
            sex: formData.gender, // 1=мужчина, 2=женщина, 3=пара
            cherche1: formData.lookingFor || 2, // Кого ищем
            year: new Date().getFullYear() - (formData.age || 25),
            month: 1,
            day: 1,
            ip_adress: '127.0.0.1', // Заменить на реальный IP
            city: 1, // ID города (нужно получить через getRegionsAutocomp)
            region: 1, // ID региона  
            countryObj: 1, // ID страны
            'fast-part': '1' // Быстрая регистрация
        };

        const result = await callSpiceAPI(API_CONFIG.ENDPOINTS.REGISTER, params);
        
        if (result.accepted === 1 && result.session_id) {
            sessionId = result.session_id;
            showNotification('Регистрация успешна!', 'success');
            return { success: true, session_id: result.session_id };
        } else {
            throw new Error(result.error || 'Ошибка регистрации');
        }
    } catch (error) {
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
}

// Вход пользователя
async function login(nickname, password) {
    try {
        const params = {
            login: nickname,
            pass: password
        };

        const result = await callSpiceAPI(API_CONFIG.ENDPOINTS.LOGIN, params);
        
        if (result.connected === 1 && result.session_id) {
            sessionId = result.session_id;
            currentUser = {
                id: result.user_id,
                nickname: nickname
            };
            
            showNotification('Вход выполнен успешно!', 'success');
            return { success: true, user: currentUser };
        } else {
            throw new Error('Неверный логин или пароль');
        }
    } catch (error) {
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
}

// Поиск пользователей
async function searchUsers(filters = {}) {
    try {
        if (!sessionId) {
            throw new Error('Необходимо войти в систему');
        }

        const params = {
            session_id: sessionId,
            sex: filters.gender || null, // 1=мужчина, 2=женщина, 3=пара
            age_from: filters.ageFrom || null,
            age_to: filters.ageTo || null,
            is_online: filters.onlineOnly ? 1 : 0,
            is_photo: filters.withPhoto ? 1 : 0,
            page: filters.page || 0,
            pas: filters.limit || 12
        };

        // Убираем null значения
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined) {
                delete params[key];
            }
        });

        const result = await callSpiceAPI(API_CONFIG.ENDPOINTS.SEARCH, params);
        
        if (result.connected !== undefined) {
            return {
                success: true,
                users: result.result || [],
                total: result.total || 0,
                pages: result.nb_pages || 0
            };
        } else {
            throw new Error('Ошибка поиска пользователей');
        }
    } catch (error) {
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
}

// Получение профиля пользователя
async function getUserProfile(userId) {
    try {
        if (!sessionId) {
            throw new Error('Необходимо войти в систему');
        }

        const params = {
            session_id: sessionId,
            id: userId
        };

        const result = await callSpiceAPI(API_CONFIG.ENDPOINTS.USER_PROFILE, params);
        
        return { success: true, user: result };
    } catch (error) {
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
}

// Отправка сообщения  
async function sendMessage(recipientId, message) {
    try {
        if (!sessionId) {
            throw new Error('Необходимо войти в систему');
        }

        const params = {
            api_key: 'FROM_ENV', // Будет добавлен в proxy
            session_id: sessionId,
            id: recipientId,
            message: message
        };

        const result = await callSpiceAPI(API_CONFIG.ENDPOINTS.SEND_MESSAGE, params, 'GET');
        
        return { success: true, result: result };
    } catch (error) {
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
}

// UI Event Handlers - Обработчики событий интерфейса

// Показать секцию
function showSection(sectionName) {
    // Скрываем все секции
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Показываем нужную секцию
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Обновляем навигацию
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    const activeNavLink = document.getElementById(`nav-${sectionName}`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }
    
    // Загружаем данные для секции если нужно
    if (sectionName === 'search' && sessionId) {
        loadSearchResults();
    }
}

// Загрузка результатов поиска
async function loadSearchResults(filters = {}) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    searchResults.innerHTML = '<div class="loading">Загрузка пользователей...</div>';
    
    const result = await searchUsers(filters);
    
    if (result.success && result.users) {
        if (result.users.length === 0) {
            searchResults.innerHTML = '<div class="no-results">Пользователи не найдены</div>';
            return;
        }
        
        searchResults.innerHTML = result.users.map(user => `
            <div class="user-card" onclick="showUserProfile('${user.id}')">
                <div class="user-photo">
                    ${user.photo_x ? `<img src="${user.photo_x}" alt="${user.pseudo}">` : '<div class="no-photo">Нет фото</div>'}
                </div>
                <div class="user-info">
                    <h3>${user.pseudo || user.prenom || 'Пользователь'}</h3>
                    <p>Возраст: ${user.age || 'не указан'}</p>
                    <p>Город: ${user.zone_name || 'не указан'}</p>
                    ${user.description ? `<p class="description">${user.description}</p>` : ''}
                    ${user.online === 1 ? '<span class="online-badge">онлайн</span>' : ''}
                </div>
            </div>
        `).join('');
    } else {
        searchResults.innerHTML = '<div class="error">Ошибка загрузки пользователей</div>';
    }
}

// Показать профиль пользователя  
async function showUserProfile(userId) {
    // Здесь можно добавить модальное окно с профилем
    showNotification(`Открытие профиля пользователя ${userId}`, 'info');
}

// Обработчики форм
document.addEventListener('DOMContentLoaded', function() {
    // Обработка формы входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const result = await login(formData.get('nickname'), formData.get('password'));
            
            if (result.success) {
                showSection('home');
            }
        });
    }
    
    // Обработка формы регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const registrationData = {
                nickname: formData.get('nickname'),
                password: formData.get('password'),
                email: formData.get('email'),
                age: parseInt(formData.get('age')) || 25,
                gender: parseInt(formData.get('gender')) || 2,
                city: formData.get('city') || 'Москва'
            };
            
            const result = await register(registrationData);
            
            if (result.success) {
                showSection('home');
            }
        });
    }
    
    // Обработка формы поиска
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const filters = {
                gender: formData.get('gender') ? parseInt(formData.get('gender')) : null,
                ageFrom: formData.get('ageFrom') ? parseInt(formData.get('ageFrom')) : null,
                ageTo: formData.get('ageTo') ? parseInt(formData.get('ageTo')) : null,
                onlineOnly: formData.get('onlineOnly') === 'on',
                withPhoto: formData.get('withPhoto') === 'on'
            };
            
            await loadSearchResults(filters);
        });
    }
    
    // Показываем главную секцию по умолчанию
    showSection('home');
});

// Функции для переключения между авторизацией и регистрацией
function showRegister() {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    
    if (loginSection) loginSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'block';
}

function showLogin() {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    
    if (registerSection) registerSection.style.display = 'none';
    if (loginSection) loginSection.style.display = 'block';
}

// Добавляем функции в глобальную область видимости для использования в HTML
window.showSection = showSection;
window.showUserProfile = showUserProfile;
window.showRegister = showRegister;
window.showLogin = showLogin; 
