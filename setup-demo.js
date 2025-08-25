#!/usr/bin/env node

/**
 * Простой скрипт для настройки демо-пользователей
 * Запуск: node setup-demo.js
 */

// Проверяем наличие API ключа
if (!process.env.SPICE_API_KEY) {
    console.error('❌ Ошибка: Не установлена переменная окружения SPICE_API_KEY');
    console.log('💡 Установите её командой: export SPICE_API_KEY=your_api_key');
    process.exit(1);
}

const fetch = require('node-fetch');
const API_BASE_URL = 'https://dev2018.de5a7.com';
const API_KEY = process.env.SPICE_API_KEY;

// Данные демо-пользователей
const users = {
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

async function loginUser(username, password) {
    try {
        console.log(`🔐 Авторизация пользователя: ${username}`);
        
        const response = await fetch(`${API_BASE_URL}/ajax_api/login?api_key=${API_KEY}`, {
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
            console.log(`✅ Пользователь ${username} успешно авторизован`);
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

async function addContact(fromSessionId, toUserId) {
    try {
        console.log(`👥 Добавление в контакты: ${toUserId}`);
        
        const response = await fetch(`${API_BASE_URL}/ajax_api/setContact?api_key=${API_KEY}`, {
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

async function addFriend(fromSessionId, toUserId) {
    try {
        console.log(`🤝 Добавление в друзья: ${toUserId}`);
        
        const response = await fetch(`${API_BASE_URL}/ajax_api/setFriend?api_key=${API_KEY}`, {
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

async function createMatch(fromSessionId, toUserId) {
    try {
        console.log(`💖 Создание матча (лайк): ${toUserId}`);
        
        const response = await fetch(`${API_BASE_URL}/index_api/match?api_key=${API_KEY}`, {
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

async function main() {
    try {
        console.log('🔧 Настройка демо-пользователей для матчинга...\n');
        
        // 1. Авторизация обоих пользователей
        console.log('=== ЭТАП 1: АВТОРИЗАЦИЯ ===');
        const dannyLogin = await loginUser(users.danny.username, users.danny.password);
        if (!dannyLogin.success) {
            throw new Error(`Не удалось авторизовать ${users.danny.username}`);
        }
        users.danny.sessionId = dannyLogin.sessionId;
        users.danny.userId = dannyLogin.userId;

        const hoopsereLogin = await loginUser(users.hoopsere.username, users.hoopsere.password);
        if (!hoopsereLogin.success) {
            throw new Error(`Не удалось авторизовать ${users.hoopsere.username}`);
        }
        users.hoopsere.sessionId = hoopsereLogin.sessionId;
        users.hoopsere.userId = hoopsereLogin.userId;

        console.log('✅ Оба пользователя успешно авторизованы\n');

        // 2. Добавление Hoopsere в контакты Danny
        console.log('=== ЭТАП 2: ДОБАВЛЕНИЕ В КОНТАКТЫ ===');
        await addContact(users.danny.sessionId, users.hoopsere.userId);

        // 3. Добавление Hoopsere в друзья Danny
        console.log('\n=== ЭТАП 3: ДОБАВЛЕНИЕ В ДРУЗЬЯ ===');
        await addFriend(users.danny.sessionId, users.hoopsere.userId);

        // 4. Создание взаимных лайков для матча
        console.log('\n=== ЭТАП 4: СОЗДАНИЕ МАТЧА ===');
        await createMatch(users.danny.sessionId, users.hoopsere.userId);
        await createMatch(users.hoopsere.sessionId, users.danny.userId);

        console.log('\n🎉 Настройка демо-пользователей завершена успешно!');
        console.log(`✅ ${users.hoopsere.username} теперь является контактом, другом и матчем для ${users.danny.username}`);
        
    } catch (error) {
        console.error('\n❌ Ошибка при настройке:', error.message);
        process.exit(1);
    }
}

main();