// Конфигурация API
const API_CONFIG = {
    BASE_URL: 'https://api.jetsetrdv.com',
    API_KEY: 'YOUR_API_KEY_HERE', // Замените на ваш API ключ
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

// API запросы
async function makeAPIRequest(endpoint, method = 'GET', data = null) {
    const url = API_CONFIG.BASE_URL + endpoint;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${API_CONFIG.API_KEY}:${localStorage.getItem('user_password') || ''}`
        }
    };
    
    if (data) {
        if (method === 'GET') {
            const params = new URLSearchParams(data);
            url += '?' + params.toString();
        } else {
            options.body = JSON.stringify(data);
        }
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Функции авторизации
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Для демонстрации - используем заглушку
        // В реальном проекте здесь был бы вызов API
        const response = await simulateAPICall({
            email: email,
            password: password
        });
        
        if (response.success) {
            localStorage.setItem('user_token', response.token);
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_password', password);
            
            isAuthenticated = true;
            showMainApp();
            showNotification('Успешная авторизация!', 'success');
        } else {
            showNotification('Неверный email или пароль', 'error');
        }
    } catch (error) {
        showNotification('Ошибка авторизации', 'error');
    } finally {
        hideLoading();
    }
}

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
        // Для демонстрации - используем заглушку
        const response = await simulateAPICall({
            email: email,
            password: password,
            age: age,
            city: city,
            gender: gender
        });
        
        if (response.success) {
            localStorage.setItem('user_token', response.token);
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_password', password);
            
            isAuthenticated = true;
            showMainApp();
            showNotification('Регистрация успешна!', 'success');
        } else {
            showNotification('Ошибка регистрации', 'error');
        }
    } catch (error) {
        showNotification('Ошибка регистрации', 'error');
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

// Загрузка профиля пользователя
async function loadUserProfile() {
    try {
        // Для демонстрации - используем заглушку
        const response = await simulateAPICall({
            action: 'get_profile'
        });
        
        if (response.success) {
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
        document.getElementById('profile-name').value = currentUser.name || '';
        document.getElementById('profile-age').value = currentUser.age || '';
        document.getElementById('profile-city').value = currentUser.city || '';
        document.getElementById('profile-description').value = currentUser.description || '';
    }
}

// Обновление профиля
async function updateProfile() {
    const name = document.getElementById('profile-name').value;
    const age = document.getElementById('profile-age').value;
    const city = document.getElementById('profile-city').value;
    const description = document.getElementById('profile-description').value;
    
    showLoading();
    
    try {
        // Для демонстрации - используем заглушку
        const response = await simulateAPICall({
            action: 'update_profile',
            name: name,
            age: age,
            city: city,
            description: description
        });
        
        if (response.success) {
            showNotification('Профиль успешно обновлен!', 'success');
            currentUser = { ...currentUser, name, age, city, description };
        } else {
            showNotification('Ошибка обновления профиля', 'error');
        }
    } catch (error) {
        showNotification('Ошибка обновления профиля', 'error');
    } finally {
        hideLoading();
    }
}

// Поиск пользователей
async function searchUsers() {
    const ageMin = document.getElementById('search-age-min').value;
    const ageMax = document.getElementById('search-age-max').value;
    const gender = document.getElementById('search-gender').value;
    const city = document.getElementById('search-city').value;
    
    showLoading();
    
    try {
        // Для демонстрации - используем заглушку
        const response = await simulateAPICall({
            action: 'search_users',
            age_min: ageMin,
            age_max: ageMax,
            gender: gender,
            city: city
        });
        
        if (response.success) {
            displaySearchResults(response.users);
        } else {
            showNotification('Ошибка поиска', 'error');
        }
    } catch (error) {
        showNotification('Ошибка поиска', 'error');
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
                <i class="fas fa-user"></i>
            </div>
            <div class="user-info">
                <h3>${user.name}</h3>
                <p><i class="fas fa-birthday-cake"></i> ${user.age} лет</p>
                <p><i class="fas fa-map-marker-alt"></i> ${user.city}</p>
                <p>${user.description || 'Нет описания'}</p>
                <div class="user-actions">
                    <button class="btn-secondary" onclick="sendMessageToUser('${user.id}')">
                        <i class="fas fa-envelope"></i> Написать
                    </button>
                    <button class="btn-secondary" onclick="likeUser('${user.id}')">
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
    // Добавить пользователя в список контактов и открыть чат
    await loadContacts();
    selectChatUser(userId);
}

// Лайк пользователя
async function likeUser(userId) {
    try {
        // Для демонстрации - используем заглушку
        const response = await simulateAPICall({
            action: 'like_user',
            user_id: userId
        });
        
        if (response.success) {
            showNotification('Лайк отправлен!', 'success');
        } else {
            showNotification('Ошибка отправки лайка', 'error');
        }
    } catch (error) {
        showNotification('Ошибка отправки лайка', 'error');
    }
}

// Загрузка контактов
async function loadContacts() {
    try {
        // Для демонстрации - используем заглушку
        const response = await simulateAPICall({
            action: 'load_contacts'
        });
        
        if (response.success) {
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
        contactItem.onclick = () => selectChatUser(contact.id);
        contactItem.innerHTML = `
            <div class="contact-avatar">
                ${contact.name.charAt(0).toUpperCase()}
            </div>
            <div class="contact-info">
                <div class="contact-name">${contact.name}</div>
                <div class="contact-last-message">${contact.lastMessage || 'Нет сообщений'}</div>
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

// Загрузка сообщений
async function loadMessages(userId) {
    try {
        // Для демонстрации - используем заглушку
        const response = await simulateAPICall({
            action: 'load_messages',
            user_id: userId
        });
        
        if (response.success) {
            displayMessages(response.messages);
            document.getElementById('chat-user-name').textContent = response.userName;
        }
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
    }
}

// Отображение сообщений
function displayMessages(messages) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.own ? 'own' : ''}`;
        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${message.text}
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
    });
    
    // Прокрутить к последнему сообщению
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Отправка сообщения
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    
    if (!messageText || !selectedChatUser) {
        return;
    }
    
    try {
        // Для демонстрации - используем заглушку
        const response = await simulateAPICall({
            action: 'send_message',
            user_id: selectedChatUser,
            message: messageText
        });
        
        if (response.success) {
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
            showNotification('Ошибка отправки сообщения', 'error');
        }
    } catch (error) {
        showNotification('Ошибка отправки сообщения', 'error');
    }
}

// Загрузка фотографии
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
        // Для демонстрации - показываем превью
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoPlaceholder = document.querySelector('.photo-placeholder');
            photoPlaceholder.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        };
        reader.readAsDataURL(file);
        
        showNotification('Фотография загружена!', 'success');
    } catch (error) {
        showNotification('Ошибка загрузки фотографии', 'error');
    } finally {
        hideLoading();
    }
}

// Симуляция API вызова (для демонстрации)
async function simulateAPICall(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (data.email && data.password) {
                // Симуляция авторизации/регистрации
                resolve({
                    success: true,
                    token: 'demo_token_' + Date.now(),
                    user: {
                        id: '1',
                        name: 'Пользователь',
                        email: data.email,
                        age: data.age || 25,
                        city: data.city || 'Москва',
                        description: 'Описание пользователя'
                    }
                });
            } else if (data.action === 'search_users') {
                // Симуляция поиска пользователей
                resolve({
                    success: true,
                    users: [
                        {
                            id: '2',
                            name: 'Анна',
                            age: 28,
                            city: 'Москва',
                            description: 'Люблю путешествовать и читать книги'
                        },
                        {
                            id: '3',
                            name: 'Мария',
                            age: 24,
                            city: 'Санкт-Петербург',
                            description: 'Увлекаюсь фотографией и спортом'
                        },
                        {
                            id: '4',
                            name: 'Елена',
                            age: 30,
                            city: 'Москва',
                            description: 'Люблю готовить и смотреть фильмы'
                        }
                    ]
                });
            } else if (data.action === 'load_contacts') {
                // Симуляция загрузки контактов
                resolve({
                    success: true,
                    contacts: [
                        {
                            id: '2',
                            name: 'Анна',
                            lastMessage: 'Привет! Как дела?'
                        },
                        {
                            id: '3',
                            name: 'Мария',
                            lastMessage: 'Спасибо за лайк!'
                        }
                    ]
                });
            } else if (data.action === 'load_messages') {
                // Симуляция загрузки сообщений
                resolve({
                    success: true,
                    userName: 'Анна',
                    messages: [
                        {
                            id: '1',
                            text: 'Привет! Как дела?',
                            own: false
                        },
                        {
                            id: '2',
                            text: 'Привет! Все отлично, спасибо!',
                            own: true
                        },
                        {
                            id: '3',
                            text: 'Рада это слышать! Что планируешь на выходные?',
                            own: false
                        }
                    ]
                });
            } else {
                // Для всех остальных действий
                resolve({
                    success: true,
                    message: 'Операция выполнена успешно'
                });
            }
        }, 1000);
    });
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