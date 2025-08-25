#!/usr/bin/env node

/**
 * Простой тестовый сервер для webhook Networx Payment Gateway
 * Запуск: node webhook-test-server.js
 */

const http = require('http');
const crypto = require('crypto');

const PORT = 3001;

// Тестовые данные (замените на реальные)
const NETWORX_SECRET_KEY = 'your_secret_key_here';

// Функция генерации подписи webhook
function generateWebhookSignature(data, secretKey) {
    const signatureString = [
        data.shop_id,
        data.order_id,
        data.status,
        data.amount,
        secretKey
    ].join('');

    return crypto.createHash('sha256').update(signatureString).digest('hex');
}

// Обработка успешного платежа
async function processSuccessfulPayment(webhookData) {
    try {
        console.log('🎉 Processing successful payment:', {
            orderId: webhookData.order_id,
            amount: webhookData.amount,
            currency: webhookData.currency
        });

        // Извлекаем session_id из order_id или custom_parameters
        let sessionId, credits, amount, currency;
        
        if (webhookData.custom_parameters) {
            sessionId = webhookData.custom_parameters.session_id;
            credits = webhookData.custom_parameters.credits;
            amount = webhookData.custom_parameters.amount;
            currency = webhookData.custom_parameters.currency;
        } else {
            // Fallback - извлекаем из order_id
            const orderIdParts = webhookData.order_id.split('_');
            sessionId = orderIdParts[1];
            
            const amountInCurrency = webhookData.amount / 100;
            currency = webhookData.currency;
            
            const creditRates = {
                'EUR': 0.21,
                'USD': 0.23,
                'GBP': 0.18,
                'CAD': 0.31,
                'AUD': 0.35
            };
            
            const rate = creditRates[currency] || creditRates['EUR'];
            credits = Math.floor(amountInCurrency / rate);
            amount = amountInCurrency;
        }

        console.log('💳 Payment details:', {
            sessionId,
            credits,
            amount,
            currency
        });

        // Здесь бы мы отправили запрос к API базы данных
        console.log('✅ Would add', credits, 'credits to user wallet for session:', sessionId);
        
        // Имитируем успешное добавление в базу данных
        return {
            success: true,
            credits_added: credits,
            session_id: sessionId
        };

    } catch (error) {
        console.error('❌ Error processing payment:', error);
        throw error;
    }
}

// Создаем HTTP сервер
const server = http.createServer(async (req, res) => {
    // Настройка CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const webhookData = JSON.parse(body);
                
                console.log('\n🔔 Webhook received:', {
                    orderId: webhookData.order_id,
                    status: webhookData.status,
                    amount: webhookData.amount,
                    signature: webhookData.signature
                });

                // Проверяем подпись (временно отключено для тестирования)
                // const receivedSignature = webhookData.signature;
                // const calculatedSignature = generateWebhookSignature(webhookData, NETWORX_SECRET_KEY);
                
                // if (receivedSignature !== calculatedSignature) {
                //     console.error('❌ Invalid webhook signature');
                //     res.writeHead(400, { 'Content-Type': 'application/json' });
                //     res.end(JSON.stringify({ success: false, error: 'Invalid signature' }));
                //     return;
                // }

                // Обрабатываем платеж
                if (webhookData.status === 'success') {
                    const result = await processSuccessfulPayment(webhookData);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Webhook processed successfully',
                        data: result
                    }));
                } else if (webhookData.status === 'declined') {
                    console.log('❌ Payment declined:', webhookData.order_id);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Declined payment logged'
                    }));
                } else {
                    console.log('ℹ️ Unknown status:', webhookData.status);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Webhook received'
                    }));
                }

            } catch (error) {
                console.error('💥 Webhook processing error:', error);
                
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Webhook processing failed'
                }));
            }
        });
    } else {
        // Простая страница для тестирования
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Webhook Test Server</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    .container { background: #f5f5f5; padding: 20px; border-radius: 10px; }
                    button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
                    pre { background: #333; color: #fff; padding: 15px; border-radius: 5px; overflow-x: auto; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🧪 Webhook Test Server</h1>
                    <p>Server running on port ${PORT}</p>
                    <p>Webhook endpoint: <code>http://localhost:${PORT}/webhook</code></p>
                    
                    <h2>Test Webhook</h2>
                    <button onclick="testWebhook()">Send Test Webhook</button>
                    
                    <h2>Sample Webhook Data:</h2>
                    <pre id="sampleData">{
  "shop_id": "test_shop_123",
  "order_id": "credits_4g5d55p8r67pubk0i6pvqo0ftb_1234567890",
  "transaction_id": "txn_test_1234567890",
  "status": "success",
  "amount": 2100,
  "currency": "USD",
  "signature": "test_signature_123",
  "custom_parameters": {
    "session_id": "4g5d55p8r67pubk0i6pvqo0ftb",
    "credits": 100,
    "amount": 21,
    "currency": "USD"
  }
}</pre>
                </div>
                
                <script>
                    async function testWebhook() {
                        const data = {
                            "shop_id": "test_shop_123",
                            "order_id": "credits_4g5d55p8r67pubk0i6pvqo0ftb_" + Date.now(),
                            "transaction_id": "txn_test_" + Date.now(),
                            "status": "success",
                            "amount": 2100,
                            "currency": "USD",
                            "signature": "test_signature_" + Date.now(),
                            "custom_parameters": {
                                "session_id": "4g5d55p8r67pubk0i6pvqo0ftb",
                                "credits": 100,
                                "amount": 21,
                                "currency": "USD"
                            }
                        };
                        
                        try {
                            const response = await fetch('/webhook', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                            });
                            
                            const result = await response.json();
                            alert('Webhook test result: ' + JSON.stringify(result, null, 2));
                        } catch (error) {
                            alert('Error: ' + error.message);
                        }
                    }
                </script>
            </body>
            </html>
        `);
    }
});

server.listen(PORT, () => {
    console.log(`
🚀 Webhook Test Server запущен!

📍 URL: http://localhost:${PORT}
🔗 Webhook endpoint: http://localhost:${PORT}/webhook

Для тестирования:
1. Откройте http://localhost:${PORT} в браузере
2. Нажмите "Send Test Webhook" для тестирования
3. Или отправьте POST запрос на /webhook с данными платежа

Для остановки сервера нажмите Ctrl+C
    `);
});

// Обработка сигналов завершения
process.on('SIGINT', () => {
    console.log('\n👋 Сервер остановлен');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Сервер остановлен');
    process.exit(0);
});
