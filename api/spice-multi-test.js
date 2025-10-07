// Конфигурация для отключения автоматического парсинга body для multipart запросов
export const config = {
    api: {
        bodyParser: false, // Отключаем автоматический парсинг для всех запросов
    },
};

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
        // Получаем параметры из query string
        const { endpoint, method = 'GET' } = req.query;
        
        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint не указан' });
        }

        // console.log(`🧪 Тестируем endpoint: ${method} ${endpoint}`);
        
        // Строим URL с query parameters
        let apiUrl = `${BASE_URL}${endpoint}`;
        const queryParams = new URLSearchParams();
        
        // Добавляем API ключ для всех запросов
        queryParams.append('api_key', API_KEY);
        
        // Добавляем дополнительные параметры из query string
        Object.keys(req.query).forEach(key => {
            if (key !== 'endpoint' && key !== 'method' && req.query[key] !== undefined) {
                queryParams.append(key, req.query[key]);
            }
        });
        
        const finalUrl = `${apiUrl}?${queryParams.toString()}`;
        // console.log('📡 URL запроса:', finalUrl.replace(API_KEY, 'HIDDEN_KEY'));
        
        // Определяем тип контента
        const incomingType = req.headers['content-type'] || '';
        const isMultipart = incomingType.startsWith('multipart/form-data');
        
        // console.log('🔑 Используем рабочий метод: Query только api_key');
        // console.log('🔑 API Key:', API_KEY.substring(0, 8) + '...' + API_KEY.slice(-4));
        // console.log('📋 Content-Type:', incomingType);
        // console.log('📋 Is Multipart:', isMultipart);
        
        // Настраиваем fetch options
        let fetchOptions = {
            method: method,
            headers: { 'Accept': 'application/json' }
        };
        
        // Для POST/PUT запросов обрабатываем тело
        if ((method === 'POST' || method === 'PUT') && req.method === 'POST') {
            // console.log('📤 Обрабатываем тело запроса');
            
            // Читаем raw body как Buffer
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            const bodyBuffer = Buffer.concat(chunks);
            
            if (isMultipart) {
                // Для multipart/form-data передаем raw buffer и сохраняем Content-Type
                // console.log('📤 Передаем multipart/form-data как Buffer, размер:', bodyBuffer.length);
                fetchOptions.body = bodyBuffer;
                fetchOptions.headers['Content-Type'] = incomingType;
            } else {
                // Для других типов контента
                // console.log('📤 Передаем как текст/JSON');
                const bodyText = bodyBuffer.toString('utf8');
                
                if (bodyText) {
                    try {
                        const jsonBody = JSON.parse(bodyText);
                        fetchOptions.body = JSON.stringify(jsonBody);
                        fetchOptions.headers['Content-Type'] = 'application/json';
                    } catch (e) {
                        fetchOptions.body = bodyText;
                        fetchOptions.headers['Content-Type'] = 'text/plain';
                    }
                }
            }
        }
        
        // Выполняем запрос
        const apiResponse = await fetch(finalUrl, fetchOptions);

        // console.log(`📊 API ответил со статусом: ${apiResponse.status}`);
        
        const data = await apiResponse.json();
        
        if (!apiResponse.ok) {
            console.error('❌ API Error Details:');
            console.error('  Status:', apiResponse.status);
            console.error('  StatusText:', apiResponse.statusText);
            console.error('  Headers:', Object.fromEntries(apiResponse.headers.entries()));
            console.error('  Response:', data);
            console.error('  Request URL:', finalUrl.replace(API_KEY, 'HIDDEN_KEY'));
            console.error('  Request Headers:', fetchOptions.headers);
            
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
                    auth_method: 'Query only api_key (диагностика показала - это работает!)',
                    is_multipart: isMultipart,
                    content_type: incomingType
                }
            });
        }

        // Успешный ответ
        // console.log('✅ Успешный ответ от API');
        // console.log('📊 Response data:', data);
        
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
            endpoint: req.query?.endpoint,
            method: req.query?.method,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
} 