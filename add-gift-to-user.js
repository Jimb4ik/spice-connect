/**
 * Скрипт для добавления подарка пользователю DannyGrid1988
 */

const API_BASE_URL = 'https://api.fotochat.com';
const crypto = require('crypto');

// Данные пользователя
const USER_DATA = {
    username: 'DannyGrid1988',
    password: 'xigryf-jorFet-dyfry3'
};

async function loginUser(apiKey, username, password) {
    try {
        const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
        
        const url = `${API_BASE_URL}/index_api/login?api_key=${apiKey}`;
        const body = new URLSearchParams({
            login: username,
            pass: hashedPassword,
            rememberme: '1'
        });
        
        console.log(`🔐 Авторизуем пользователя ${username}...`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });

        const result = await response.json();
        
        if (result.result === 'ok' && result.session_id) {
            console.log(`✅ Пользователь ${username} авторизован`);
            console.log(`   Session ID: ${result.session_id}`);
            console.log(`   User ID: ${result.user_id || result.id}`);
            return {
                sessionId: result.session_id,
                userId: result.user_id || result.id,
                success: true
            };
        } else {
            console.error(`❌ Ошибка авторизации:`, result);
            return { success: false, error: result };
        }
    } catch (error) {
        console.error(`❌ Ошибка при авторизации:`, error);
        return { success: false, error: error.message };
    }
}

async function getGiftsCatalog() {
    try {
        console.log('📋 Получаем каталог подарков...');
        
        const response = await fetch('/api/database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'get_gifts_catalog'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Каталог подарков получен:');
            result.data.forEach((gift, index) => {
                console.log(`   ${index + 1}. ${gift.name} - ${gift.price_credits} кредитов (ID: ${gift.id})`);
            });
            return result.data;
        } else {
            console.error('❌ Ошибка получения каталога:', result.error);
            return [];
        }
    } catch (error) {
        console.error('❌ Ошибка при получении каталога:', error);
        return [];
    }
}

async function addGiftToUser(giftId, receiverSessionId, receiverUserId, message = 'System gift') {
    try {
        console.log(`🎁 Добавляем подарок (ID: ${giftId}) пользователю...`);
        
        const response = await fetch('/api/database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'purchase_gift',
                gift_id: giftId,
                sender_session_id: 'SYSTEM',
                sender_user_id: 'SYSTEM',
                receiver_session_id: receiverSessionId,
                receiver_user_id: receiverUserId,
                personal_message: message
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Подарок успешно добавлен!');
            console.log('   Детали:', result.data);
            return result;
        } else {
            console.error('❌ Ошибка добавления подарка:', result.error);
            return result;
        }
    } catch (error) {
        console.error('❌ Ошибка при добавлении подарка:', error);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🎁 === ДОБАВЛЕНИЕ ПОДАРКА ПОЛЬЗОВАТЕЛЮ ===\n');
    
    // Проверяем API ключ
    const API_KEY = process.env.SPICE_API_KEY;
    if (!API_KEY) {
        console.error('❌ SPICE_API_KEY не найден в environment variables');
        console.log('   Установите переменную: export SPICE_API_KEY=your_api_key');
        process.exit(1);
    }
    
    try {
        // 1. Авторизуем пользователя
        const loginResult = await loginUser(API_KEY, USER_DATA.username, USER_DATA.password);
        if (!loginResult.success) {
            console.error('❌ Не удалось авторизовать пользователя');
            process.exit(1);
        }
        
        // 2. Получаем каталог подарков
        const gifts = await getGiftsCatalog();
        if (gifts.length === 0) {
            console.error('❌ Каталог подарков пуст');
            process.exit(1);
        }
        
        // 3. Выбираем первый подарок (можно изменить)
        const selectedGift = gifts[0];
        console.log(`\n🎯 Выбран подарок: ${selectedGift.name} (${selectedGift.price_credits} кредитов)`);
        
        // 4. Добавляем подарок пользователю
        const giftResult = await addGiftToUser(
            selectedGift.id,
            loginResult.sessionId,
            loginResult.userId,
            'Подарок от системы для тестирования'
        );
        
        if (giftResult.success) {
            console.log('\n🎉 Подарок успешно добавлен пользователю DannyGrid1988!');
        } else {
            console.error('\n❌ Не удалось добавить подарок');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
        process.exit(1);
    }
}

// Запускаем только если вызван напрямую
if (require.main === module) {
    main();
}

module.exports = { loginUser, getGiftsCatalog, addGiftToUser };
