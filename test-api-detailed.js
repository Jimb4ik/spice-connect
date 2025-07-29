// Детальный тест Spice API для выяснения причины 0 профилей
const API_KEY = 'YOUR_REAL_API_KEY_HERE'; // Замените на ваш реальный ключ
const BASE_URL = 'https://api.jetsetrdv.com';

async function detailedAPITest() {
    console.log('🔍 ДЕТАЛЬНЫЙ АНАЛИЗ API ОТВЕТА');
    console.log('================================');
    
    try {
        // Тестируем разные варианты запроса
        const tests = [
            { name: 'Без параметров', force_pays: null },
            { name: 'France (64)', force_pays: 64 },
            { name: 'Spain (28)', force_pays: 28 },
            { name: 'USA (55)', force_pays: 55 }
        ];
        
        for (const test of tests) {
            console.log(`\n🧪 ТЕСТ: ${test.name}`);
            console.log('-'.repeat(40));
            
            // Строим URL
            let url = `${BASE_URL}/index_api/landing_module/profils_global`;
            const params = new URLSearchParams();
            params.append('api_key', API_KEY);
            
            if (test.force_pays) {
                params.append('force_pays', test.force_pays);
            }
            
            const finalUrl = `${url}?${params.toString()}`;
            console.log('📡 URL:', finalUrl.replace(API_KEY, 'HIDDEN_KEY'));
            
            // Авторизация
            const auth = `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`;
            console.log('🔑 Authorization:', `Basic base64(${API_KEY.substring(0, 4)}...)`);
            
            // Запрос
            const response = await fetch(finalUrl, {
                method: 'POST',
                headers: {
                    'Authorization': auth,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);
            
            const data = await response.json();
            
            // Детальный анализ ответа
            console.log('📋 АНАЛИЗ ОТВЕТА:');
            console.log(`   • success: ${data.success}`);
            console.log(`   • total: ${data.total}`);
            console.log(`   • profiles length: ${data.profiles ? data.profiles.length : 'undefined'}`);
            
            // Все ключи верхнего уровня
            console.log(`   • ключи верхнего уровня: ${Object.keys(data).join(', ')}`);
            
            // Поиск массивов
            const arrays = [];
            Object.keys(data).forEach(key => {
                if (Array.isArray(data[key])) {
                    arrays.push(`${key}[${data[key].length}]`);
                }
            });
            console.log(`   • найденные массивы: ${arrays.join(', ') || 'нет'}`);
            
            // Анализ data объекта
            if (data.data && typeof data.data === 'object') {
                console.log(`   • data объект содержит: ${Object.keys(data.data).join(', ')}`);
                Object.keys(data.data).forEach(key => {
                    if (Array.isArray(data.data[key])) {
                        console.log(`     - data.${key}: массив из ${data.data[key].length} элементов`);
                    }
                });
            }
            
            // Размер ответа
            const responseSize = JSON.stringify(data).length;
            console.log(`   • размер ответа: ${responseSize} символов`);
            
            // Полный ответ (сокращенный)
            console.log('📄 ПОЛНЫЙ ОТВЕТ (первые 500 символов):');
            console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
            
            if (!response.ok) {
                console.log('❌ ОШИБКА:', data);
                break;
            }
        }
        
    } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    }
}

// Инструкции по использованию
console.log(`
📋 ИНСТРУКЦИЯ:
1. Замените YOUR_REAL_API_KEY_HERE на ваш реальный API ключ
2. Запустите: node test-api-detailed.js
3. Проанализируйте результаты

🎯 ЦЕЛЬ: Понять почему success=true но profiles=0
`);

// Проверяем, заменен ли API ключ
if (API_KEY === 'YOUR_REAL_API_KEY_HERE') {
    console.log('⚠️  ВНИМАНИЕ: Замените YOUR_REAL_API_KEY_HERE на ваш реальный API ключ!');
} else {
    detailedAPITest();
} 