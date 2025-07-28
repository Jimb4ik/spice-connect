// SpiceConnect - Основное приложение (Live версия)

// API Configuration
const API_CONFIG = {
    PROXY_URL: '/api/spice-proxy', // Наша serverless функция
    ENDPOINTS: {
        REGISTER: '/api/v2/register',
        LOGIN: '/api/v2/login', 
        SEARCH_USERS: '/api/v2/users/search',
        GET_PROFILE: '/api/v2/users/profile',
        UPDATE_PROFILE: '/api/v2/users/profile/update',
        SEND_MESSAGE: '/api/v2/messages/send',
        GET_MESSAGES: '/api/v2/messages/get',
        UPLOAD_PHOTO: '/api/v2/users/photo/upload'
    }
};

// Global state
let currentUser = null;
let authToken = null;

// Utility functions
function showLoading(show = true) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'flex' : 'none';
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
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// API call function - теперь использует serverless функцию
async function apiCall(endpoint, method = 'POST', data = null) {
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
                body: data
            })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Ошибка API');
        }
        
        return result;
        
    } catch (error) {
        console.error('API Error:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

// Authentication functions
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.LOGIN, 'POST', {
            email: email,
            password: password
        });

        if (response.success) {
            authToken = response.token;
            currentUser = response.user;
            
            // Сохраняем токен в локальном хранилище
            localStorage.setItem('spice_token', authToken);
            localStorage.setItem('spice_user', JSON.stringify(currentUser));
            
            showApp();
            showNotification('Добро пожаловать!', 'success');
        }
    } catch (error) {
        showNotification('Ошибка входа. Проверьте данные.', 'error');
    }
}

async function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const age = document.getElementById('register-age').value;
    const city = document.getElementById('register-city').value;

    if (!name || !email || !password || !age || !city) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.REGISTER, 'POST', {
            name: name,
            email: email,
            password: password,
            age: parseInt(age),
            city: city
        });

        if (response.success) {
            showNotification('Регистрация успешна! Войдите в аккаунт.', 'success');
            showLogin();
        }
    } catch (error) {
        showNotification('Ошибка регистрации. Попробуйте другой email.', 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('spice_token');
    localStorage.removeItem('spice_user');
    
    document.getElementById('app').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
    
    showNotification('Вы вышли из аккаунта', 'info');
}

// UI functions
function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
}

function showRegister() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
}

function showApp() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    
    // Обновляем информацию пользователя
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name || 'Пользователь';
        document.getElementById('profile-name').textContent = currentUser.name || 'Пользователь';
        document.getElementById('profile-details').textContent = 
            `${currentUser.age} лет, ${currentUser.city}`;
    }
    
    // Показываем кнопку выхода
    document.getElementById('nav-logout').style.display = 'block';
}

function showSection(sectionName) {
    // Скрываем все секции
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Убираем активный класс у всех навигационных ссылок
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Показываем выбранную секцию
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Делаем активной соответствующую навигационную ссылку
    const activeNavLink = document.getElementById(`nav-${sectionName}`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }
}

// Search functions
async function searchUsers() {
    const ageMin = document.getElementById('search-age-min').value;
    const ageMax = document.getElementById('search-age-max').value;
    const city = document.getElementById('search-city').value;

    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.SEARCH_USERS, 'POST', {
            age_min: parseInt(ageMin) || 18,
            age_max: parseInt(ageMax) || 100,
            city: city || '',
            limit: 20
        });

        if (response.success && response.users) {
            displaySearchResults(response.users);
        } else {
            showNotification('Пользователи не найдены', 'info');
            displaySearchResults([]);
        }
    } catch (error) {
        showNotification('Ошибка поиска пользователей', 'error');
        displaySearchResults([]);
    }
}

function displaySearchResults(users) {
    const resultsContainer = document.getElementById('search-results');
    
    if (!users || users.length === 0) {
        resultsContainer.innerHTML = '<p class="no-data">Пользователи не найдены. Попробуйте изменить параметры поиска.</p>';
        return;
    }
    
    const usersHTML = users.map(user => `
        <div class="user-card">
            <div class="user-avatar">
                ${user.photo_url ? 
                    `<img src="${user.photo_url}" alt="${user.name}">` : 
                    `<div class="avatar-placeholder">${user.name.charAt(0)}</div>`
                }
            </div>
            <div class="user-info">
                <h3>${user.name}</h3>
                <p class="user-details">${user.age} лет, ${user.city}</p>
                <p class="user-description">${user.description || 'Нет описания'}</p>
                <div class="user-actions">
                    <button class="btn btn-primary" onclick="sendMessage('${user.id}', '${user.name}')">
                        💌 Написать
                    </button>
                    <button class="btn btn-secondary" onclick="likeUser('${user.id}')">
                        ❤️ Лайк
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = usersHTML;
}

// Message functions
async function sendMessage(userId, userName) {
    const message = prompt(`Отправить сообщение пользователю ${userName}:`);
    
    if (!message) return;
    
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.SEND_MESSAGE, 'POST', {
            recipient_id: userId,
            message: message
        });

        if (response.success) {
            showNotification(`Сообщение отправлено пользователю ${userName}`, 'success');
        }
    } catch (error) {
        showNotification('Ошибка отправки сообщения', 'error');
    }
}

async function likeUser(userId) {
    try {
        const response = await apiCall('/api/v2/users/like', 'POST', {
            user_id: userId
        });

        if (response.success) {
            showNotification('Лайк отправлен!', 'success');
        }
    } catch (error) {
        showNotification('Ошибка отправки лайка', 'error');
    }
}

// Profile functions
function editProfile() {
    showNotification('Редактирование профиля будет доступно в следующих версиях', 'info');
}

async function updateProfile() {
    // Эта функция будет реализована позже
    showNotification('Функция обновления профиля в разработке', 'info');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем сохраненную авторизацию
    const savedToken = localStorage.getItem('spice_token');
    const savedUser = localStorage.getItem('spice_user');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showApp();
    }
    
    // Обработчики форм
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
    
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        register();
    });
    
    // Мобильное меню
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    console.log('✅ SpiceConnect Live версия загружена');
    console.log('🚀 Подключение к реальному API Spice');
}); 