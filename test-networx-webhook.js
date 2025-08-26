#!/usr/bin/env node

/**
 * Тестовый скрипт для отправки webhook в формате Networx Payment Gateway
 * Использует реальную структуру данных согласно документации
 */

const https = require('https');

// Тестовые данные webhook согласно документации Networx
const webhookData = {
  "transaction": {
    "uid": "dd6ee60c-d30a-4348-b84c-86a4ef1a137d",
    "status": "successful",
    "amount": 2100, // 21.00 EUR в центах
    "currency": "EUR",
    "description": "Top up 100 credits",
    "type": "payment",
    "payment_method_type": "credit_card",
    "tracking_id": "credits_4g5d55p8r67pubk0i6pvqo0ftb_1737821234567", // Наш order_id
    "message": "Successfully processed",
    "test": false,
    "created_at": "2025-01-25T14:07:01.836Z",
    "updated_at": "2025-01-25T14:07:05.530Z",
    "paid_at": "2025-01-25T14:07:05.495Z",
    "expired_at": null,
    "recurring_type": null,
    "closed_at": null,
    "settled_at": null,
    "manually_corrected_at": null,
    "language": "en",
    "credit_card": {
      "holder": "John Doe",
      "stamp": "d9a78f040a8427c65da2c5569e6411c3641a5537fcfd2d2bf9f866abf3611c7d",
      "brand": "visa",
      "last_4": "1006",
      "first_1": "4",
      "bin": "401200",
      "issuer_country": null,
      "issuer_name": null,
      "product": null,
      "exp_month": 10,
      "exp_year": 2027,
      "token_provider": null,
      "token": null
    },
    "receipt_url": "https://backoffice.networxpay.com/customer/transactions/dd6ee60c-d30a-4348-b84c-86a4ef1a137d/42fe9b2e3ed56e98b426e946882cd10d71cd8ee0593373b00196413e28338dd7?language=en",
    "status_code": null,
    "gateway": {
      "iframe": true
    },
    "id": "dd6ee60c-d30a-4348-b84c-86a4ef1a137d",
    "additional_data": {
      "browser": {
        "screen_width": 1920,
        "screen_height": 1080,
        "screen_color_depth": 24,
        "language": "en",
        "java_enabled": false,
        "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        "time_zone": -180,
        "time_zone_name": "Europe",
        "accept_header": "json",
        "window_height": 667,
        "window_width": 600
      }
    },
    "redirect_url": "https://gateway.networxpay.com/process/dd6ee60c-d30a-4348-b84c-86a4ef1a137d",
    "payment": {
      "auth_code": "654321",
      "bank_code": "05",
      "rrn": "999",
      "ref_id": "777888",
      "message": "Payment was approved",
      "amount": 2100,
      "currency": "EUR",
      "billing_descriptor": "test descriptor",
      "gateway_id": 645,
      "status": "successful"
    },
    "customer": {
      "ip": "127.0.0.1",
      "email": "john@example.com",
      "device_id": "12312312321fff67",
      "birth_date": "1980-01-31"
    },
    "billing_address": {
      "first_name": "John 1",
      "last_name": "Doe",
      "address": "1st Street",
      "country": "US",
      "city": "Denver",
      "zip": "96002",
      "state": "CO",
      "phone": "4567898765467"
    }
  }
};

// Функция отправки webhook
async function sendWebhook(url, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Content-Signature': 'test_signature_' + Date.now() // Тестовая подпись
            }
        };

        const req = https.request(url, options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: responseData
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Основная функция
async function main() {
    const webhookUrl = process.argv[2] || 'https://lavrilo.com/api/networx-payment';
    
    console.log('🧪 Отправляем тестовый webhook Networx...');
    console.log('📍 URL:', webhookUrl);
    console.log('💳 Данные транзакции:', {
        uid: webhookData.transaction.uid,
        status: webhookData.transaction.status,
        amount: webhookData.transaction.amount,
        currency: webhookData.transaction.currency,
        tracking_id: webhookData.transaction.tracking_id
    });
    
    try {
        const response = await sendWebhook(webhookUrl, webhookData);
        
        console.log('\n✅ Ответ получен:');
        console.log('Status:', response.statusCode);
        console.log('Body:', response.body);
        
        if (response.statusCode === 200) {
            console.log('\n🎉 Webhook успешно обработан!');
        } else {
            console.log('\n❌ Ошибка обработки webhook');
        }
        
    } catch (error) {
        console.error('\n💥 Ошибка отправки webhook:', error.message);
    }
}

// Запускаем тест
main().catch(console.error);
