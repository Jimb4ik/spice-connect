// Универсальный API для работы с базой данных Neon
// Объединяет все операции с БД в одном endpoint

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
            case 'init_db':
                result = await initDatabase(pool);
                break;
            case 'get_progress':
                result = await getUserProgress(pool, req);
                break;
            case 'save_progress':
                result = await saveUserProgress(pool, req);
                break;
            case 'get_viewed':
                result = await getViewedProfiles(pool, req);
                break;
            case 'mark_viewed':
                result = await markProfileViewed(pool, req);
                break;
            case 'clear_viewed':
                result = await clearViewedProfiles(pool, req);
                break;
            case 'get_matches':
                result = await getMatches(pool, req);
                break;
            case 'save_match':
                result = await saveMatch(pool, req);
                break;
            case 'update_match':
                result = await updateMatch(pool, req);
                break;
            case 'delete_match':
                result = await deleteMatch(pool, req);
                break;
            case 'get_wallet':
                result = await getWallet(pool, req);
                break;
            case 'create_wallet':
                result = await createWallet(pool, req);
                break;
            case 'add_transaction':
                result = await addWalletTransaction(pool, req);
                break;
            case 'get_transactions':
                result = await getWalletTransactions(pool, req);
                break;
            default:
                await pool.end();
                return res.status(400).json({
                    success: false,
                    error: 'Unknown action: ' + action
                });
        }

        await pool.end();
        res.status(200).json(result);

    } catch (error) {
        console.error('[DATABASE] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Database operation failed',
            details: error.message
        });
    }
}

// Инициализация базы данных
async function initDatabase(pool) {
    const createTablesSQL = `
        -- Таблица для отслеживания прогресса пользователей
        CREATE TABLE IF NOT EXISTS user_progress (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            session_id VARCHAR(255) NOT NULL,
            current_page INTEGER DEFAULT 0,
            profiles_per_page INTEGER DEFAULT 30,
            last_profile_index INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, session_id)
        );

        -- Таблица для хранения просмотренных профилей
        CREATE TABLE IF NOT EXISTS viewed_profiles (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            profile_id VARCHAR(255) NOT NULL,
            action VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, profile_id)
        );

        -- Таблица для хранения матчей
        CREATE TABLE IF NOT EXISTS matches (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            matched_user_id VARCHAR(255) NOT NULL,
            matched_user_name VARCHAR(255),
            matched_user_age INTEGER,
            matched_user_city VARCHAR(255),
            matched_user_photos TEXT,
            match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT FALSE,
            UNIQUE(user_id, matched_user_id)
        );

        -- Таблица для виртуального кошелька пользователей
        CREATE TABLE IF NOT EXISTS user_wallets (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL UNIQUE,
            session_id VARCHAR(255) NOT NULL,
            balance DECIMAL(10,2) DEFAULT 0.00,
            currency VARCHAR(3) DEFAULT 'USD',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Таблица для транзакций кошелька
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id SERIAL PRIMARY KEY,
            wallet_id INTEGER REFERENCES user_wallets(id),
            user_id VARCHAR(255) NOT NULL,
            transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'purchase', 'refund'
            amount DECIMAL(10,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            description TEXT,
            payment_method VARCHAR(100), -- 'card', 'paypal', etc.
            payment_reference VARCHAR(255), -- external payment ID
            status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'cancelled'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Индексы
        CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_viewed_profiles_user_id ON viewed_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_viewed_profiles_profile_id ON viewed_profiles(profile_id);
        CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
        CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date DESC);
        CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_date ON wallet_transactions(created_at DESC);
    `;

    await pool.query(createTablesSQL);
    
    return {
        success: true,
        message: 'Database initialized successfully',
        tables: ['user_progress', 'viewed_profiles', 'matches']
    };
}

// Получить прогресс пользователя
async function getUserProgress(pool, req) {
    const { user_id, session_id } = req.method === 'GET' ? req.query : req.body;

    if (!user_id || !session_id) {
        return {
            success: false,
            error: 'user_id and session_id are required'
        };
    }

    const result = await pool.query(
        'SELECT * FROM user_progress WHERE user_id = $1 AND session_id = $2',
        [user_id, session_id]
    );

    if (result.rows.length === 0) {
        const newProgress = await pool.query(
            `INSERT INTO user_progress (user_id, session_id, current_page, profiles_per_page, last_profile_index)
             VALUES ($1, $2, 0, 30, 0)
             RETURNING *`,
            [user_id, session_id]
        );

        return {
            success: true,
            data: newProgress.rows[0],
            is_new: true
        };
    }

    return {
        success: true,
        data: result.rows[0],
        is_new: false
    };
}

// Сохранить прогресс пользователя
async function saveUserProgress(pool, req) {
    const { 
        user_id, 
        session_id, 
        current_page, 
        profiles_per_page = 30, 
        last_profile_index = 0 
    } = req.body;

    const result = await pool.query(
        `INSERT INTO user_progress (user_id, session_id, current_page, profiles_per_page, last_profile_index, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, session_id)
         DO UPDATE SET 
            current_page = EXCLUDED.current_page,
            profiles_per_page = EXCLUDED.profiles_per_page,
            last_profile_index = EXCLUDED.last_profile_index,
            updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [user_id, session_id, current_page, profiles_per_page, last_profile_index]
    );

    return {
        success: true,
        data: result.rows[0]
    };
}

// Получить просмотренные профили
async function getViewedProfiles(pool, req) {
    const { user_id, action } = req.method === 'GET' ? req.query : req.body;

    if (!user_id) {
        return {
            success: false,
            error: 'user_id is required'
        };
    }

    let query = 'SELECT * FROM viewed_profiles WHERE user_id = $1';
    const params = [user_id];

    if (action) {
        query += ' AND action = $2';
        params.push(action);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    
    return {
        success: true,
        data: result.rows,
        count: result.rows.length
    };
}

// Отметить профиль как просмотренный
async function markProfileViewed(pool, req) {
    const { user_id, profile_id, view_action = 'viewed' } = req.body;
    const action = view_action;

    if (!user_id || !profile_id) {
        return {
            success: false,
            error: 'user_id and profile_id are required'
        };
    }

    const result = await pool.query(
        `INSERT INTO viewed_profiles (user_id, profile_id, action)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, profile_id)
         DO UPDATE SET 
            action = EXCLUDED.action,
            created_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [user_id, profile_id, action]
    );

    return {
        success: true,
        data: result.rows[0]
    };
}

// Очистить историю просмотренных профилей
async function clearViewedProfiles(pool, req) {
    const { user_id } = req.body;

    if (!user_id) {
        return {
            success: false,
            error: 'user_id is required'
        };
    }

    const result = await pool.query(
        'DELETE FROM viewed_profiles WHERE user_id = $1',
        [user_id]
    );

    return {
        success: true,
        deleted_count: result.rowCount
    };
}

// Получить матчи пользователя
async function getMatches(pool, req) {
    const { user_id, limit = 50, offset = 0, unread_only = false } = req.method === 'GET' ? req.query : req.body;

    if (!user_id) {
        return {
            success: false,
            error: 'user_id is required'
        };
    }

    let query = 'SELECT * FROM matches WHERE user_id = $1';
    const params = [user_id];

    if (unread_only === 'true') {
        query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY match_date DESC LIMIT $2 OFFSET $3';
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    
    let countQuery = 'SELECT COUNT(*) FROM matches WHERE user_id = $1';
    const countParams = [user_id];
    
    if (unread_only === 'true') {
        countQuery += ' AND is_read = FALSE';
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    return {
        success: true,
        data: result.rows,
        total: parseInt(countResult.rows[0].count),
        count: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
    };
}

// Сохранить матч
async function saveMatch(pool, req) {
    const { 
        user_id, 
        matched_user_id, 
        matched_user_name,
        matched_user_age,
        matched_user_city
    } = req.body;

    if (!user_id || !matched_user_id) {
        return {
            success: false,
            error: 'user_id and matched_user_id are required'
        };
    }

    try {
        console.log('[DB] Saving match (WITHOUT PHOTOS):', { user_id, matched_user_id, matched_user_name, matched_user_age, matched_user_city });

        const result = await pool.query(
            `INSERT INTO matches (
                user_id, matched_user_id, matched_user_name, 
                matched_user_age, matched_user_city, matched_user_photos
            )
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id, matched_user_id)
             DO UPDATE SET 
                matched_user_name = EXCLUDED.matched_user_name,
                matched_user_age = EXCLUDED.matched_user_age,
                matched_user_city = EXCLUDED.matched_user_city,
                match_date = CURRENT_TIMESTAMP
             RETURNING *`,
            [user_id, matched_user_id, matched_user_name, matched_user_age, matched_user_city, null]
        );

        console.log('[DB] Match saved successfully:', result.rows[0]);

        return {
            success: true,
            data: result.rows[0]
        };
    } catch (error) {
        console.error('[DB] Error saving match:', error);
        return {
            success: false,
            error: 'Database operation failed',
            details: error.message
        };
    }
}

// Обновить матч
async function updateMatch(pool, req) {
    const { user_id, matched_user_id, is_read = true } = req.body;

    if (!user_id || !matched_user_id) {
        return {
            success: false,
            error: 'user_id and matched_user_id are required'
        };
    }

    const result = await pool.query(
        'UPDATE matches SET is_read = $3 WHERE user_id = $1 AND matched_user_id = $2 RETURNING *',
        [user_id, matched_user_id, is_read]
    );

    return {
        success: true,
        data: result.rows[0] || null,
        updated: result.rowCount > 0
    };
}

// Удалить матч
async function deleteMatch(pool, req) {
    const { user_id, matched_user_id } = req.body;

    if (!user_id || !matched_user_id) {
        return {
            success: false,
            error: 'user_id and matched_user_id are required'
        };
    }

    const result = await pool.query(
        'DELETE FROM matches WHERE user_id = $1 AND matched_user_id = $2',
        [user_id, matched_user_id]
    );

    return {
        success: true,
        deleted: result.rowCount > 0
    };
}

// ============ WALLET FUNCTIONS ============

// Получить кошелек пользователя
async function getWallet(pool, req) {
    const { user_id, session_id } = req.method === 'GET' ? req.query : req.body;

    if (!user_id) {
        return {
            success: false,
            error: 'user_id is required'
        };
    }

    try {
        // Сначала проверяем, есть ли кошелек
        let result = await pool.query(
            'SELECT * FROM user_wallets WHERE user_id = $1',
            [user_id]
        );

        if (result.rows.length === 0) {
            // Если кошелька нет, создаем его
            result = await pool.query(
                `INSERT INTO user_wallets (user_id, session_id, balance, currency)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [user_id, session_id || 'unknown', 0.00, 'USD']
            );
        }

        return {
            success: true,
            data: result.rows[0]
        };
    } catch (error) {
        console.error('[DB] Error getting wallet:', error);
        return {
            success: false,
            error: 'Database operation failed',
            details: error.message
        };
    }
}

// Создать кошелек
async function createWallet(pool, req) {
    const { user_id, session_id, initial_balance = 0.00 } = req.body;

    if (!user_id) {
        return {
            success: false,
            error: 'user_id is required'
        };
    }

    try {
        const result = await pool.query(
            `INSERT INTO user_wallets (user_id, session_id, balance, currency)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET
                session_id = EXCLUDED.session_id,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [user_id, session_id, parseFloat(initial_balance), 'USD']
        );

        return {
            success: true,
            data: result.rows[0]
        };
    } catch (error) {
        console.error('[DB] Error creating wallet:', error);
        return {
            success: false,
            error: 'Database operation failed',
            details: error.message
        };
    }
}

// Добавить транзакцию
async function addWalletTransaction(pool, req) {
    const { 
        user_id, 
        transaction_type, 
        amount, 
        description, 
        payment_method, 
        payment_reference 
    } = req.body;

    if (!user_id || !transaction_type || !amount) {
        return {
            success: false,
            error: 'user_id, transaction_type and amount are required'
        };
    }

    try {
        // Получаем кошелек пользователя
        const walletResult = await pool.query(
            'SELECT * FROM user_wallets WHERE user_id = $1',
            [user_id]
        );

        if (walletResult.rows.length === 0) {
            return {
                success: false,
                error: 'Wallet not found'
            };
        }

        const wallet = walletResult.rows[0];
        const transactionAmount = parseFloat(amount);

        // Добавляем транзакцию
        const transactionResult = await pool.query(
            `INSERT INTO wallet_transactions 
             (wallet_id, user_id, transaction_type, amount, description, payment_method, payment_reference)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [wallet.id, user_id, transaction_type, transactionAmount, description, payment_method, payment_reference]
        );

        // Обновляем баланс кошелька
        let newBalance = parseFloat(wallet.balance);
        if (transaction_type === 'deposit' || transaction_type === 'refund') {
            newBalance += transactionAmount;
        } else if (transaction_type === 'withdrawal' || transaction_type === 'purchase') {
            newBalance -= transactionAmount;
        }

        await pool.query(
            'UPDATE user_wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newBalance, wallet.id]
        );

        return {
            success: true,
            data: {
                transaction: transactionResult.rows[0],
                new_balance: newBalance
            }
        };
    } catch (error) {
        console.error('[DB] Error adding transaction:', error);
        return {
            success: false,
            error: 'Database operation failed',
            details: error.message
        };
    }
}

// Получить транзакции кошелька
async function getWalletTransactions(pool, req) {
    const { user_id, limit = 50, offset = 0 } = req.method === 'GET' ? req.query : req.body;

    if (!user_id) {
        return {
            success: false,
            error: 'user_id is required'
        };
    }

    try {
        const result = await pool.query(
            `SELECT * FROM wallet_transactions 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [user_id, parseInt(limit), parseInt(offset)]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1',
            [user_id]
        );

        return {
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
    } catch (error) {
        console.error('[DB] Error getting transactions:', error);
        return {
            success: false,
            error: 'Database operation failed',
            details: error.message
        };
    }
}