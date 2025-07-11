// Конфигурация API для PRODUCTION
const API_CONFIG = {
    BASE_URL: 'https://api.jetsetrdv.com',
    API_KEY: 'YOUR_API_KEY_HERE', // 🚨 ЗАМЕНИТЕ НА ВАШ РЕАЛЬНЫЙ API КЛЮЧ
    ENDPOINTS: {
        LOGIN: '/index_api/login',
        REGISTER: '/index_api/subscribe',
        USER: '/index_api/user',
        SEARCH: '/index_api/search',
        SEND_MESSAGE: '/ajax_api/send_message',
        LOAD_MESSAGES: '/ajax_api/load_messages',
        LOAD_CONTACTS: '/ajax_api/load_contacts',
        UPLOAD_PHOTO: '/ajax_api/upload_photo',
        UPDATE_PROFILE: '/index_api/user/modify/informations'
    }
};

// Глобальные переменные
let currentUser = null;
let selectedChatUser = null;
let isAuthenticated = false;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Обработчики событий
    document.getElementById('message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

// Проверка авторизации
function checkAuth() {
    const token = localStorage.getItem('user_token');
    if (token) {
        isAuthenticated = true;
        showMainApp();
    } else {
        showAuthSection();
    }
}

// Показать секцию авторизации
function showAuthSection() {
    hideNavbar();
    showSection('auth-section');
}

// Показать основное приложение
function showMainApp() {
    showNavbar();
    showSection('home');
    loadUserProfile();
}

// Показать/скрыть навигацию
function showNavbar() {
    document.querySelector('.navbar').style.display = 'block';
}

function hideNavbar() {
    document.querySelector('.navbar').style.display = 'none';
}

// Переключение между секциями
function showSection(sectionId) {
    // Скрыть все секции
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Показать нужную секцию
    const targetSection = document.getElementById(sectionId + '-section') || document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Переключение вкладок авторизации
function showAuthTab(tab) {
    // Убрать активный класс со всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Скрыть все формы
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Показать нужную форму и кнопку
    document.querySelector(`[onclick="showAuthTab('${tab}')"]`).classList.add('active');
    document.getElementById(tab + '-form').classList.add('active');
}

// Показать загрузку
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

// Скрыть загрузку
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.getElementById('notifications').appendChild(notification);
    
    // Автоматически удалить через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 🔥 РЕАЛЬНЫЕ API запросы (вместо simulateAPICall)
async function makeAPIRequest(endpoint, method = 'POST', data = null) {
    const url = API_CONFIG.BASE_URL + endpoint;
    
    // Подготовка данных
    let requestData = {
        api_key: API_CONFIG.API_KEY
    };
    
    if (data) {
        requestData = { ...requestData, ...data };
    }

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${API_CONFIG.API_KEY}:${localStorage.getItem('user_password') || ''}`
        }
    };
    
    if (method === 'GET') {
        const params = new URLSearchParams(requestData);
        const finalUrl = url + '?' + params.toString();
        try {
            const response = await fetch(finalUrl, { 
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${API_CONFIG.API_KEY}:`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    } else {
        // POST запрос
        const formData = new URLSearchParams();
        Object.keys(requestData).forEach(key => {
            formData.append(key, requestData[key]);
        });
        
        options.body = formData;
        
        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}

// 🔐 РЕАЛЬНАЯ авторизация
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await makeAPIRequest(API_CONFIG.ENDPOINTS.LOGIN, 'POST', {
            email: email,
            password: password
        });
        
        if (response.statut === 'ok') {
            localStorage.setItem('user_token', response.token || 'logged_in');
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_password', password);
            localStorage.setItem('user_id', response.user_id);
            
            isAuthenticated = true;
            showMainApp();
            showNotification('Успешная авторизация!', 'success');
        } else {
            showNotification(response.message || 'Ошибка авторизации', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Ошибка подключения к серверу', 'error');
    } finally {
        hideLoading();
    }
}

// 📝 РЕАЛЬНАЯ регистрация
async function register() {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const age = document.getElementById('reg-age').value;
    const city = document.getElementById('reg-city').value;
    const gender = document.getElementById('reg-gender').value;
    
    if (!email || !password || !age || !city || !gender) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }
    
    if (age < 18) {
        showNotification('Возраст должен быть не менее 18 лет', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await makeAPIRequest(API_CONFIG.ENDPOINTS.REGISTER, 'POST', {
            email: email,
            password: password,
            age: age,
            city: city,
            sexe: gender
        });
        
        if (response.statut === 'ok') {
            localStorage.setItem('user_token', response.token || 'registered');
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_password', password);
            localStorage.setItem('user_id', response.user_id);
            
            isAuthenticated = true;
            showMainApp();
            showNotification('Регистрация успешна!', 'success');
        } else {
            showNotification(response.message || 'Ошибка регистрации', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showNotification('Ошибка подключения к серверу', 'error');
    } finally {
        hideLoading();
    }
}

function logout() {
    localStorage.clear();
    isAuthenticated = false;
    currentUser = null;
    showAuthSection();
    showNotification('Вы вышли из системы', 'info');
}

// 👤 РЕАЛЬНАЯ загрузка профиля
async function loadUserProfile() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    
    try {
        const response = await makeAPIRequest(API_CONFIG.ENDPOINTS.USER, 'POST', {
            user_id: userId
        });
        
        if (response.statut === 'ok') {
            currentUser = response.user;
            updateProfileForm();
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
}

// Обновление формы профиля
function updateProfileForm() {
    if (currentUser) {
        document.getElementById('profile-name').value = currentUser.pseudo || '';
        document.getElementById('profile-age').value = currentUser.age || '';
        document.getElementById('profile-city').value = currentUser.ville || '';
        document.getElementById('profile-description').value = currentUser.description || '';
    }
}

// ✏️ РЕАЛЬНОЕ обновление профиля
async function updateProfile() {
    const name = document.getElementById('profile-name').value;
    const age = document.getElementById('profile-age').value;
    const city = document.getElementById('profile-city').value;
    const description = document.getElementById('profile-description').value;
    
    showLoading();
    
    try {
        const response = await makeAPIRequest(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, 'POST', {
            pseudo: name,
            age: age,
            ville: city,
            description: description
        });
        
        if (response.statut === 'ok') {
            showNotification('Профиль успешно обновлен!', 'success');
            currentUser = { ...currentUser, pseudo: name, age, ville: city, description };
        } else {
            showNotification(response.message || 'Ошибка обновления профиля', 'error');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showNotification('Ошибка подключения к серверу', 'error');
    } finally {
        hideLoading();
    }
}

// 🔍 РЕАЛЬНЫЙ поиск пользователей
async function searchUsers() {
    const ageMin = document.getElementById('search-age-min').value;
    const ageMax = document.getElementById('search-age-max').value;
    const gender = document.getElementById('search-gender').value;
    const city = document.getElementById('search-city').value;
    
    showLoading();
    
    try {
        const response = await makeAPIRequest(API_CONFIG.ENDPOINTS.SEARCH, 'POST', {
            age_min: ageMin,
            age_max: ageMax,
            sexe: gender,
            ville: city
        });
        
        if (response.statut === 'ok' && response.users) {
            displaySearchResults(response.users);
        } else {
            displaySearchResults([]);
            showNotification('Пользователи не найдены', 'info');
        }
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Ошибка поиска', 'error');
        displaySearchResults([]);
    } finally {
        hideLoading();
    }
}

// Отображение результатов поиска
function displaySearchResults(users) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    if (users.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: #666;">Пользователи не найдены</p>';
        return;
    }
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <div class="user-photo">
                ${user.main_photo ? `<img src="${user.main_photo.sqmiddle}" alt="${user.pseudo}">` : '<i class="fas fa-user"></i>'}
            </div>
            <div class="user-info">
                <h3>${user.pseudo || 'Пользователь'}</h3>
                <p><i class="fas fa-birthday-cake"></i> ${user.age} лет</p>
                <p><i class="fas fa-map-marker-alt"></i> ${user.ville || 'Не указан'}</p>
                <p>${user.description || 'Нет описания'}</p>
                <div class="user-actions">
                    <button class="btn-secondary" onclick="sendMessageToUser('${user.user_id}')">
                        <i class="fas fa-envelope"></i> Написать
                    </button>
                    <button class="btn-secondary" onclick="likeUser('${user.user_id}')">
                        <i class="fas fa-heart"></i> Лайк
                    </button>
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(userCard);
    });
}

// Отправка сообщения пользователю
async function sendMessageToUser(userId) {
    showSection('messages');
    await loadContacts();
    selectChatUser(userId);
}

// 💕 РЕАЛЬНЫЙ лайк пользователя
async function likeUser(userId) {
    try {
        const response = await makeAPIRequest('/ajax_api/setFlash', 'GET', {
            user_id: userId
        });
        
        if (response.statut === 'ok') {
            showNotification('Лайк отправлен!', 'success');
        } else {
            showNotification(response.message || 'Ошибка отправки лайка', 'error');
        }
    } catch (error) {
        console.error('Like error:', error);
        showNotification('Ошибка отправки лайка', 'error');
    }
}

// 📋 РЕАЛЬНАЯ загрузка контактов
async function loadContacts() {
    try {
        const response = await makeAPIRequest(API_CONFIG.ENDPOINTS.LOAD_CONTACTS, 'GET');
        
        if (response.statut === 'ok' && response.contacts) {
            displayContacts(response.contacts);
        }
    } catch (error) {
        console.error('Ошибка загрузки контактов:', error);
    }
}

// Отображение контактов
function displayContacts(contacts) {
    const contactsList = document.getElementById('contacts-list');
    contactsList.innerHTML = '<h3>Контакты</h3>';
    
    contacts.forEach(contact => {
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        contactItem.onclick = () => selectChatUser(contact.user_id);
        contactItem.innerHTML = `
            <div class="contact-avatar">
                ${contact.pseudo ? contact.pseudo.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="contact-info">
                <div class="contact-name">${contact.pseudo || 'Пользователь'}</div>
                <div class="contact-last-message">${contact.last_message || 'Нет сообщений'}</div>
            </div>
        `;
        
        contactsList.appendChild(contactItem);
    });
}

// Выбор пользователя для чата
function selectChatUser(userId) {
    selectedChatUser = userId;
    
    // Обновить активный контакт
    document.querySelectorAll('.contact-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Найти и активировать выбранный контакт
    const selectedContact = document.querySelector(`[onclick*="${userId}"]`);
    if (selectedContact) {
        selectedContact.classList.add('active');
    }
    
    // Загрузить сообщения
    loadMessages(userId);
}

// 💬 РЕАЛЬНАЯ загрузка сообщений
async function loadMessages(userId) {
    try {
        const response = await makeAPIRequest(API_CONFIG.ENDPOINTS.LOAD_MESSAGES, 'GET', {
            user_id: userId
        });
        
        if (response.statut === 'ok' && response.messages) {
            displayMessages(response.messages, response.user_name);
            document.getElementById('chat-user-name').textContent = response.user_name || 'Пользователь';
        }
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
    }
}

// Отображение сообщений
function displayMessages(messages, userName = '') {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    
    const currentUserId = localStorage.getItem('user_id');
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender_id === currentUserId ? 'own' : ''}`;
        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${message.message}
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
    });
    
    // Прокрутить к последнему сообщению
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 📤 РЕАЛЬНАЯ отправка сообщения
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    
    if (!messageText || !selectedChatUser) {
        return;
    }
    
    try {
        const response = await makeAPIRequest(API_CONFIG.ENDPOINTS.SEND_MESSAGE, 'GET', {
            user_id: selectedChatUser,
            message: messageText
        });
        
        if (response.statut === 'ok') {
            // Добавить сообщение в чат
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message own';
            messageDiv.innerHTML = `
                <div class="message-bubble">
                    ${messageText}
                </div>
            `;
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            messageInput.value = '';
            showNotification('Сообщение отправлено!', 'success');
        } else {
            showNotification(response.message || 'Ошибка отправки сообщения', 'error');
        }
    } catch (error) {
        console.error('Send message error:', error);
        showNotification('Ошибка отправки сообщения', 'error');
    }
}

// 📸 РЕАЛЬНАЯ загрузка фотографии
async function uploadPhoto() {
    const fileInput = document.getElementById('photo-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showNotification('Пожалуйста, выберите изображение', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('api_key', API_CONFIG.API_KEY);
        formData.append('photo', file);
        
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.UPLOAD_PHOTO, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Basic ${API_CONFIG.API_KEY}:`
            }
        });
        
        const result = await response.json();
        
        if (result.statut === 'ok') {
            showNotification('Фотография загружена!', 'success');
            
            // Показать превью
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoPlaceholder = document.querySelector('.photo-placeholder');
                photoPlaceholder.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            };
            reader.readAsDataURL(file);
        } else {
            showNotification(result.message || 'Ошибка загрузки фотографии', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Ошибка загрузки фотографии', 'error');
    } finally {
        hideLoading();
    }
}

// Инициализация при загрузке раздела сообщений
document.addEventListener('DOMContentLoaded', function() {
    // Добавить обработчик для автоматической загрузки контактов при переходе в раздел сообщений
    const originalShowSection = window.showSection;
    window.showSection = function(sectionId) {
        originalShowSection.call(this, sectionId);
        
        if (sectionId === 'messages' && isAuthenticated) {
            loadContacts();
        }
    };
}); 