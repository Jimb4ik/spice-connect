// Networx Payment Gateway Integration
import crypto from 'crypto';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Handle webhook directly (no action parameter)
    if (req.method === 'POST' && !req.body.action) {
        return await handleWebhook(req, res);
    }

    const { action } = req.body;

    try {
        switch (action) {
            case 'create_payment_token':
                return await createPaymentToken(req, res);
            case 'verify_payment':
                return await verifyPayment(req, res);
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Unknown action: ' + action
                });
        }
    } catch (error) {
        console.error('[NETWORX] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

// Обработка webhook уведомлений
async function handleWebhook(req, res) {
    try {
        const webhookData = req.body;
        const secretKey = process.env.NETWORX_SECRET_KEY;

        console.log('[NETWORX] Webhook received:', {
            transaction_uid: webhookData.transaction?.uid,
            status: webhookData.transaction?.status,
            amount: webhookData.transaction?.amount,
            currency: webhookData.transaction?.currency,
            tracking_id: webhookData.transaction?.tracking_id
        });
        
        // Детальное логирование для отладки
        console.log('[NETWORX] Full webhook data:', JSON.stringify(webhookData, null, 2));

        // Verify webhook signature using Content-Signature header (RSA signature)
        const contentSignature = req.headers['content-signature'];
        
        if (contentSignature) {
            console.log('[NETWORX] Content-Signature header found:', contentSignature);
            // TODO: Implement RSA signature verification when we have the public key
            // For now, we'll process the webhook without signature verification
        } else {
            console.log('[NETWORX] No Content-Signature header found, processing webhook anyway');
        }

        // Process payment based on status
        // Согласно документации Networx, данные приходят в объекте transaction
        if (webhookData.transaction?.status === 'successful') {
            await processSuccessfulPayment(webhookData);
        } else if (webhookData.transaction?.status === 'declined' || webhookData.transaction?.status === 'failed') {
            await processDeclinedPayment(webhookData);
        } else if (webhookData.expired === true) {
            console.log('[NETWORX] Payment token expired:', webhookData.token);
        }

        return res.status(200).json({
            success: true,
            message: 'Webhook processed'
        });

    } catch (error) {
        console.error('[NETWORX] Webhook error:', error);
        console.error('[NETWORX] Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: 'Webhook processing failed',
            details: error.message
        });
    }
}

// Создание платежного токена
async function createPaymentToken(req, res) {
    const { amount, currency, credits, session_id, user_id, billing_data } = req.body;

    if (!amount || !currency || !session_id) {
        return res.status(400).json({
            success: false,
            error: 'amount, currency and session_id are required'
        });
    }

    try {
        const shopId = process.env.NETWORX_SHOP_ID;
        const secretKey = process.env.NETWORX_SECRET_KEY;

        if (!shopId || !secretKey) {
            throw new Error('Networx credentials not configured');
        }

        // Генерируем уникальный order ID
        const orderId = `credits_${session_id}_${Date.now()}`;
        
        // Формируем данные для создания токена согласно официальной документации Networx
        const checkoutData = {
            checkout: {
                test: false, // Для продакшена false, для тестов true
                transaction_type: "payment",
                attempts: 3,
                settings: {
                    return_url: `https://lavrilo.com/wallet.html`,
                    success_url: `https://lavrilo.com/wallet.html?payment=success`,
                    decline_url: `https://lavrilo.com/wallet.html?payment=declined`,
                    fail_url: `https://lavrilo.com/wallet.html?payment=declined`,
                    cancel_url: `https://lavrilo.com/wallet.html`,
                    notification_url: `https://lavrilo.com/api/networx-payment`,
                    language: "en",
                    customer_fields: {
                        visible: ["first_name", "last_name", "email"],
                        read_only: ["email"]
                    }
                },
                order: {
                    currency: currency.toUpperCase(),
                    amount: Math.round(amount * 100), // Сумма в минимальных единицах валюты (центы)
                    description: `Top up ${credits} credits`,
                    tracking_id: orderId,
                    additional_data: {
                        custom_parameters: {
                            credits: credits,
                            amount: amount,
                            currency: currency,
                            session_id: session_id,
                            user_id: user_id
                        }
                    }
                },
                customer: {
                    first_name: billing_data?.firstName || '',
                    last_name: billing_data?.lastName || '',
                    email: billing_data?.email || '',
                    address: billing_data?.address || '',
                    city: billing_data?.city || '',
                    country: billing_data?.country || '',
                    zip: billing_data?.postalCode || ''
                }
            }
        };

        console.log('[NETWORX] Creating payment token:', {
            orderId,
            amount: checkoutData.checkout.order.amount,
            currency,
            credits
        });

        // Создаем HTTP Basic Auth заголовок согласно документации
        const basicAuth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

        // Отправляем запрос в Networx API согласно официальной документации
        const networxResponse = await fetch('https://checkout.networxpay.com/ctp/api/checkouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Version': '2',
                'Authorization': `Basic ${basicAuth}`
            },
            body: JSON.stringify(checkoutData)
        });

        const networxResult = await networxResponse.json();

        if (!networxResponse.ok) {
            console.error('[NETWORX] API Error Response:', networxResult);
            throw new Error(`Networx API error: ${networxResult.message || JSON.stringify(networxResult.errors || {})}`);
        }

        console.log('[NETWORX] Payment token created successfully:', networxResult.checkout.token);

        return res.status(200).json({
            success: true,
            data: {
                token: networxResult.checkout.token,
                payment_url: networxResult.checkout.redirect_url,
                order_id: orderId,
                amount: amount,
                currency: currency,
                credits: credits
            }
        });

    } catch (error) {
        console.error('[NETWORX] Error creating payment token:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create payment token'
        });
    }
}

// Верификация платежа (webhook)
async function verifyPayment(req, res) {
    try {
        const webhookData = req.body;
        const secretKey = process.env.NETWORX_SECRET_KEY;

        // Verify webhook signature
        const receivedSignature = webhookData.signature;
        const calculatedSignature = generateWebhookSignature(webhookData, secretKey);

        if (receivedSignature !== calculatedSignature) {
            console.error('[NETWORX] Invalid webhook signature');
            return res.status(400).json({
                success: false,
                error: 'Invalid signature'
            });
        }

        console.log('[NETWORX] Webhook received:', {
            orderId: webhookData.order_id,
            status: webhookData.status,
            amount: webhookData.amount
        });

        // Process payment based on status
        if (webhookData.status === 'success') {
            await processSuccessfulPayment(webhookData);
        } else if (webhookData.status === 'declined') {
            await processDeclinedPayment(webhookData);
        }

        return res.status(200).json({
            success: true,
            message: 'Webhook processed'
        });

    } catch (error) {
        console.error('[NETWORX] Webhook error:', error);
        return res.status(500).json({
            success: false,
            error: 'Webhook processing failed'
        });
    }
}

// Обработка успешного платежа
async function processSuccessfulPayment(webhookData) {
    try {
        // Согласно документации Networx, данные транзакции находятся в объекте transaction
        const transaction = webhookData.transaction;
        
        if (!transaction) {
            throw new Error('No transaction data in webhook');
        }

        // Extract data from additional_data or tracking_id
        let sessionId, credits, amount, currency;
        
        // Пытаемся извлечь данные из tracking_id (наш order_id)
        // Формат: credits_USER_ID_TIMESTAMP
        if (transaction.tracking_id) {
            console.log('[NETWORX] Parsing tracking_id:', transaction.tracking_id);
            const orderIdParts = transaction.tracking_id.split('_');
            console.log('[NETWORX] Order ID parts:', orderIdParts);
            
            if (orderIdParts.length >= 3 && orderIdParts[0] === 'credits') {
                // Берем все части между 'credits' и последним timestamp
                sessionId = orderIdParts.slice(1, -1).join('_');
                console.log('[NETWORX] Extracted user_id from tracking_id:', sessionId);
            }
        }
        
        // Получаем данные из транзакции
        amount = transaction.amount / 100; // Конвертируем из центов
        currency = transaction.currency;
        
        // Рассчитываем кредиты на основе суммы
        const creditRates = {
            'EUR': 0.21,
            'USD': 0.23,
            'GBP': 0.18,
            'CAD': 0.31,
            'AUD': 0.35
        };
        
        const rate = creditRates[currency] || creditRates['EUR'];
        credits = Math.floor(amount / rate);
        
        if (!sessionId) {
            throw new Error('Cannot extract session_id from webhook data');
        }

        console.log('[NETWORX] Processing successful payment:', {
            transaction_uid: transaction.uid,
            sessionId,
            credits,
            amount,
            currency,
            tracking_id: transaction.tracking_id
        });

        // Add credits to user wallet
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://lavrilo.com';
        
        const transactionData = {
            action: 'add_transaction',
            user_id: sessionId, // Используем извлеченный user_id из tracking_id
            session_id: sessionId, // Тот же ID как session_id для совместимости
            transaction_type: 'deposit',
            amount: amount, // Реальная сумма в реальной валюте
            credits: credits, // Количество кредитов для добавления к балансу
            currency: currency, // Валюта реальной транзакции
            description: `Payment via Networx - ${transaction.tracking_id}`,
            payment_method: 'card',
            payment_reference: transaction.uid,
            status: 'completed'
        };
        
        console.log('[NETWORX] Sending transaction data to database:', transactionData);
        
        const walletResponse = await fetch(`${baseUrl}/api/wallet-transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });

        const walletResult = await walletResponse.json();
        
        console.log('[NETWORX] Wallet API response:', walletResult);
        
        if (!walletResult.success) {
            console.error('[NETWORX] Failed to add credits to wallet:', walletResult.error);
            throw new Error(`Failed to add credits to wallet: ${walletResult.error}`);
        }

        console.log('[NETWORX] Credits added successfully:', credits, 'New balance:', walletResult.data?.new_balance);

    } catch (error) {
        console.error('[NETWORX] Error processing successful payment:', error);
        throw error;
    }
}

// Обработка отклоненного платежа
async function processDeclinedPayment(webhookData) {
    const transaction = webhookData.transaction;
    
    console.log('[NETWORX] Payment declined:', {
        transaction_uid: transaction?.uid,
        tracking_id: transaction?.tracking_id,
        status: transaction?.status,
        message: transaction?.message || 'Unknown'
    });
    
    // Here you could log declined payments for analytics
    // No credits are added in this case
}

// Генерация подписи для создания токена
function generateSignature(data, secretKey) {
    // Create signature string according to Networx documentation
    const signatureString = [
        data.shop_id,
        data.order_id,
        data.amount,
        data.currency,
        secretKey
    ].join('');

    return crypto.createHash('sha256').update(signatureString).digest('hex');
}

// Генерация подписи для webhook согласно документации Networx
function generateWebhookSignature(data, secretKey) {
    // Согласно документации Networx, подпись формируется из определенных полей
    // Проверяем разные варианты формирования подписи
    console.log('[NETWORX] Webhook data for signature:', {
        shop_id: data.shop_id,
        order_id: data.order_id,
        status: data.status,
        amount: data.amount,
        transaction_id: data.transaction_id,
        currency: data.currency
    });

    // Вариант 1: Стандартная подпись Networx
    const signatureString1 = [
        data.shop_id,
        data.order_id,
        data.status,
        data.amount,
        secretKey
    ].join('');

    // Вариант 2: С включением transaction_id
    const signatureString2 = [
        data.shop_id,
        data.transaction_id || data.order_id,
        data.status,
        data.amount,
        secretKey
    ].join('');

    // Вариант 3: С включением валюты
    const signatureString3 = [
        data.shop_id,
        data.order_id,
        data.status,
        data.amount,
        data.currency,
        secretKey
    ].join('');

    const signature1 = crypto.createHash('sha256').update(signatureString1).digest('hex');
    const signature2 = crypto.createHash('sha256').update(signatureString2).digest('hex');
    const signature3 = crypto.createHash('sha256').update(signatureString3).digest('hex');

    console.log('[NETWORX] Generated signatures:', {
        received: data.signature,
        variant1: signature1,
        variant2: signature2,
        variant3: signature3
    });

    // Возвращаем первый вариант как основной
    return signature1;
}
