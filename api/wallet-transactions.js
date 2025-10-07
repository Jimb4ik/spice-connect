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
            case 'get_wallet':
                result = await getWallet(pool, req);
                break;
            case 'get_wallet_transactions':
                result = await getWalletTransactions(pool, req);
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
        // Ищем кошелек по всем возможным связям
        let walletResult;
        
        // console.log('[WALLET] Searching for existing wallet...', { user_id, session_id });
        
        // Сначала ищем по точному совпадению user_id
        if (user_id) {
            // console.log('[WALLET] Looking for wallet by user_id:', user_id);
            walletResult = await pool.query(
                'SELECT * FROM user_wallets WHERE user_id = $1',
                [user_id]
            );
            // console.log('[WALLET] Wallet search result for user_id', user_id, ':', walletResult.rows.length > 0 ? 'found' : 'not found');
        }
        
        // Если не найден по user_id, ищем по session_id
        if ((!walletResult || walletResult.rows.length === 0) && session_id) {
            // console.log('[WALLET] Searching by session_id:', session_id);
            walletResult = await pool.query(
                'SELECT * FROM user_wallets WHERE session_id = $1 OR user_id = $1',
                [session_id]
            );
            // console.log('[WALLET] Wallet search result for session_id', session_id, ':', walletResult.rows.length > 0 ? 'found' : 'not found');
        }
        
        // Если все еще не найден, попробуем найти по связи через user_progress
        if ((!walletResult || walletResult.rows.length === 0) && session_id) {
            // console.log('[WALLET] Searching via user_progress table...');
            const userLookupResult = await pool.query(
                'SELECT DISTINCT up.user_id FROM user_progress up WHERE up.session_id = $1 LIMIT 1',
                [session_id]
            );
            
            if (userLookupResult.rows.length > 0) {
                const realUserId = userLookupResult.rows[0].user_id;
                // console.log('[WALLET] Found real user_id via user_progress:', realUserId);
                
                walletResult = await pool.query(
                    'SELECT * FROM user_wallets WHERE user_id = $1',
                    [realUserId]
                );
                // console.log('[WALLET] Wallet search result for real user_id', realUserId, ':', walletResult.rows.length > 0 ? 'found' : 'not found');
            }
        }

        if (!walletResult || walletResult.rows.length === 0) {
            // console.log('[WALLET] ❌ NO EXISTING WALLET FOUND!');
            // console.log('[WALLET] Will create new wallet for user_id:', user_id, 'session_id:', session_id);
            // console.log('[WALLET] This means either:');
            // console.log('[WALLET] 1. User has no wallet yet');
            // console.log('[WALLET] 2. user_id/session_id mismatch');
            // console.log('[WALLET] 3. Database connection issue');
            
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
                    // console.log('[WALLET] New wallet created:', createWalletResult.rows[0]);
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
        } else {
            // console.log('[WALLET] ✅ EXISTING WALLET FOUND!');
            // console.log('[WALLET] Wallet details:', {
                id: walletResult.rows[0].id,
                user_id: walletResult.rows[0].user_id,
                session_id: walletResult.rows[0].session_id,
                balance: walletResult.rows[0].balance,
                currency: walletResult.rows[0].currency
            });
        }

        const wallet = walletResult.rows[0];
        const transactionAmount = parseFloat(amount); // Реальная сумма для записи в транзакции
        const creditsAmount = credits ? parseFloat(credits) : transactionAmount; // Кредиты для баланса
        const effectiveUserId = user_id || wallet.user_id; // Используем переданный user_id или из кошелька

        // console.log('[WALLET] Adding transaction:', {
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

        // console.log('[WALLET] Transaction completed successfully:', {
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

// Получить кошелек пользователя
async function getWallet(pool, req) {
    const { user_id, session_id } = req.method === 'GET' ? req.query : req.body;

    if (!user_id && !session_id) {
        return {
            success: false,
            error: 'user_id or session_id is required'
        };
    }

    try {
        let walletResult;
        
        // console.log('[WALLET] Getting wallet for user_id:', user_id, 'session_id:', session_id);
        
        // Ищем кошелек по user_id
        if (user_id) {
            walletResult = await pool.query(
                'SELECT * FROM user_wallets WHERE user_id = $1',
                [user_id]
            );
        }
        
        // Если не найден по user_id, ищем по session_id
        if ((!walletResult || walletResult.rows.length === 0) && session_id) {
            walletResult = await pool.query(
                'SELECT * FROM user_wallets WHERE session_id = $1 OR user_id = $1',
                [session_id]
            );
        }

        if (!walletResult || walletResult.rows.length === 0) {
            return {
                success: false,
                error: 'Wallet not found'
            };
        }

        return {
            success: true,
            data: walletResult.rows[0]
        };
    } catch (error) {
        console.error('[WALLET] Error getting wallet:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Получить транзакции кошелька
async function getWalletTransactions(pool, req) {
    const { user_id, session_id, limit = 50, offset = 0 } = req.method === 'GET' ? req.query : req.body;

    if (!user_id && !session_id) {
        return {
            success: false,
            error: 'user_id or session_id is required'
        };
    }

    try {
        // Сначала найдем кошелек
        const walletResult = await getWallet(pool, { method: req.method, query: req.query, body: req.body });
        
        if (!walletResult.success) {
            return walletResult;
        }

        const wallet = walletResult.data;
        
        // Получаем транзакции кошелька
        const transactionsResult = await pool.query(
            `SELECT wt.*, uw.user_id as wallet_user_id 
             FROM wallet_transactions wt
             JOIN user_wallets uw ON wt.wallet_id = uw.id
             WHERE wt.wallet_id = $1 
             ORDER BY wt.created_at DESC 
             LIMIT $2 OFFSET $3`,
            [wallet.id, parseInt(limit), parseInt(offset)]
        );

        return {
            success: true,
            data: transactionsResult.rows,
            wallet: wallet
        };
    } catch (error) {
        console.error('[WALLET] Error getting transactions:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
