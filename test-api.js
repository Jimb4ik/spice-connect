// Тест API с реальными ключами Spice API
const API_KEY = 'YOUR_REAL_API_KEY_HERE'; // Замените на ваш реальный ключ
const BASE_URL = 'https://api.jetsetrdv.com';

async function testSpiceAPI() {
    console.log('🧪 Тестируем Spice API...');
    
    // Тест 1: Login
    try {
        console.log('\n1️⃣ Тест Login...');
        const loginResponse = await fetch(`${BASE_URL}/index_api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                api_key: API_KEY,
                email: 'test@example.com',
                password: 'testpass123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('📋 Login Response:', loginData);
        console.log('📋 Login Status:', loginResponse.status);
        
    } catch (error) {
        console.error('❌ Login Error:', error.message);
    }
    
    // Тест 2: Register  
    try {
        console.log('\n2️⃣ Тест Register...');
        const registerResponse = await fetch(`${BASE_URL}/index_api/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                api_key: API_KEY,
                email: 'newuser@example.com',
                password: 'newpass123',
                name: 'Test User',
                age: 25,
                city: 'Moscow'
            })
        });
        
        const registerData = await registerResponse.json();
        console.log('📋 Register Response:', registerData);
        console.log('📋 Register Status:', registerResponse.status);
        
    } catch (error) {
        console.error('❌ Register Error:', error.message);
    }
    
    // Тест 3: Simple GET для проверки доступа к API
    try {
        console.log('\n3️⃣ Тест API доступность...');
        const testResponse = await fetch(`${BASE_URL}/index_api/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                api_key: API_KEY,
                session_id: 'test_session'  
            })
        });
        
        const testData = await testResponse.json();
        console.log('📋 API Test Response:', testData);
        console.log('📋 API Test Status:', testResponse.status);
        
    } catch (error) {
        console.error('❌ API Test Error:', error.message);
    }
}

// Запуск тестов
testSpiceAPI(); 