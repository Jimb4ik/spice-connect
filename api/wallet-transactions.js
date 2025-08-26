// API для работы с транзакциями кошелька
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { Pool } = await import('pg');
        
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        const { action } = req.method === 'GET' ? req.query : req.body;

        if (!action) {
            return res.status(400).json({
                success: false,
                error: 'Action parameter is required'
            });
        }

        let result;

        switch (action) {
            case 'add_transaction':
                result = await addWalletTransaction(pool, req);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: `Unknown action: ${action}`
                });
        }

        await pool.end();

        return res.status(200).json(result);

    } catch (error) {
        console.error('[WALLET] API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Database operation failed',
            details: error.message
        });
    }
}

// Добавить транзакцию
async function addWalletTransaction(pool, req) {
    const { 
        user_id, 
        session_id,
        transaction_type, 
        amount, 
        credits,
        currency,
        description, 
        payment_method, 
        payment_reference 
    } = req.body;

    if ((!user_id && !session_id) || !transaction_type || !amount) {
        return {
            success: false,
            error: 'user_id or session_id, transaction_type and amount are required'
        };
    }

    try {
        // Получаем кошелек пользователя (сначала по user_id, потом по session_id)
        let walletResult;
        
        if (user_id) {
            console.log('[WALLET] Looking for wallet by user_id:', user_id);
            walletResult = await pool.query(
                'SELECT * FROM user_wallets WHERE user_id = $1',
                [user_id]
            );
            console.log('[WALLET] Wallet search result for user_id', user_id, ':', walletResult.rows.length > 0 ? 'found' : 'not found');
        }
        
        // Если не найден по user_id или user_id не передан, ищем по session_id
        if ((!walletResult || walletResult.rows.length === 0) && session_id) {
            console.log('[WALLET] Fallback: searching wallet by session_id:', session_id);
            walletResult = await pool.query(
                'SELECT * FROM user_wallets WHERE session_id = $1',
                [session_id]
            );
        }

        if (!walletResult || walletResult.rows.length === 0) {
            console.log('[WALLET] Wallet not found, creating new wallet for user_id:', user_id, 'session_id:', session_id);
            
            // Создаем новый кошелек если не найден
            if (session_id) {
                const createWalletResult = await pool.query(
                    `INSERT INTO user_wallets (user_id, session_id, balance, currency)
                     VALUES ($1, $2, 0.00, 'USD')
                     RETURNING *`,
                    [user_id || session_id, session_id] // Используем user_id или session_id
                );
                
                if (createWalletResult.rows.length > 0) {
                    walletResult = createWalletResult;
                    console.log('[WALLET] New wallet created:', createWalletResult.rows[0]);
                } else {
                    return {
                        success: false,
                        error: 'Failed to create wallet'
                    };
                }
            } else {
                return {
                    success: false,
                    error: 'Wallet not found and cannot create without session_id'
                };
            }
        }

        const wallet = walletResult.rows[0];
        const transactionAmount = parseFloat(amount); // Реальная сумма для записи в транзакции
        const creditsAmount = credits ? parseFloat(credits) : transactionAmount; // Кредиты для баланса
        const effectiveUserId = user_id || wallet.user_id; // Используем переданный user_id или из кошелька

        console.log('[WALLET] Adding transaction:', {
            wallet_id: wallet.id,
            user_id: effectiveUserId,
            transaction_type,
            amount: transactionAmount, // Реальная сумма
            credits: creditsAmount, // Кредиты
            currency: currency || 'USD',
            description,
            payment_method,
            payment_reference
        });

        // Добавляем транзакцию (записываем реальную сумму в реальной валюте)
        const transactionResult = await pool.query(
            `INSERT INTO wallet_transactions 
             (wallet_id, user_id, transaction_type, amount, currency, description, payment_method, payment_reference)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [wallet.id, effectiveUserId, transaction_type, transactionAmount, currency || 'USD', description, payment_method, payment_reference]
        );

        // Обновляем баланс кошелька (в кредитах!)
        let newBalance = parseFloat(wallet.balance);
        if (transaction_type === 'deposit' || transaction_type === 'refund') {
            newBalance += creditsAmount; // Добавляем кредиты, не реальную сумму
        } else if (transaction_type === 'withdrawal' || transaction_type === 'purchase') {
            newBalance -= creditsAmount; // Вычитаем кредиты, не реальную сумму
        }

        await pool.query(
            'UPDATE user_wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newBalance, wallet.id]
        );

        console.log('[WALLET] Transaction completed successfully:', {
            transaction_id: transactionResult.rows[0].id,
            old_balance: wallet.balance,
            new_balance: newBalance,
            real_amount: transactionAmount, // Реальная сумма в транзакции
            credits_added: creditsAmount, // Кредиты добавленные к балансу
            currency: currency,
            type: transaction_type
        });

        return {
            success: true,
            data: {
                transaction: transactionResult.rows[0],
                wallet: {
                    id: wallet.id,
                    user_id: wallet.user_id,
                    old_balance: wallet.balance,
                    new_balance: newBalance,
                    currency: wallet.currency
                }
            }
        };

    } catch (error) {
        console.error('[WALLET] Transaction error:', error);
        return {
            success: false,
            error: 'Database operation failed',
            details: error.message
        };
    }
}
