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

// Импортируем класс настройки
const DemoUsersSetup = require('./api/setup-demo-users.js');

async function main() {
    try {
        console.log('🔧 Настройка демо-пользователей для матчинга...\n');
        
        const setup = new DemoUsersSetup();
        await setup.setupDemoUsers();
        
        console.log('\n✅ Настройка завершена успешно!');
        console.log('🎯 Теперь Hoopsere является матчем, контактом и другом для DannyGrid1988');
        
    } catch (error) {
        console.error('\n❌ Ошибка при настройке:', error.message);
        process.exit(1);
    }
}

main();
