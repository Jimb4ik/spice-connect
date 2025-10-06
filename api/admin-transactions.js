// API для работы с транзакциями в админке
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { Pool } = await import('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const { action, user_id, limit = 100, user_ids = [] } = req.method === 'GET' ? req.query : req.body;

        switch (action) {
            case 'get_all_transactions': {
                // Получить все транзакции для админки
                const result = await pool.query(`
                    SELECT * FROM transactions 
                    ORDER BY created_at DESC 
                    LIMIT $1
                `, [limit]);
                
                return res.json({
                    success: true,
                    data: result.rows
                });
            }

            case 'get_user_transactions': {
                // Получить транзакции конкретного пользователя
                if (!user_id) {
                    return res.status(400).json({
                        success: false,
                        error: 'user_id is required'
                    });
                }

                const result = await pool.query(`
                    SELECT * FROM transactions 
                    WHERE from_user_id = $1 OR to_user_id = $1
                    ORDER BY created_at DESC
                `, [user_id]);
                
                return res.json({
                    success: true,
                    data: result.rows
                });
            }

            case 'seed_transactions': {
                // Наполнить БД реалистичными транзакциями
                console.log('[ADMIN] Seeding transactions...');
                
                // Создаем таблицу если её нет
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS transactions (
                        id SERIAL PRIMARY KEY,
                        transaction_id VARCHAR(255) UNIQUE NOT NULL,
                        from_user_id INTEGER,
                        to_user_id INTEGER,
                        type VARCHAR(50) NOT NULL,
                        amount DECIMAL(10, 2),
                        credits INTEGER,
                        details TEXT,
                        payment_method VARCHAR(100),
                        status VARCHAR(50) DEFAULT 'completed',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Используем переданные ID пользователей или генерируем случайные
                let userIds = user_ids && user_ids.length > 0 ? user_ids : [];
                
                if (userIds.length === 0) {
                    // Fallback: генерируем случайные ID
                    for (let i = 0; i < 200; i++) {
                        userIds.push(1000000 + Math.floor(Math.random() * 20000));
                    }
                }
                
                // Если переданы user_ids, очистим старые транзакции для свежих данных
                if (user_ids && user_ids.length > 0) {
                    await pool.query('DELETE FROM transactions');
                    console.log('[ADMIN] Cleared old transactions for fresh seed');
                }
                const transactionTypes = ['purchase', 'payout', 'gift'];
                const paymentMethods = ['Credit Card', 'PayPal', 'Stripe', 'Bank Transfer'];
                
                // Real gifts from database
                const realGifts = [
                    { name: 'Red Rose', price: 5 },
                    { name: 'Tulip Bouquet', price: 15 },
                    { name: 'Heart Chocolate', price: 20 },
                    { name: 'Coffee & Cookies', price: 25 },
                    { name: 'Teddy Bear', price: 35 },
                    { name: 'Balloons', price: 45 },
                    { name: 'Rose Bouquet', price: 75 },
                    { name: 'Perfume', price: 100 },
                    { name: 'Silver Earrings', price: 125 },
                    { name: 'Bracelet', price: 150 },
                    { name: 'Diamond Earrings', price: 300 },
                    { name: 'Gold Ring', price: 400 },
                    { name: 'Pearl Necklace', price: 500 },
                    { name: 'Diamond Bracelet', price: 650 },
                    { name: 'Platinum Ring', price: 800 },
                    { name: 'Luxury Watch', price: 1000 },
                    { name: 'Diamond Necklace', price: 1500 },
                    { name: 'Royal Crown', price: 2500 }
                ];

                const transactions = [];
                const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
                const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });

                // Выбираем 15 активных пользователей
                const activeUserIds = userIds.sort(() => 0.5 - Math.random()).slice(0, 15);
                console.log('[ADMIN] Creating transactions for', activeUserIds.length, 'active users');
                
                // Создаем МНОГО транзакций для активных пользователей (20-40 на каждого)
                activeUserIds.forEach(activeUserId => {
                    const numTransactions = Math.floor(Math.random() * 21) + 20; // 20-40 транзакций
                    
                    for (let i = 0; i < numTransactions; i++) {
                        const type = getRandomElement(transactionTypes);
                        const amount = (Math.random() * 150 + 10).toFixed(2);
                        const credits = Math.floor(amount * 10);
                        const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
                        
                        let fromUserId = activeUserId;
                        let toUserId = null;
                        
                        // Для подарков - активный юзер может быть отправителем или получателем
                        if (type === 'gift') {
                            if (Math.random() > 0.5) {
                                // Активный юзер отправляет подарок
                                toUserId = getRandomElement(userIds.filter(id => id !== activeUserId));
                            } else {
                                // Активный юзер получает подарок
                                toUserId = activeUserId;
                                fromUserId = getRandomElement(userIds.filter(id => id !== activeUserId));
                            }
                        }
                        
                        let details = '';
                        let paymentMethod = null;
                        
                        if (type === 'purchase') {
                            paymentMethod = getRandomElement(paymentMethods);
                            details = `Credits purchase via ${paymentMethod}`;
                        } else if (type === 'payout') {
                            details = 'Gift monetization withdrawal';
                            paymentMethod = 'Bank Transfer';
                        } else if (type === 'gift') {
                            const gift = getRandomElement(realGifts);
                            details = gift.name;
                        }
                        
                        transactions.push({
                            transaction_id: `TXN-${generateUUID()}`,
                            from_user_id: fromUserId,
                            to_user_id: toUserId,
                            type: type,
                            amount: parseFloat(amount),
                            credits: type === 'gift' ? realGifts.find(g => g.name === details)?.price || 50 : credits,
                            details: details,
                            payment_method: paymentMethod,
                            status: 'completed',
                            created_at: date
                        });
                    }
                });
                
                // Генерируем еще 100-150 обычных транзакций для остальных пользователей
                const numRegularTransactions = Math.floor(Math.random() * 51) + 100; // 100-150 транзакций
                for (let i = 0; i < numRegularTransactions; i++) {
                    const type = getRandomElement(transactionTypes);
                    const amount = (Math.random() * 100 + 10).toFixed(2);
                    const credits = Math.floor(amount * 10);
                    const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
                    
                    let fromUserId = getRandomElement(userIds);
                    let toUserId = type === 'gift' ? getRandomElement(userIds) : null;
                    
                    // Ensure different users for gifts
                    if (type === 'gift') {
                        while (fromUserId === toUserId) {
                            toUserId = getRandomElement(userIds);
                        }
                    }

                    let details = '';
                    let paymentMethod = null;
                    
                    if (type === 'purchase') {
                        paymentMethod = getRandomElement(paymentMethods);
                        details = `Credits purchase via ${paymentMethod}`;
                    } else if (type === 'payout') {
                        details = 'Gift monetization withdrawal';
                        paymentMethod = 'Bank Transfer';
                    } else if (type === 'gift') {
                        const gift = getRandomElement(realGifts);
                        details = gift.name;
                    }

                    transactions.push({
                        transaction_id: `TXN-${generateUUID()}`,
                        from_user_id: fromUserId,
                        to_user_id: toUserId,
                        type: type,
                        amount: parseFloat(amount),
                        credits: type === 'gift' ? realGifts.find(g => g.name === details)?.price || 50 : credits,
                        details: details,
                        payment_method: paymentMethod,
                        status: 'completed',
                        created_at: date
                    });
                }

                // Вставляем транзакции в БД
                for (const txn of transactions) {
                    try {
                        await pool.query(`
                            INSERT INTO transactions 
                            (transaction_id, from_user_id, to_user_id, type, amount, credits, details, payment_method, status, created_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                            ON CONFLICT (transaction_id) DO NOTHING
                        `, [
                            txn.transaction_id,
                            txn.from_user_id,
                            txn.to_user_id,
                            txn.type,
                            txn.amount,
                            txn.credits,
                            txn.details,
                            txn.payment_method,
                            txn.status,
                            txn.created_at
                        ]);
                    } catch (err) {
                        console.error('[ADMIN] Error inserting transaction:', err.message);
                    }
                }

                console.log('[ADMIN] Seeded', transactions.length, 'transactions');
                
                return res.json({
                    success: true,
                    message: `Seeded ${transactions.length} transactions`,
                    count: transactions.length
                });
            }

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action'
                });
        }
    } catch (error) {
        console.error('[ADMIN-TRANSACTIONS] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        await pool.end();
    }
}
