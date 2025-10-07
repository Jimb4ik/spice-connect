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
    const BASE_URL = process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com';

    if (!API_KEY) {
        return res.status(500).json({ 
            error: 'API ключ не настроен в environment variables',
            instructions: 'Добавьте SPICE_API_KEY в настройки Vercel'
        });
    }

    try {
        // Получаем параметры из запроса
        const { force_pays } = req.body || {};
        
        // console.log('🚀 Отправляем запрос к Spice API...');
        
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
        // console.log('📡 URL запроса:', finalUrl);
        
        // Используем РАБОЧИЙ метод авторизации: Query только api_key
        // (Диагностика показала, что Basic auth НЕ работает, а Query api_key работает!)
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        // console.log('🔑 Используем РАБОЧИЙ метод: Query только api_key');
        // console.log('🔧 Headers:', headers);
        // console.log('📋 API ключ передается только через query параметры');
        
        // Делаем запрос к реальному API (API ключ в query параметрах)
        const apiResponse = await fetch(finalUrl, {
            method: 'POST',
            headers: headers
        });

        // console.log(`📡 API ответил со статусом: ${apiResponse.status}`);
        
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

        // console.log('✅ API запрос успешен!');
        
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