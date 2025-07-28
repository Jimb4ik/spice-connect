export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Получаем API ключ из environment variables
    const API_KEY = process.env.SPICE_API_KEY;
    const BASE_URL = process.env.SPICE_BASE_URL || 'https://api.jetsetrdv.com';

    if (!API_KEY) {
        return res.status(500).json({ 
            error: 'API ключ не настроен в environment variables' 
        });
    }

    try {
        const { endpoint, method = 'POST', params = {} } = req.body;

        if (!endpoint) {
            return res.status(400).json({ error: 'endpoint is required' });
        }

        // Полный URL к Spice API
        const apiUrl = `${BASE_URL}${endpoint}`;
        
        // Подготавливаем параметры с API ключом
        const requestParams = {
            ...params,
            api_key: API_KEY
        };

        // Подготавливаем данные запроса
        let requestOptions = {
            method: method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'SpiceConnect/1.0'
            }
        };

        // Для POST запросов отправляем данные как form data
        if (method === 'POST') {
            const formData = new URLSearchParams();
            Object.keys(requestParams).forEach(key => {
                if (requestParams[key] !== undefined && requestParams[key] !== null) {
                    formData.append(key, requestParams[key]);
                }
            });
            requestOptions.body = formData.toString();
        } else {
            // Для GET запросов добавляем параметры в URL
            const urlParams = new URLSearchParams(requestParams);
            const separator = apiUrl.includes('?') ? '&' : '?';
            requestOptions.url = `${apiUrl}${separator}${urlParams.toString()}`;
        }

        console.log(`🔗 Spice API Request: ${method} ${apiUrl}`, requestParams);

        // Отправляем запрос к Spice API
        const response = await fetch(method === 'GET' ? requestOptions.url : apiUrl, requestOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('✅ Spice API Response:', data);
        
        // Возвращаем данные клиенту
        res.status(200).json(data);

    } catch (error) {
        console.error('❌ Spice API Error:', error);
        res.status(500).json({ 
            error: 'Ошибка при обращении к Spice API',
            details: error.message 
        });
    }
} 