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
            orderId: webhookData.order_id,
            status: webhookData.status,
            amount: webhookData.amount,
            signature: webhookData.signature
        });

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
        
        // Подготавливаем данные для создания токена
        const tokenData = {
            shop_id: shopId,
            order_id: orderId,
            amount: Math.round(amount * 100), // Amount in cents
            currency: currency,
            description: `Purchase ${credits} credits`,
            customer_name: billing_data?.full_name || 'Customer',
            customer_email: billing_data?.email || 'customer@example.com',
            customer_phone: billing_data?.phone || '',
            customer_address: billing_data?.address || '',
            customer_city: billing_data?.city || '',
            customer_country: billing_data?.country || '',
            customer_zip: billing_data?.postal_code || '',
            success_url: `${req.headers.origin || 'https://lavrilo.com'}/wallet.html?payment=success`,
            decline_url: `${req.headers.origin || 'https://lavrilo.com'}/wallet.html?payment=declined`,
            callback_url: `${req.headers.origin || 'https://lavrilo.com'}/api/networx-payment`,
            language: 'en'
        };

        // Генерируем подпись
        const signature = generateSignature(tokenData, secretKey);
        tokenData.signature = signature;

        console.log('[NETWORX] Creating payment token:', {
            orderId,
            amount: tokenData.amount,
            currency,
            credits
        });

        // Отправляем запрос в Networx API
        const networxResponse = await fetch('https://pay.networx-pay.com/api/v3/create_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tokenData)
        });

        const networxResult = await networxResponse.json();

        if (!networxResponse.ok || networxResult.status !== 'success') {
            throw new Error(`Networx API error: ${networxResult.message || 'Unknown error'}`);
        }

        console.log('[NETWORX] Payment token created successfully:', networxResult.data.token);

        return res.status(200).json({
            success: true,
            data: {
                token: networxResult.data.token,
                payment_url: networxResult.data.payment_url,
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
        // Extract session_id from order_id
        const orderIdParts = webhookData.order_id.split('_');
        const sessionId = orderIdParts[1];
        
        if (!sessionId) {
            throw new Error('Cannot extract session_id from order_id');
        }

        // Calculate credits from amount (reverse conversion)
        const amountInCurrency = webhookData.amount / 100; // Convert from cents
        const currency = webhookData.currency;
        
        // Use the same rates as frontend
        const creditRates = {
            'EUR': 0.21,
            'USD': 0.23,
            'GBP': 0.18,
            'CAD': 0.31,
            'AUD': 0.35
        };
        
        const rate = creditRates[currency] || creditRates['EUR'];
        const credits = Math.floor(amountInCurrency / rate);

        console.log('[NETWORX] Processing successful payment:', {
            sessionId,
            credits,
            amount: amountInCurrency,
            currency
        });

        // Add credits to user wallet
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
        const walletResponse = await fetch(`${baseUrl}/api/database`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'add_transaction',
                session_id: sessionId,
                transaction_type: 'deposit',
                amount: credits,
                description: `Payment via Networx - ${webhookData.order_id}`,
                payment_method: 'card',
                payment_reference: webhookData.transaction_id || webhookData.order_id,
                status: 'completed'
            })
        });

        const walletResult = await walletResponse.json();
        
        if (!walletResult.success) {
            throw new Error('Failed to add credits to wallet');
        }

        console.log('[NETWORX] Credits added successfully:', credits);

    } catch (error) {
        console.error('[NETWORX] Error processing successful payment:', error);
        throw error;
    }
}

// Обработка отклоненного платежа
async function processDeclinedPayment(webhookData) {
    console.log('[NETWORX] Payment declined:', {
        orderId: webhookData.order_id,
        reason: webhookData.decline_reason || 'Unknown'
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

// Генерация подписи для webhook
function generateWebhookSignature(data, secretKey) {
    // Create webhook signature string according to Networx documentation
    const signatureString = [
        data.shop_id,
        data.order_id,
        data.status,
        data.amount,
        secretKey
    ].join('');

    return crypto.createHash('sha256').update(signatureString).digest('hex');
}
