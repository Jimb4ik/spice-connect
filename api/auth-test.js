export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const API_KEY = process.env.SPICE_API_KEY;
    const BASE_URL = process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com';

    if (!API_KEY) {
        return res.status(500).json({ 
            error: 'API ключ не настроен' 
        });
    }

    console.log('🧪 Тестируем разные методы авторизации');
    console.log('🔑 API Key info:', {
        exists: !!API_KEY,
        length: API_KEY.length,
        start: API_KEY.substring(0, 8),
        end: API_KEY.slice(-4)
    });

    const results = [];
    
    // Тестируем простой endpoint /index_api/index с разными методами авторизации
    const testEndpoint = '/index_api/index';
    
    const authMethods = [
        {
            name: 'Query только api_key',
            url: `${BASE_URL}${testEndpoint}?api_key=${API_KEY}`,
            headers: {
                'Accept': 'application/json'
            }
        },
        {
            name: 'Basic auth API_KEY:',
            url: `${BASE_URL}${testEndpoint}?api_key=${API_KEY}`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`
            }
        },
        {
            name: 'Basic auth только API_KEY',
            url: `${BASE_URL}${testEndpoint}?api_key=${API_KEY}`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`
            }
        },
        {
            name: 'Bearer token',
            url: `${BASE_URL}${testEndpoint}?api_key=${API_KEY}`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        },
        {
            name: 'X-API-Key header',
            url: `${BASE_URL}${testEndpoint}?api_key=${API_KEY}`,
            headers: {
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        }
    ];

    for (const method of authMethods) {
        try {
            console.log(`\n🔧 Тестируем: ${method.name}`);
            console.log('📡 URL:', method.url.replace(API_KEY, 'HIDDEN_KEY'));
            console.log('🔧 Headers:', { 
                ...method.headers, 
                'Authorization': method.headers.Authorization ? '[HIDDEN]' : undefined,
                'X-API-Key': method.headers['X-API-Key'] ? '[HIDDEN]' : undefined
            });

            const response = await fetch(method.url, {
                method: 'GET',
                headers: method.headers
            });

            const data = await response.json();
            
            const result = {
                method: method.name,
                status: response.status,
                statusText: response.statusText,
                success: response.ok,
                hasError: !!(data.error || data.error_label),
                errorMessage: data.error || data.error_label || null,
                dataKeys: data ? Object.keys(data) : [],
                responseSize: JSON.stringify(data).length
            };

            console.log(`📊 Результат: ${result.success ? '✅ SUCCESS' : '❌ ERROR'} (${result.status})`);
            if (result.errorMessage) {
                console.log(`🚫 Ошибка: ${result.errorMessage}`);
            }

            results.push(result);

        } catch (error) {
            console.error(`❌ Ошибка при тестировании ${method.name}:`, error);
            results.push({
                method: method.name,
                status: 0,
                success: false,
                error: error.message
            });
        }
    }

    // Анализируем результаты
    const successful = results.filter(r => r.success);
    const withoutErrors = results.filter(r => !r.hasError && r.status === 200);

    console.log('\n📈 ИТОГИ:');
    console.log(`Всего тестов: ${results.length}`);
    console.log(`Успешных HTTP: ${successful.length}`);
    console.log(`Без ошибок API: ${withoutErrors.length}`);

    res.status(200).json({
        success: true,
        api_key_info: {
            exists: !!API_KEY,
            length: API_KEY.length,
            preview: API_KEY.substring(0, 8) + '...' + API_KEY.slice(-4)
        },
        test_endpoint: testEndpoint,
        results: results,
        summary: {
            total_tests: results.length,
            successful_http: successful.length,
            without_api_errors: withoutErrors.length,
            best_methods: withoutErrors.map(r => r.method)
        }
    });
} 