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
        const { action, user_id, limit = 100 } = req.method === 'GET' ? req.query : req.body;

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

                // Получаем реальных пользователей из API (больше для транзакций)
                const apiKey = process.env.SPICE_API_KEY;
                const usersResponse = await fetch(`https://dev2018.de5a7.com/index_api/search?api_key=${apiKey}&page=0&pas=200&is_photo=1`);
                const usersData = await usersResponse.json();
                const users = usersData.result || [];
                
                if (users.length === 0) {
                    return res.status(500).json({
                        success: false,
                        error: 'No users found to create transactions'
                    });
                }

                const userIds = users.map(u => u.id);
                const transactionTypes = ['purchase', 'payout', 'gift'];
                const paymentMethods = ['Credit Card', 'PayPal', 'Stripe', 'Bank Transfer'];
                const giftNames = ['Rose', 'Tulips', 'Chocolate', 'Crown', 'Diamond Ring'];
                const giftPrices = [10, 20, 30, 50, 100];

                const transactions = [];
                const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
                const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });

                // Генерируем 200 транзакций для большего реализма
                for (let i = 0; i < 200; i++) {
                    const type = getRandomElement(transactionTypes);
                    const amount = (Math.random() * 100 + 10).toFixed(2);
                    const credits = Math.floor(amount * 10);
                    const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
                    
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
                        const giftIndex = Math.floor(Math.random() * giftNames.length);
                        details = `${giftNames[giftIndex]} (${giftPrices[giftIndex]} credits)`;
                    }

                    transactions.push({
                        transaction_id: `TXN-${generateUUID()}`,
                        from_user_id: fromUserId,
                        to_user_id: toUserId,
                        type: type,
                        amount: parseFloat(amount),
                        credits: type === 'gift' ? giftPrices[giftNames.indexOf(details.split(' ')[0])] : credits,
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
