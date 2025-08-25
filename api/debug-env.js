/**
 * Объединенная функция: Debug Environment + Demo Users Setup
 * Отладка окружения и настройка демо-пользователей
 */

class DemoUsersSetup {
    constructor(apiKey, baseUrl = null) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl || process.env.SPICE_BASE_URL || 'https://api.fotochat.com';
        
        if (!this.apiKey) {
            throw new Error('SPICE_API_KEY is required');
        }
        
        console.log(`🔧 [SETUP] Using API Base URL: ${this.baseUrl}`);
        console.log(`🔧 [SETUP] Using API Key: ${this.apiKey.substring(0, 8)}...`);
        
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

    async loginUser(username, password) {
        try {
            const url = `${this.baseUrl}/ajax_api/login?api_key=${this.apiKey}`;
            const body = new URLSearchParams({
                pseudo: username,
                password: password
            });
            
            console.log(`🔐 [LOGIN REQUEST] URL: ${url}`);
            console.log(`🔐 [LOGIN REQUEST] Body: ${body.toString()}`);
            console.log(`🔐 [LOGIN REQUEST] Headers: Content-Type: application/x-www-form-urlencoded`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body
            });

            console.log(`🔐 [LOGIN RESPONSE] Status: ${response.status} ${response.statusText}`);
            console.log(`🔐 [LOGIN RESPONSE] Headers:`, Object.fromEntries(response.headers.entries()));
            
            const result = await response.json();
            console.log(`🔐 [LOGIN RESPONSE] Body:`, JSON.stringify(result, null, 2));
            
            if (result.result === 'ok' && result.session_id) {
                console.log(`✅ [LOGIN SUCCESS] User ${username} logged in with session: ${result.session_id}`);
                return {
                    sessionId: result.session_id,
                    userId: result.id,
                    success: true
                };
            } else {
                console.error(`❌ [LOGIN FAILED] User ${username}:`, result);
                return { success: false, error: result };
            }
        } catch (error) {
            console.error(`❌ [LOGIN ERROR] User ${username}:`, error);
            return { success: false, error: error.message };
        }
    }

    async addContact(fromSessionId, toUserId) {
        try {
            const url = `${this.baseUrl}/ajax_api/setContact?api_key=${this.apiKey}`;
            const body = new URLSearchParams({
                session_id: fromSessionId,
                id_user: toUserId,
                action: 'add'
            });
            
            console.log(`👥 [CONTACT REQUEST] URL: ${url}`);
            console.log(`👥 [CONTACT REQUEST] Body: ${body.toString()}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body
            });

            console.log(`👥 [CONTACT RESPONSE] Status: ${response.status} ${response.statusText}`);
            
            const result = await response.json();
            console.log(`👥 [CONTACT RESPONSE] Body:`, JSON.stringify(result, null, 2));
            
            return result;
        } catch (error) {
            console.error(`❌ [CONTACT ERROR]:`, error);
            return { success: false, error: error.message };
        }
    }

    async addFriend(fromSessionId, toUserId) {
        try {
            const url = `${this.baseUrl}/ajax_api/setFriend?api_key=${this.apiKey}`;
            const body = new URLSearchParams({
                session_id: fromSessionId,
                id_user: toUserId,
                action: 'add'
            });
            
            console.log(`🤝 [FRIEND REQUEST] URL: ${url}`);
            console.log(`🤝 [FRIEND REQUEST] Body: ${body.toString()}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body
            });

            console.log(`🤝 [FRIEND RESPONSE] Status: ${response.status} ${response.statusText}`);
            
            const result = await response.json();
            console.log(`🤝 [FRIEND RESPONSE] Body:`, JSON.stringify(result, null, 2));
            
            return result;
        } catch (error) {
            console.error(`❌ [FRIEND ERROR]:`, error);
            return { success: false, error: error.message };
        }
    }

    async createMatch(fromSessionId, toUserId) {
        try {
            const url = `${this.baseUrl}/index_api/match?api_key=${this.apiKey}`;
            const body = new URLSearchParams({
                session_id: fromSessionId,
                action: 'set_like',
                id_user: toUserId
            });
            
            console.log(`💖 [MATCH REQUEST] URL: ${url}`);
            console.log(`💖 [MATCH REQUEST] Body: ${body.toString()}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body
            });

            console.log(`💖 [MATCH RESPONSE] Status: ${response.status} ${response.statusText}`);
            
            const result = await response.json();
            console.log(`💖 [MATCH RESPONSE] Body:`, JSON.stringify(result, null, 2));
            
            return result;
        } catch (error) {
            console.error(`❌ [MATCH ERROR]:`, error);
            return { success: false, error: error.message };
        }
    }

    async setupDemoUsers() {
        const logs = [];
        
        try {
            console.log('🚀 [SETUP] Начинаем настройку демо-пользователей...');
            logs.push('🚀 Начинаем настройку демо-пользователей...');
            
            // 1. Авторизация
            console.log('🚀 [SETUP] === ЭТАП 1: АВТОРИЗАЦИЯ ===');
            logs.push('=== ЭТАП 1: АВТОРИЗАЦИЯ ===');
            
            console.log(`🚀 [SETUP] Авторизуем ${this.users.danny.username}...`);
            const dannyLogin = await this.loginUser(this.users.danny.username, this.users.danny.password);
            if (!dannyLogin.success) {
                const errorMsg = `Не удалось авторизовать ${this.users.danny.username}: ${JSON.stringify(dannyLogin.error)}`;
                console.error(`❌ [SETUP] ${errorMsg}`);
                throw new Error(errorMsg);
            }
            this.users.danny.sessionId = dannyLogin.sessionId;
            this.users.danny.userId = dannyLogin.userId;
            console.log(`✅ [SETUP] ${this.users.danny.username} авторизован (ID: ${dannyLogin.userId}, Session: ${dannyLogin.sessionId})`);
            logs.push(`✅ ${this.users.danny.username} авторизован`);

            console.log(`🚀 [SETUP] Авторизуем ${this.users.hoopsere.username}...`);
            const hoopsereLogin = await this.loginUser(this.users.hoopsere.username, this.users.hoopsere.password);
            if (!hoopsereLogin.success) {
                const errorMsg = `Не удалось авторизовать ${this.users.hoopsere.username}: ${JSON.stringify(hoopsereLogin.error)}`;
                console.error(`❌ [SETUP] ${errorMsg}`);
                throw new Error(errorMsg);
            }
            this.users.hoopsere.sessionId = hoopsereLogin.sessionId;
            this.users.hoopsere.userId = hoopsereLogin.userId;
            console.log(`✅ [SETUP] ${this.users.hoopsere.username} авторизован (ID: ${hoopsereLogin.userId}, Session: ${hoopsereLogin.sessionId})`);
            logs.push(`✅ ${this.users.hoopsere.username} авторизован`);

            // 2. Добавление в контакты
            console.log('🚀 [SETUP] === ЭТАП 2: ДОБАВЛЕНИЕ В КОНТАКТЫ ===');
            logs.push('=== ЭТАП 2: ДОБАВЛЕНИЕ В КОНТАКТЫ ===');
            const contactResult = await this.addContact(this.users.danny.sessionId, this.users.hoopsere.userId);
            console.log(`✅ [SETUP] Контакт добавлен:`, contactResult);
            logs.push(`✅ Контакт добавлен: ${JSON.stringify(contactResult)}`);

            // 3. Добавление в друзья
            console.log('🚀 [SETUP] === ЭТАП 3: ДОБАВЛЕНИЕ В ДРУЗЬЯ ===');
            logs.push('=== ЭТАП 3: ДОБАВЛЕНИЕ В ДРУЗЬЯ ===');
            const friendResult = await this.addFriend(this.users.danny.sessionId, this.users.hoopsere.userId);
            console.log(`✅ [SETUP] Друг добавлен:`, friendResult);
            logs.push(`✅ Друг добавлен: ${JSON.stringify(friendResult)}`);

            // 4. Создание матча
            console.log('🚀 [SETUP] === ЭТАП 4: СОЗДАНИЕ МАТЧА ===');
            logs.push('=== ЭТАП 4: СОЗДАНИЕ МАТЧА ===');
            const match1 = await this.createMatch(this.users.danny.sessionId, this.users.hoopsere.userId);
            console.log(`✅ [SETUP] Матч 1 (Danny -> Hoopsere):`, match1);
            const match2 = await this.createMatch(this.users.hoopsere.sessionId, this.users.danny.userId);
            console.log(`✅ [SETUP] Матч 2 (Hoopsere -> Danny):`, match2);
            logs.push(`✅ Матч создан: ${JSON.stringify(match1)} | ${JSON.stringify(match2)}`);

            console.log('🎉 [SETUP] Настройка завершена успешно!');
            logs.push('🎉 Настройка завершена успешно!');
            
            return {
                success: true,
                message: 'Демо-пользователи настроены успешно',
                logs: logs,
                users: this.users
            };

        } catch (error) {
            console.error('❌ [SETUP] Критическая ошибка:', error);
            logs.push(`❌ Ошибка: ${error.message}`);
            return {
                success: false,
                error: error.message,
                logs: logs
            };
        }
    }
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const API_KEY = process.env.SPICE_API_KEY;
    const BASE_URL = process.env.SPICE_BASE_URL;

    // Если это GET запрос - показываем debug информацию
    if (req.method === 'GET') {
        const debug_info = {
            timestamp: new Date().toISOString(),
            environment_variables: {
                SPICE_API_KEY: {
                    exists: !!API_KEY,
                    length: API_KEY ? API_KEY.length : 0,
                    first_chars: API_KEY ? API_KEY.substring(0, 4) + '...' : 'не найден',
                    last_chars: API_KEY ? '...' + API_KEY.substring(API_KEY.length - 4) : 'не найден'
                },
                SPICE_BASE_URL: {
                    exists: !!BASE_URL,
                    value: BASE_URL || 'не найден'
                }
            },
            request_info: {
                method: req.method,
                url: req.url,
                headers: {
                    'user-agent': req.headers['user-agent'],
                    'host': req.headers['host']
                }
            },
            deployment_info: {
                vercel_env: process.env.VERCEL_ENV || 'не найдено',
                vercel_url: process.env.VERCEL_URL || 'не найдено',
                node_version: process.version
            }
        };

        console.log('🔍 Debug info:', debug_info);

        return res.status(200).json({
            success: true,
            message: 'Debug information (API ключ скрыт для безопасности)',
            ...debug_info
        });
    }

    // Если это POST запрос - запускаем настройку демо-пользователей
    if (req.method === 'POST') {
        if (!API_KEY) {
            return res.status(400).json({
                success: false,
                error: 'SPICE_API_KEY environment variable is required'
            });
        }

        try {
            const setup = new DemoUsersSetup(API_KEY, BASE_URL);
            const result = await setup.setupDemoUsers();
            
            return res.status(200).json(result);
        } catch (error) {
            console.error('Setup error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Неподдерживаемый метод
    return res.status(405).json({
        success: false,
        error: 'Method not allowed. Use GET for debug info or POST for demo setup.'
    });
}