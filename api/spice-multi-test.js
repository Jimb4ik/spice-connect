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
    const BASE_URL = process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com';

    if (!API_KEY) {
        return res.status(500).json({ 
            error: 'API ключ не настроен в environment variables' 
        });
    }

    try {
        // Получаем основные параметры (endpoint, method) всегда из query string
        // А остальные параметры - из body для POST или query для GET
        const { endpoint, method = 'GET' } = req.query;
        let params = {};
        
        if (req.method === 'GET') {
            params = { ...req.query };
        } else {
            params = { ...(req.body || {}), ...req.query };
        }
        
        // Убираем служебные параметры
        delete params.endpoint;
        delete params.method;
        
        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint не указан' });
        }

        console.log(`🧪 Тестируем endpoint: ${method} ${endpoint}`);
        console.log(`📋 Параметры:`, params);
        
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
        
        // Используем РАБОЧИЙ метод авторизации: Query только api_key
        // (Диагностика показала, что Basic auth НЕ работает)
        // По умолчанию отправляем JSON, но если исходный запрос был multipart/form-data, заголовок ставить нельзя
        let headers = { 'Accept': 'application/json' };
        const incomingType = req.headers['content-type'] || '';
        if (!incomingType.startsWith('multipart/form-data')) {
            headers['Content-Type'] = 'application/json';
        }
        
        console.log('🔑 Используем рабочий метод: Query только api_key');
        console.log('🔑 API Key:', API_KEY.substring(0, 8) + '...' + API_KEY.slice(-4));
        console.log('🔧 Headers:', headers);
        console.log('📋 Авторизация через query параметры (работает для всех endpoints)');
        
        // Передаем тело запроса если оно есть
        let fetchOptions = {
            method: method,
            headers: headers
        };
        
        // Для POST/PUT запросов передаем тело
        if ((method === 'POST' || method === 'PUT') && req.body) {
            // Если это multipart/form-data, передаем как есть
            if (incomingType.startsWith('multipart/form-data')) {
                // Для multipart нужно передать raw body
                fetchOptions.body = req.rawBody || req.body;
            } else {
                // Для JSON
                fetchOptions.body = JSON.stringify(req.body);
            }
            console.log('📤 Передаем тело запроса');
        }
        
        // Выполняем запрос
        const apiResponse = await fetch(finalUrl, fetchOptions);

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
                    auth_method: 'Query only api_key (диагностика показала - это работает!)'
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
        const requestData = req.method === 'GET' ? req.query : req.body;
        res.status(500).json({ 
            error: 'Ошибка сервера при обращении к API',
            message: error.message,
            endpoint: requestData?.endpoint,
            method: requestData?.method
        });
    }
} 