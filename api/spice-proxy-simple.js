export default async function handler(req, res) {
    // CORS headers - разрешаем браузеру делать запросы
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Получаем API ключ из environment variables (безопасно!)
    const API_KEY = process.env.SPICE_API_KEY;
    const BASE_URL = 'https://api.jetsetrdv.com';

    if (!API_KEY) {
        return res.status(500).json({ 
            error: 'API ключ не настроен в environment variables',
            instructions: 'Добавьте SPICE_API_KEY в настройки Vercel'
        });
    }

    try {
        // Получаем параметры из запроса
        const { force_pays } = req.body || {};
        
        console.log('🚀 Отправляем запрос к Spice API...');
        
        // Строим URL с query parameters согласно документации
        let apiUrl = `${BASE_URL}/index_api/landing_module/profils_global`;
        const queryParams = new URLSearchParams();
        
        // Добавляем обязательный api_key параметр (Required parameter согласно документации)
        queryParams.append('api_key', API_KEY);
        
        // Добавляем force_pays как query parameter (согласно документации)
        if (force_pays) {
            queryParams.append('force_pays', force_pays);
        }
        
        const finalUrl = `${apiUrl}?${queryParams.toString()}`;
        console.log('📡 URL запроса:', finalUrl);
        
        // Согласно документации: Authorization: Basic API_KEY:PASSWORD для index_api
        // Пробуем разные варианты Basic авторизации (нет пароля в доках)
        const basicAuth1 = `Basic ${API_KEY}`;
        const basicAuth2 = `Basic ${API_KEY}:`;
        const basicAuth3 = `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`;
        
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // Согласно документации для index_api
            'Authorization': basicAuth3  // Пробуем base64 encoded
        };
        
        console.log('🔑 Authorization types tested:', {
            'basic1': `Basic ${API_KEY.substring(0, 4)}...`,
            'basic2': `Basic ${API_KEY.substring(0, 4)}...:`,
            'basic3': `Basic base64(${API_KEY.substring(0, 4)}...:)`,
            'using': 'basic3'
        });
        
        // Делаем запрос к реальному API с API ключом в headers
        const apiResponse = await fetch(finalUrl, {
            method: 'POST',
            headers: headers
        });

        console.log(`📡 API ответил со статусом: ${apiResponse.status}`);
        
        const data = await apiResponse.json();
        
        if (!apiResponse.ok) {
            console.error('❌ API Error:', data);
            return res.status(apiResponse.status).json({
                error: 'Ошибка Spice API',
                message: data.message || data.error || 'Неизвестная ошибка',
                status: apiResponse.status,
                details: data
            });
        }

        console.log('✅ API запрос успешен!');
        
        // Возвращаем успешный результат
        res.status(200).json({
            success: true,
            data: data,
            profiles: data.profils || data.profiles || [],
            total: data.profils?.length || data.profiles?.length || 0
        });

    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при обращении к API',
            message: error.message,
            type: 'server_error'
        });
    }
} 