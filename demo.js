/**
 * Демонстрационный скрипт для SpiceConnect
 * Показывает основные возможности API
 * 
 * Использование:
 * 1. Откройте консоль браузера
 * 2. Выполните: loadScript('demo.js')
 * 3. Используйте функции demo.* для тестирования
 */

const SpiceConnectDemo = {
    // Демонстрационные данные
    demoUsers: [
        {
            id: '1',
            name: 'Анна Петрова',
            age: 28,
            city: 'Москва',
            gender: 2,
            description: 'Люблю путешествовать, читать книги и готовить. Ищу серьезные отношения.',
            photos: ['photo1.jpg'],
            online: true,
            lastSeen: new Date()
        },
        {
            id: '2',
            name: 'Мария Сидорова',
            age: 24,
            city: 'Санкт-Петербург',
            gender: 2,
            description: 'Фотограф и любитель активного отдыха. Занимаюсь йогой и танцами.',
            photos: ['photo2.jpg'],
            online: false,
            lastSeen: new Date(Date.now() - 3600000) // 1 час назад
        },
        {
            id: '3',
            name: 'Елена Кузнецова',
            age: 30,
            city: 'Москва',
            gender: 2,
            description: 'Врач по профессии, люблю кино и театр. Ищу интересного собеседника.',
            photos: ['photo3.jpg'],
            online: true,
            lastSeen: new Date()
        },
        {
            id: '4',
            name: 'Дмитрий Иванов',
            age: 32,
            city: 'Москва',
            gender: 1,
            description: 'IT-специалист, увлекаюсь спортом и музыкой. Хочу найти спутницу жизни.',
            photos: ['photo4.jpg'],
            online: false,
            lastSeen: new Date(Date.now() - 7200000) // 2 часа назад
        }
    ],

    demoMessages: [
        {
            id: '1',
            from: '2',
            to: '1',
            text: 'Привет! Как дела?',
            timestamp: new Date(Date.now() - 3600000),
            read: true
        },
        {
            id: '2',
            from: '1',
            to: '2',
            text: 'Привет! Все отлично, спасибо! А у тебя как?',
            timestamp: new Date(Date.now() - 3400000),
            read: true
        },
        {
            id: '3',
            from: '2',
            to: '1',
            text: 'Тоже хорошо! Что планируешь на выходные?',
            timestamp: new Date(Date.now() - 3200000),
            read: false
        }
    ],

    // Функции для демонстрации API
    async login(email = 'demo@example.com', password = 'demo123') {
        console.log('🔐 Демонстрация авторизации');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        
        // Имитация API запроса
        const response = await this.simulateAPICall('login', {
            email,
            password
        });
        
        console.log('Ответ сервера:', response);
        
        if (response.success) {
            localStorage.setItem('demo_token', response.token);
            console.log('✅ Авторизация успешна!');
            return response;
        } else {
            console.log('❌ Ошибка авторизации');
            return null;
        }
    },

    async register(userData = {}) {
        console.log('👤 Демонстрация регистрации');
        
        const defaultData = {
            email: 'newuser@example.com',
            password: 'newpass123',
            age: 25,
            city: 'Москва',
            gender: 2,
            name: 'Новый Пользователь'
        };
        
        const data = { ...defaultData, ...userData };
        console.log('Данные для регистрации:', data);
        
        const response = await this.simulateAPICall('register', data);
        console.log('Ответ сервера:', response);
        
        if (response.success) {
            console.log('✅ Регистрация успешна!');
            return response;
        } else {
            console.log('❌ Ошибка регистрации');
            return null;
        }
    },

    async searchUsers(filters = {}) {
        console.log('🔍 Демонстрация поиска пользователей');
        
        const defaultFilters = {
            age_min: 18,
            age_max: 35,
            gender: '',
            city: 'Москва'
        };
        
        const searchFilters = { ...defaultFilters, ...filters };
        console.log('Фильтры поиска:', searchFilters);
        
        // Фильтрация демонстрационных данных
        let results = this.demoUsers.filter(user => {
            let matches = true;
            
            if (searchFilters.age_min && user.age < searchFilters.age_min) matches = false;
            if (searchFilters.age_max && user.age > searchFilters.age_max) matches = false;
            if (searchFilters.gender && user.gender !== parseInt(searchFilters.gender)) matches = false;
            if (searchFilters.city && user.city !== searchFilters.city) matches = false;
            
            return matches;
        });
        
        console.log(`Найдено пользователей: ${results.length}`);
        console.table(results);
        
        return {
            success: true,
            users: results,
            total: results.length
        };
    },

    async loadMessages(userId = '2') {
        console.log('💬 Демонстрация загрузки сообщений');
        console.log(`Загружаем сообщения с пользователем ID: ${userId}`);
        
        const messages = this.demoMessages.filter(msg => 
            (msg.from === userId || msg.to === userId)
        );
        
        console.log(`Найдено сообщений: ${messages.length}`);
        console.table(messages);
        
        return {
            success: true,
            messages: messages.map(msg => ({
                ...msg,
                own: msg.from === '1' // Текущий пользователь
            }))
        };
    },

    async sendMessage(userId, messageText) {
        console.log('📤 Демонстрация отправки сообщения');
        console.log(`Получатель: ${userId}`);
        console.log(`Сообщение: ${messageText}`);
        
        const newMessage = {
            id: Date.now().toString(),
            from: '1', // Текущий пользователь
            to: userId,
            text: messageText,
            timestamp: new Date(),
            read: false
        };
        
        this.demoMessages.push(newMessage);
        
        console.log('✅ Сообщение отправлено!');
        console.log('Новое сообщение:', newMessage);
        
        return {
            success: true,
            message: newMessage
        };
    },

    async updateProfile(profileData = {}) {
        console.log('✏️ Демонстрация обновления профиля');
        
        const defaultProfile = {
            name: 'Обновленное имя',
            age: 26,
            city: 'Санкт-Петербург',
            description: 'Обновленное описание профиля'
        };
        
        const data = { ...defaultProfile, ...profileData };
        console.log('Данные для обновления:', data);
        
        const response = await this.simulateAPICall('updateProfile', data);
        console.log('Ответ сервера:', response);
        
        if (response.success) {
            console.log('✅ Профиль обновлен!');
            return response;
        } else {
            console.log('❌ Ошибка обновления профиля');
            return null;
        }
    },

    async uploadPhoto(file) {
        console.log('📸 Демонстрация загрузки фотографии');
        
        if (!file) {
            console.log('Создаем демонстрационный файл...');
            file = new File(['demo content'], 'demo.jpg', { type: 'image/jpeg' });
        }
        
        console.log('Файл для загрузки:', {
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        // Имитация загрузки
        console.log('Загрузка файла...');
        await this.delay(2000);
        
        console.log('✅ Фотография загружена!');
        
        return {
            success: true,
            photo: {
                id: Date.now().toString(),
                url: 'https://example.com/photo.jpg',
                name: file.name,
                size: file.size
            }
        };
    },

    // Вспомогательные функции
    async simulateAPICall(endpoint, data) {
        console.log(`🌐 API вызов: ${endpoint}`);
        console.log('Данные запроса:', data);
        
        // Имитация задержки сети
        await this.delay(500 + Math.random() * 1000);
        
        // Имитация ответа сервера
        return {
            success: true,
            endpoint,
            data,
            timestamp: new Date(),
            token: `demo_token_${Date.now()}`
        };
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Демонстрация полного сценария использования
    async fullDemo() {
        console.log('🚀 Запуск полной демонстрации SpiceConnect');
        console.log('===========================================');
        
        try {
            // 1. Авторизация
            console.log('\n1. Авторизация пользователя...');
            await this.login();
            
            // 2. Поиск пользователей
            console.log('\n2. Поиск пользователей...');
            const searchResult = await this.searchUsers({
                age_min: 20,
                age_max: 30,
                city: 'Москва'
            });
            
            // 3. Загрузка сообщений
            console.log('\n3. Загрузка сообщений...');
            await this.loadMessages('2');
            
            // 4. Отправка сообщения
            console.log('\n4. Отправка сообщения...');
            await this.sendMessage('2', 'Привет! Как дела?');
            
            // 5. Обновление профиля
            console.log('\n5. Обновление профиля...');
            await this.updateProfile({
                name: 'Демо Пользователь',
                description: 'Тестирую функциональность приложения'
            });
            
            // 6. Загрузка фотографии
            console.log('\n6. Загрузка фотографии...');
            await this.uploadPhoto();
            
            console.log('\n✅ Демонстрация завершена успешно!');
            console.log('===========================================');
            
        } catch (error) {
            console.error('❌ Ошибка в демонстрации:', error);
        }
    },

    // Информация о доступных функциях
    help() {
        console.log(`
🎯 SpiceConnect Demo - Доступные функции:

📋 Основные функции:
• demo.login(email, password) - Авторизация
• demo.register(userData) - Регистрация
• demo.searchUsers(filters) - Поиск пользователей
• demo.loadMessages(userId) - Загрузка сообщений
• demo.sendMessage(userId, text) - Отправка сообщения
• demo.updateProfile(data) - Обновление профиля
• demo.uploadPhoto(file) - Загрузка фотографии

🚀 Демонстрация:
• demo.fullDemo() - Полная демонстрация всех функций
• demo.help() - Показать эту справку

📊 Данные:
• demo.demoUsers - Демонстрационные пользователи
• demo.demoMessages - Демонстрационные сообщения

Примеры использования:
demo.login('user@example.com', 'password123');
demo.searchUsers({ age_min: 25, age_max: 35, city: 'Москва' });
demo.sendMessage('2', 'Привет! Как дела?');
        `);
    }
};

// Экспорт для использования в консоли
if (typeof window !== 'undefined') {
    window.demo = SpiceConnectDemo;
    
    // Автоматически показать справку при загрузке
    console.log('🎯 SpiceConnect Demo загружен!');
    console.log('Используйте demo.help() для получения справки');
    console.log('Или demo.fullDemo() для полной демонстрации');
}

// Экспорт для Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpiceConnectDemo;
} 