/**
 * Скрипт для настройки связей между демо-пользователями
 * DannyGrid1988 и Hoopsere
 */

const API_BASE_URL = 'https://dev2018.de5a7.com';

class DemoUsersSetup {
    constructor() {
        this.apiKey = process.env.SPICE_API_KEY;
        if (!this.apiKey) {
            throw new Error('SPICE_API_KEY environment variable is required');
        }
        
        // Данные демо-пользователей
        this.users = {
            danny: {
                username: 'DannyGrid1988',
                password: 'xigryf-jorFet-dyfry3',
                sessionId: null,
                userId: null
            },
            hoopsere: {
                username: 'Hoopsere', 
                password: 'vyrpu8-maCcex-rabsad',
                sessionId: null,
                userId: null
            }
        };
    }

    /**
     * Авторизация пользователя
     */
    async loginUser(username, password) {
        try {
            console.log(`🔐 Авторизация пользователя: ${username}`);
            
            const response = await fetch(`${API_BASE_URL}/ajax_api/login?api_key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    pseudo: username,
                    password: password
                })
            });

            const result = await response.json();
            console.log(`📊 Результат авторизации ${username}:`, result);

            if (result.result === 'ok' && result.session_id) {
                return {
                    sessionId: result.session_id,
                    userId: result.id,
                    success: true
                };
            } else {
                console.error(`❌ Ошибка авторизации ${username}:`, result);
                return { success: false, error: result };
            }
        } catch (error) {
            console.error(`❌ Ошибка при авторизации ${username}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Добавление в контакты
     */
    async addContact(fromSessionId, toUserId) {
        try {
            console.log(`👥 Добавление в контакты: ${toUserId}`);
            
            const response = await fetch(`${API_BASE_URL}/ajax_api/setContact?api_key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    session_id: fromSessionId,
                    id_user: toUserId,
                    action: 'add'
                })
            });

            const result = await response.json();
            console.log(`📊 Результат добавления в контакты:`, result);
            return result;
        } catch (error) {
            console.error(`❌ Ошибка добавления в контакты:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Добавление в друзья
     */
    async addFriend(fromSessionId, toUserId) {
        try {
            console.log(`🤝 Добавление в друзья: ${toUserId}`);
            
            const response = await fetch(`${API_BASE_URL}/ajax_api/setFriend?api_key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    session_id: fromSessionId,
                    id_user: toUserId,
                    action: 'add'
                })
            });

            const result = await response.json();
            console.log(`📊 Результат добавления в друзья:`, result);
            return result;
        } catch (error) {
            console.error(`❌ Ошибка добавления в друзья:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Создание матча (лайк)
     */
    async createMatch(fromSessionId, toUserId) {
        try {
            console.log(`💖 Создание матча (лайк): ${toUserId}`);
            
            const response = await fetch(`${API_BASE_URL}/index_api/match?api_key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    session_id: fromSessionId,
                    action: 'set_like',
                    id_user: toUserId
                })
            });

            const result = await response.json();
            console.log(`📊 Результат создания матча:`, result);
            return result;
        } catch (error) {
            console.error(`❌ Ошибка создания матча:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Получение информации о пользователе по имени
     */
    async getUserByName(sessionId, username) {
        try {
            console.log(`🔍 Поиск пользователя: ${username}`);
            
            const response = await fetch(`${API_BASE_URL}/index_api/search?api_key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    session_id: sessionId,
                    nick: username,
                    page: 1
                })
            });

            const result = await response.json();
            console.log(`📊 Результат поиска ${username}:`, result);
            
            if (result.result && result.result.length > 0) {
                const user = result.result.find(u => u.pseudo === username);
                if (user) {
                    return { success: true, user };
                }
            }
            
            return { success: false, error: 'User not found' };
        } catch (error) {
            console.error(`❌ Ошибка поиска пользователя ${username}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Основной метод настройки связей
     */
    async setupDemoUsers() {
        console.log('🚀 Начинаем настройку демо-пользователей...\n');

        try {
            // 1. Авторизация обоих пользователей
            console.log('=== ЭТАП 1: АВТОРИЗАЦИЯ ===');
            const dannyLogin = await this.loginUser(this.users.danny.username, this.users.danny.password);
            if (!dannyLogin.success) {
                throw new Error(`Не удалось авторизовать ${this.users.danny.username}`);
            }
            this.users.danny.sessionId = dannyLogin.sessionId;
            this.users.danny.userId = dannyLogin.userId;

            const hoopsereLogin = await this.loginUser(this.users.hoopsere.username, this.users.hoopsere.password);
            if (!hoopsereLogin.success) {
                throw new Error(`Не удалось авторизовать ${this.users.hoopsere.username}`);
            }
            this.users.hoopsere.sessionId = hoopsereLogin.sessionId;
            this.users.hoopsere.userId = hoopsereLogin.userId;

            console.log('✅ Оба пользователя успешно авторизованы\n');

            // 2. Поиск пользователей для получения их ID
            console.log('=== ЭТАП 2: ПОИСК ПОЛЬЗОВАТЕЛЕЙ ===');
            const hoopsereSearch = await this.getUserByName(this.users.danny.sessionId, this.users.hoopsere.username);
            if (!hoopsereSearch.success) {
                console.log('⚠️ Не удалось найти Hoopsere через поиск, используем ID из авторизации');
            } else {
                this.users.hoopsere.userId = hoopsereSearch.user.id;
                console.log(`✅ Найден пользователь Hoopsere с ID: ${this.users.hoopsere.userId}`);
            }

            // 3. Добавление Hoopsere в контакты Danny
            console.log('\n=== ЭТАП 3: ДОБАВЛЕНИЕ В КОНТАКТЫ ===');
            await this.addContact(this.users.danny.sessionId, this.users.hoopsere.userId);

            // 4. Добавление Hoopsere в друзья Danny
            console.log('\n=== ЭТАП 4: ДОБАВЛЕНИЕ В ДРУЗЬЯ ===');
            await this.addFriend(this.users.danny.sessionId, this.users.hoopsere.userId);

            // 5. Создание взаимных лайков для матча
            console.log('\n=== ЭТАП 5: СОЗДАНИЕ МАТЧА ===');
            await this.createMatch(this.users.danny.sessionId, this.users.hoopsere.userId);
            await this.createMatch(this.users.hoopsere.sessionId, this.users.danny.userId);

            console.log('\n🎉 Настройка демо-пользователей завершена успешно!');
            console.log(`✅ ${this.users.hoopsere.username} теперь является контактом, другом и матчем для ${this.users.danny.username}`);

        } catch (error) {
            console.error('\n❌ Ошибка при настройке демо-пользователей:', error);
            throw error;
        }
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DemoUsersSetup;
}

// Запуск если файл вызван напрямую
if (typeof require !== 'undefined' && require.main === module) {
    const setup = new DemoUsersSetup();
    setup.setupDemoUsers().catch(console.error);
}
