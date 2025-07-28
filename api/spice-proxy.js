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
        const { endpoint, method = 'POST', body } = req.body;
        
        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint не указан' });
        }

        // Строим URL для API
        const url = `${BASE_URL}${endpoint}`;
        
        // Подготавливаем headers
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'application/json'
        };

        // Делаем запрос к Spice API
        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json({
                error: data.message || 'Ошибка API',
                details: data
            });
        }

        // Возвращаем успешный ответ
        res.status(200).json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при обращении к API',
            message: error.message 
        });
    }
} 