export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const API_KEY = process.env.SPICE_API_KEY;
    const BASE_URL = 'https://api.jetsetrdv.com';

    if (!API_KEY) {
        return res.status(500).json({ 
            error: 'API ключ не настроен в environment variables' 
        });
    }

    try {
        const { endpoint, method = 'GET', params = {} } = req.body;
        
        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint не указан' });
        }

        console.log(`🧪 Тестируем endpoint: ${method} ${endpoint}`);
        
        // Строим URL с query parameters
        let apiUrl = `${BASE_URL}${endpoint}`;
        const queryParams = new URLSearchParams();
        
        // Добавляем API ключ для всех запросов
        queryParams.append('api_key', API_KEY);
        
        // Добавляем дополнительные параметры
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                queryParams.append(key, params[key]);
            }
        });
        
        const finalUrl = `${apiUrl}?${queryParams.toString()}`;
        console.log('📡 URL запроса:', finalUrl.replace(API_KEY, 'HIDDEN_KEY'));
        
        // Определяем тип авторизации согласно документации
        const needsBasicAuth = endpoint.startsWith('/index_api/');
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        if (needsBasicAuth) {
            // Для index_api: пробуем разные варианты авторизации
            const authVariant1 = `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`;
            const authVariant2 = `Basic ${Buffer.from(API_KEY).toString('base64')}`;
            const authVariant3 = `Basic ${API_KEY}`;
            
            // Используем первый вариант как основной
            headers['Authorization'] = authVariant1;
            
            console.log('🔑 Пробуем Basic Authorization для index_api');
            console.log('🔑 API Key:', API_KEY.substring(0, 8) + '...' + API_KEY.slice(-4));
            console.log('🔑 Auth variant 1 (API_KEY:):', authVariant1.substring(0, 20) + '...');
            console.log('🔑 Auth variant 2 (API_KEY):', authVariant2.substring(0, 20) + '...');
            console.log('🔑 Auth variant 3 (plain):', authVariant3.substring(0, 20) + '...');
        } else {
            // Для ajax_api авторизация только через query параметры
            console.log('🔑 Используем query параметры для ajax_api');
        }
        
        console.log('🔧 Headers:', { 
            ...headers, 
            'Authorization': needsBasicAuth ? 'Basic [HIDDEN]' : 'не используется' 
        });
        
        // Выполняем запрос
        const apiResponse = await fetch(finalUrl, {
            method: method,
            headers: headers
        });

        console.log(`📊 API ответил со статусом: ${apiResponse.status}`);
        
        const data = await apiResponse.json();
        
        if (!apiResponse.ok) {
            console.error('❌ API Error Details:');
            console.error('  Status:', apiResponse.status);
            console.error('  StatusText:', apiResponse.statusText);
            console.error('  Headers:', Object.fromEntries(apiResponse.headers.entries()));
            console.error('  Response:', data);
            console.error('  Request URL:', finalUrl.replace(API_KEY, 'HIDDEN_KEY'));
            console.error('  Request Headers:', { ...headers, 'Authorization': headers.Authorization ? '[HIDDEN]' : 'none' });
            
            return res.status(apiResponse.status).json({
                error: 'Ошибка Spice API',
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                details: data,
                endpoint: endpoint,
                method: method,
                debug: {
                    api_key_present: !!API_KEY,
                    api_key_length: API_KEY ? API_KEY.length : 0,
                    endpoint_type: endpoint.startsWith('/index_api/') ? 'index_api' : 'ajax_api',
                    auth_method: endpoint.startsWith('/index_api/') ? 'Basic + Query' : 'Query only'
                }
            });
        }

        // Успешный ответ
        console.log('✅ Успешный ответ от API');
        res.status(200).json({
            success: true,
            endpoint: endpoint,
            method: method,
            status: apiResponse.status,
            data: data
        });

    } catch (error) {
        console.error('❌ Ошибка proxy:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при обращении к API',
            message: error.message,
            endpoint: req.body?.endpoint,
            method: req.body?.method
        });
    }
} 