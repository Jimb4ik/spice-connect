export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Проверяем environment variables (НЕ показываем сам ключ в целях безопасности)
    const API_KEY = process.env.SPICE_API_KEY;
    const BASE_URL = process.env.SPICE_BASE_URL;

    const debug_info = {
        timestamp: new Date().toISOString(),
        environment_variables: {
            SPICE_API_KEY: {
                exists: !!API_KEY,
                length: API_KEY ? API_KEY.length : 0,
                first_chars: API_KEY ? API_KEY.substring(0, 4) + '...' : 'не найден',
                last_chars: API_KEY ? '...' + API_KEY.substring(API_KEY.length - 4) : 'не найден'
            },
            SPICE_BASE_URL: {
                exists: !!BASE_URL,
                value: BASE_URL || 'не найден'
            }
        },
        request_info: {
            method: req.method,
            url: req.url,
            headers: {
                'user-agent': req.headers['user-agent'],
                'host': req.headers['host']
            }
        },
        deployment_info: {
            vercel_env: process.env.VERCEL_ENV || 'не найдено',
            vercel_url: process.env.VERCEL_URL || 'не найдено',
            node_version: process.version
        }
    };

    console.log('🔍 Debug info:', debug_info);

    res.status(200).json({
        success: true,
        message: 'Debug information (API ключ скрыт для безопасности)',
        ...debug_info
    });
} 