// Универсальный API для работы с базой данных Neon
// Объединяет все операции с БД в одном endpoint

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Перенаправляем ТОЛЬКО запросы кошелька на отдельный API
    const { action } = req.method === 'GET' ? req.query : req.body;
    
    console.log('[DATABASE] Processing action:', action);
    
    // ТОЛЬКО для кошелька используем отдельный API
    if (action === 'get_wallet' || action === 'get_wallet_transactions' || action === 'add_transaction') {
        try {
            const walletResponse = await fetch(`${req.headers.host ? `https://${req.headers.host}` : 'https://lavrilo.com'}/api/wallet-transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(req.body)
            });
            
            const walletResult = await walletResponse.json();
            return res.status(walletResponse.status).json(walletResult);
        } catch (error) {
            console.error('[DATABASE] Wallet redirect error:', error);
            return res.status(500).json({
                success: false,
                error: 'Wallet operation failed'
            });
        }
    }
    
    // Для ВСЕХ остальных запросов используем обычную базу данных

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
            case 'get_wallet':
                result = await getWallet(pool, req);
                break;
            case 'test_connection':
                result = await testConnection(pool, req);
                break;
            case 'save_consent':
                result = await saveUserConsent(pool, req);
                break;
            case 'get_gifts_catalog':
                result = await getGiftsCatalog(pool, req);
                break;
            case 'purchase_gift':
                result = await purchaseGift(pool, req);
                break;
            case 'get_received_gifts':
                result = await getReceivedGifts(pool, req);
                break;
            case 'get_sent_gifts':
                result = await getSentGifts(pool, req);
                break;
            case 'get_gift_transactions':
                result = await getGiftTransactions(pool, req);
                break;
            case 'monetize_gifts':
                result = await monetizeGifts(pool, req);
                break;
            case 'get_notifications':
                result = await getUserNotifications(pool, req);
                break;
            case 'mark_notification_read':
                result = await markNotificationRead(pool, req);
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

        -- Таблица для согласий пользователей
        CREATE TABLE IF NOT EXISTS user_consents (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255),
            session_id VARCHAR(255) NOT NULL,
            terms_agreed BOOLEAN DEFAULT false,
            age_confirmed BOOLEAN DEFAULT false,
            consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Таблица каталога подарков
        CREATE TABLE IF NOT EXISTS gifts (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image_url VARCHAR(255) NOT NULL,
            price_credits INTEGER NOT NULL,
            category VARCHAR(50) NOT NULL, -- 'budget', 'medium', 'premium', 'vip'
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Таблица подарков пользователей
        CREATE TABLE IF NOT EXISTS user_gifts (
            id SERIAL PRIMARY KEY,
            gift_id INTEGER REFERENCES gifts(id),
            sender_user_id VARCHAR(255),
            sender_session_id VARCHAR(255),
            receiver_user_id VARCHAR(255),
            receiver_session_id VARCHAR(255) NOT NULL,
            purchase_price_credits INTEGER NOT NULL,
            monetization_value_usd DECIMAL(10,2),
            monetization_currency VARCHAR(3) DEFAULT 'USD',
            personal_message TEXT,
            status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'received', 'monetized'
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            received_at TIMESTAMP,
            monetized_at TIMESTAMP
        );

        -- Таблица транзакций подарков
        CREATE TABLE IF NOT EXISTS gift_transactions (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255),
            session_id VARCHAR(255) NOT NULL,
            transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'send', 'receive', 'monetize'
            gift_id INTEGER REFERENCES gifts(id),
            user_gift_id INTEGER REFERENCES user_gifts(id),
            credits_spent INTEGER DEFAULT 0,
            usd_earned DECIMAL(10,2) DEFAULT 0,
            currency VARCHAR(3) DEFAULT 'USD',
            related_user_id VARCHAR(255), -- с кем была транзакция
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Таблица уведомлений пользователей
        CREATE TABLE IF NOT EXISTS user_notifications (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255),
            session_id VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL, -- 'gift_received', 'gift_monetized', etc.
            title VARCHAR(255) NOT NULL,
            message TEXT,
            related_gift_id INTEGER REFERENCES gifts(id),
            related_user_id VARCHAR(255),
            is_read BOOLEAN DEFAULT false,
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
        CREATE INDEX IF NOT EXISTS idx_user_consents_session_id ON user_consents(session_id);
        CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
        CREATE INDEX IF NOT EXISTS idx_gifts_category ON gifts(category);
        CREATE INDEX IF NOT EXISTS idx_gifts_active ON gifts(is_active);
        CREATE INDEX IF NOT EXISTS idx_user_gifts_receiver ON user_gifts(receiver_session_id);
        CREATE INDEX IF NOT EXISTS idx_user_gifts_sender ON user_gifts(sender_session_id);
        CREATE INDEX IF NOT EXISTS idx_user_gifts_status ON user_gifts(status);
        CREATE INDEX IF NOT EXISTS idx_gift_transactions_user ON gift_transactions(session_id);
        CREATE INDEX IF NOT EXISTS idx_gift_transactions_type ON gift_transactions(transaction_type);
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(session_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(session_id, is_read);
    `;

    await pool.query(createTablesSQL);

    // Инициализируем каталог подарков
    await initGiftsCatalog(pool);
    
    return {
        success: true,
        message: 'Database initialized successfully',
        tables: ['user_progress', 'viewed_profiles', 'matches', 'gifts', 'user_gifts', 'gift_transactions', 'user_notifications']
    };
}

// Инициализация каталога подарков
async function initGiftsCatalog(pool) {
    try {
        // Проверяем, есть ли уже подарки в каталоге
        const existingGifts = await pool.query('SELECT COUNT(*) FROM gifts');
        if (parseInt(existingGifts.rows[0].count) > 0) {
            console.log('[DB] Gifts catalog already initialized');
            return;
        }

        console.log('[DB] Initializing gifts catalog...');

        const gifts = [
            // Budget gifts (5-50 credits)
            { name: 'Red Rose', description: 'A beautiful red rose to show your affection', image_url: 'gifts/rose.png', price_credits: 5, category: 'budget', sort_order: 1 },
            { name: 'Tulip Bouquet', description: 'Fresh tulips to brighten their day', image_url: 'gifts/tulips.png', price_credits: 15, category: 'budget', sort_order: 2 },
            { name: 'Heart Chocolate', description: 'Sweet chocolate treats shaped like hearts', image_url: 'gifts/chocolate.png', price_credits: 20, category: 'budget', sort_order: 3 },
            { name: 'Coffee & Cookies', description: 'A warm coffee with delicious cookies', image_url: 'gifts/coffee.png', price_credits: 25, category: 'budget', sort_order: 4 },
            { name: 'Teddy Bear', description: 'Cute and cuddly teddy bear', image_url: 'gifts/teddy.png', price_credits: 35, category: 'budget', sort_order: 5 },
            { name: 'Balloons', description: 'Colorful balloons to celebrate', image_url: 'gifts/balloons.png', price_credits: 45, category: 'budget', sort_order: 6 },

            // Medium gifts (50-200 credits)
            { name: 'Rose Bouquet', description: 'Elegant bouquet of premium roses', image_url: 'gifts/rose-bouquet.png', price_credits: 75, category: 'medium', sort_order: 7 },
            { name: 'Perfume', description: 'Luxurious fragrance for special moments', image_url: 'gifts/perfume.png', price_credits: 100, category: 'medium', sort_order: 8 },
            { name: 'Silver Earrings', description: 'Beautiful silver earrings with crystals', image_url: 'gifts/silver-earrings.png', price_credits: 125, category: 'medium', sort_order: 9 },
            { name: 'Bracelet', description: 'Elegant bracelet with charm details', image_url: 'gifts/bracelet.png', price_credits: 150, category: 'medium', sort_order: 10 },
            { name: 'Watch', description: 'Stylish watch for everyday elegance', image_url: 'gifts/watch.png', price_credits: 175, category: 'medium', sort_order: 11 },
            { name: 'Gold Chain', description: 'Beautiful gold chain necklace', image_url: 'gifts/gold-chain.png', price_credits: 200, category: 'medium', sort_order: 12 },

            // Premium gifts (200-1000 credits)
            { name: 'Diamond Earrings', description: 'Sparkling diamond earrings', image_url: 'gifts/diamond-earrings.png', price_credits: 300, category: 'premium', sort_order: 13 },
            { name: 'Gold Ring', description: 'Elegant gold ring with precious stones', image_url: 'gifts/gold-ring.png', price_credits: 400, category: 'premium', sort_order: 14 },
            { name: 'Pearl Necklace', description: 'Classic pearl necklace of finest quality', image_url: 'gifts/pearl-necklace.png', price_credits: 500, category: 'premium', sort_order: 15 },
            { name: 'Diamond Bracelet', description: 'Luxurious gold bracelet with diamonds', image_url: 'gifts/diamond-bracelet.png', price_credits: 650, category: 'premium', sort_order: 16 },
            { name: 'Platinum Ring', description: 'Exclusive platinum ring with gemstone', image_url: 'gifts/platinum-ring.png', price_credits: 800, category: 'premium', sort_order: 17 },
            { name: 'Luxury Watch', description: 'Premium luxury watch collection', image_url: 'gifts/luxury-watch.png', price_credits: 1000, category: 'premium', sort_order: 18 },

            // VIP gifts (1000+ credits)
            { name: 'Diamond Necklace', description: 'Exclusive diamond necklace for special occasions', image_url: 'gifts/diamond-necklace.png', price_credits: 1500, category: 'vip', sort_order: 19 },
            { name: 'Royal Crown', description: 'Majestic crown with precious gems and gold', image_url: 'gifts/crown.png', price_credits: 2500, category: 'vip', sort_order: 20 }
        ];

        for (const gift of gifts) {
            await pool.query(
                `INSERT INTO gifts (name, description, image_url, price_credits, category, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT DO NOTHING`,
                [gift.name, gift.description, gift.image_url, gift.price_credits, gift.category, gift.sort_order]
            );
        }

        console.log('[DB] Gifts catalog initialized with', gifts.length, 'items');
    } catch (error) {
        console.error('[DB] Error initializing gifts catalog:', error);
    }
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

    try {
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
    } catch (error) {
        console.error('[DB] Error getting viewed profiles:', error);
        
        // Если таблица не существует, возвращаем пустой результат
        if (error.code === '42P01') { // relation does not exist
            console.log('[DB] viewed_profiles table does not exist, returning empty result');
            return {
                success: true,
                data: [],
                count: 0
            };
        }
        
        return {
            success: false,
            error: error.message
        };
    }
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

    try {
        let query = 'SELECT * FROM matches WHERE user_id = $1';
        const params = [user_id];

        if (unread_only === 'true') {
            query += ' AND is_read = FALSE';
        }

        query += ' ORDER BY match_date DESC LIMIT $2 OFFSET $3';
        params.push(parseInt(limit), parseInt(offset));

        console.log('[DB] Getting matches for user:', user_id, 'query:', query);
        const result = await pool.query(query, params);
        
        let countQuery = 'SELECT COUNT(*) FROM matches WHERE user_id = $1';
        const countParams = [user_id];
        
        if (unread_only === 'true') {
            countQuery += ' AND is_read = FALSE';
        }
        
        const countResult = await pool.query(countQuery, countParams);
        
        console.log('[DB] Found', result.rows.length, 'matches for user', user_id);
        
        return {
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            count: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
    } catch (error) {
        console.error('[DB] Error getting matches:', error);
        
        // Если таблица не существует, возвращаем пустой результат
        if (error.code === '42P01') { // relation does not exist
            console.log('[DB] matches table does not exist, returning empty result');
            return {
                success: true,
                data: [],
                total: 0,
                count: 0,
                limit: parseInt(limit),
                offset: parseInt(offset)
            };
        }
        
        return {
            success: false,
            error: error.message
        };
    }
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
            console.log('[DB] Looking for wallet by user_id:', user_id);
            walletResult = await pool.query(
                'SELECT * FROM user_wallets WHERE user_id = $1',
                [user_id]
            );
            console.log('[DB] Wallet search result for user_id', user_id, ':', walletResult.rows.length > 0 ? 'found' : 'not found');
        }
        
        // Если не найден по user_id или user_id не передан, ищем по session_id
        if ((!walletResult || walletResult.rows.length === 0) && session_id) {
            console.log('[DB] Fallback: searching wallet by session_id:', session_id);
            walletResult = await pool.query(
                'SELECT * FROM user_wallets WHERE session_id = $1',
                [session_id]
            );
        }

        if (!walletResult || walletResult.rows.length === 0) {
            console.log('[DB] Wallet not found, creating new wallet for user_id:', user_id, 'session_id:', session_id);
            
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
                    console.log('[DB] New wallet created:', createWalletResult.rows[0]);
                } else {
                    console.error('[DB] Failed to create wallet');
                    return {
                        success: false,
                        error: 'Failed to create wallet'
                    };
                }
            } else {
                console.error('[DB] Cannot create wallet without session_id');
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

        console.log('[DB] Adding transaction:', {
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

        console.log('[DB] Transaction completed successfully:', {
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

// Тестовое подключение к базе данных
async function testConnection(pool, req) {
    try {
        const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
        
        return {
            success: true,
            message: 'Database connection successful',
            data: {
                current_time: result.rows[0].current_time,
                postgres_version: result.rows[0].postgres_version,
                connection_info: {
                    host: pool.options.host || 'unknown',
                    database: pool.options.database || 'unknown',
                    user: pool.options.user || 'unknown'
                }
            }
        };
    } catch (error) {
        console.error('[DB] Connection test failed:', error);
        return {
            success: false,
            error: 'Database connection failed',
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
        
        if (user_id) {
            walletResult = await pool.query(
                'SELECT * FROM wallets WHERE user_id = $1',
                [user_id]
            );
        }
        
        if ((!walletResult || walletResult.rows.length === 0) && session_id) {
            walletResult = await pool.query(
                'SELECT * FROM wallets WHERE user_id = $1',
                [session_id]
            );
        }

        if (walletResult.rows.length === 0) {
            return {
                success: false,
                error: 'Wallet not found'
            };
        }

        return {
            success: true,
            wallet: walletResult.rows[0]
        };
    } catch (error) {
        console.error('[DB] Error getting wallet:', error);
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
        const effectiveUserId = user_id || session_id;
        
        const result = await pool.query(
            `SELECT * FROM wallet_transactions 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [effectiveUserId, parseInt(limit), parseInt(offset)]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1',
            [effectiveUserId]
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

// Сохранить согласие пользователя
async function saveUserConsent(pool, req) {
    const { 
        session_id, 
        user_id, 
        terms_agreed, 
        age_confirmed, 
        consent_timestamp, 
        ip_address, 
        user_agent 
    } = req.body;

    if (!session_id) {
        return {
            success: false,
            error: 'session_id is required'
        };
    }

    try {
        const result = await pool.query(
            `INSERT INTO user_consents 
             (user_id, session_id, terms_agreed, age_confirmed, consent_timestamp, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                user_id || null,
                session_id,
                terms_agreed || false,
                age_confirmed || false,
                consent_timestamp || new Date().toISOString(),
                ip_address || null,
                user_agent || null
            ]
        );

        console.log('[DB] User consent saved:', result.rows[0]);

        return {
            success: true,
            data: result.rows[0],
            message: 'User consent saved successfully'
        };
    } catch (error) {
        console.error('[DB] Error saving consent:', error);
        return {
            success: false,
            error: 'Failed to save user consent'
        };
    }
}

// ============ GIFTS SYSTEM FUNCTIONS ============

// Получить каталог подарков
async function getGiftsCatalog(pool, req) {
    try {
        const result = await pool.query(
            `SELECT * FROM gifts 
             WHERE is_active = true 
             ORDER BY sort_order ASC, price_credits ASC`
        );

        return {
            success: true,
            data: result.rows,
            total: result.rows.length
        };
    } catch (error) {
        console.error('[DB] Error getting gifts catalog:', error);
        return {
            success: false,
            error: 'Failed to get gifts catalog'
        };
    }
}

// Покупка и отправка подарка
async function purchaseGift(pool, req) {
    const { 
        gift_id, 
        sender_session_id, 
        sender_user_id, 
        receiver_session_id, 
        receiver_user_id, 
        personal_message 
    } = req.body;

    if (!gift_id || !sender_session_id || !receiver_session_id) {
        return {
            success: false,
            error: 'gift_id, sender_session_id and receiver_session_id are required'
        };
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Получаем информацию о подарке
        const giftResult = await client.query(
            'SELECT * FROM gifts WHERE id = $1 AND is_active = true',
            [gift_id]
        );

        if (giftResult.rows.length === 0) {
            throw new Error('Gift not found or inactive');
        }

        const gift = giftResult.rows[0];

        // Проверяем, является ли отправитель системным пользователем
        const isSystemSender = sender_session_id === 'SYSTEM' || sender_user_id === 'SYSTEM';

        if (!isSystemSender) {
            // Проверяем баланс отправителя только для обычных пользователей
            const walletResult = await client.query(
                'SELECT balance FROM user_wallets WHERE session_id = $1',
                [sender_session_id]
            );

            if (walletResult.rows.length === 0) {
                throw new Error('Sender wallet not found');
            }

            const currentBalance = parseFloat(walletResult.rows[0].balance);
            if (currentBalance < gift.price_credits) {
                throw new Error('Insufficient credits');
            }

            // Списываем кредиты с отправителя
            await client.query(
                'UPDATE user_wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE session_id = $2',
                [gift.price_credits, sender_session_id]
            );
        } else {
            console.log('[DB] System gift - skipping wallet check and credit deduction');
        }

        // Создаем запись о подарке
        const userGiftResult = await client.query(
            `INSERT INTO user_gifts 
             (gift_id, sender_session_id, sender_user_id, receiver_session_id, receiver_user_id, purchase_price_credits, personal_message)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [gift_id, sender_session_id, sender_user_id, receiver_session_id, receiver_user_id, gift.price_credits, personal_message]
        );

        const userGift = userGiftResult.rows[0];

        // Записываем транзакцию покупки
        await client.query(
            `INSERT INTO gift_transactions 
             (session_id, user_id, transaction_type, gift_id, user_gift_id, credits_spent, related_user_id, description)
             VALUES ($1, $2, 'purchase', $3, $4, $5, $6, $7)`,
            [sender_session_id, sender_user_id, gift_id, userGift.id, gift.price_credits, receiver_user_id, `Purchased ${gift.name} for ${receiver_user_id || 'user'}`]
        );

        // Записываем транзакцию получения для получателя
        await client.query(
            `INSERT INTO gift_transactions 
             (session_id, user_id, transaction_type, gift_id, user_gift_id, related_user_id, description)
             VALUES ($1, $2, 'receive', $3, $4, $5, $6)`,
            [receiver_session_id, receiver_user_id, gift_id, userGift.id, sender_user_id, `Received ${gift.name} from ${sender_user_id || 'user'}`]
        );

        // Создаем уведомление для получателя
        await client.query(
            `INSERT INTO user_notifications 
             (session_id, user_id, type, title, message, related_gift_id, related_user_id)
             VALUES ($1, $2, 'gift_received', $3, $4, $5, $6)`,
            [receiver_session_id, receiver_user_id, '🎁 You received a gift!', 
             `${sender_user_id || 'Someone'} sent you a ${gift.name}${personal_message ? ': "' + personal_message + '"' : ''}`, 
             gift_id, sender_user_id]
        );

        // Записываем транзакцию кошелька только для обычных пользователей
        if (!isSystemSender) {
            await client.query(
                `INSERT INTO wallet_transactions 
                 (wallet_id, user_id, transaction_type, amount, description, status)
                 VALUES ((SELECT id FROM user_wallets WHERE session_id = $1), $2, 'purchase', $3, $4, 'completed')`,
                [sender_session_id, sender_user_id, -gift.price_credits, `Gift purchase: ${gift.name}`]
            );
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: {
                userGift: userGift,
                gift: gift,
                creditsSpent: gift.price_credits
            },
            message: 'Gift purchased and sent successfully'
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[DB] Error purchasing gift:', error);
        return {
            success: false,
            error: error.message || 'Failed to purchase gift'
        };
    } finally {
        client.release();
    }
}

// Получить полученные подарки
async function getReceivedGifts(pool, req) {
    const { session_id, status } = req.method === 'GET' ? req.query : req.body;

    if (!session_id) {
        return {
            success: false,
            error: 'session_id is required'
        };
    }

    try {
        let query = `
            SELECT ug.*, g.name as gift_name, g.description, g.image_url, g.category
            FROM user_gifts ug
            JOIN gifts g ON ug.gift_id = g.id
            WHERE ug.receiver_session_id = $1
        `;
        const params = [session_id];

        if (status) {
            query += ' AND ug.status = $2';
            params.push(status);
        }

        query += ' ORDER BY ug.sent_at DESC';

        const result = await pool.query(query, params);

        return {
            success: true,
            data: result.rows,
            total: result.rows.length
        };
    } catch (error) {
        console.error('[DB] Error getting received gifts:', error);
        return {
            success: false,
            error: 'Failed to get received gifts'
        };
    }
}

// Получить отправленные подарки
async function getSentGifts(pool, req) {
    const { session_id } = req.method === 'GET' ? req.query : req.body;

    if (!session_id) {
        return {
            success: false,
            error: 'session_id is required'
        };
    }

    try {
        const result = await pool.query(
            `SELECT ug.*, g.name as gift_name, g.description, g.image_url, g.category
             FROM user_gifts ug
             JOIN gifts g ON ug.gift_id = g.id
             WHERE ug.sender_session_id = $1
             ORDER BY ug.sent_at DESC`,
            [session_id]
        );

        return {
            success: true,
            data: result.rows,
            total: result.rows.length
        };
    } catch (error) {
        console.error('[DB] Error getting sent gifts:', error);
        return {
            success: false,
            error: 'Failed to get sent gifts'
        };
    }
}

// Получить транзакции подарков
async function getGiftTransactions(pool, req) {
    const { session_id, transaction_type, limit = 50, offset = 0 } = req.method === 'GET' ? req.query : req.body;

    if (!session_id) {
        return {
            success: false,
            error: 'session_id is required'
        };
    }

    try {
        let query = `
            SELECT gt.*, g.name as gift_name, g.image_url
            FROM gift_transactions gt
            LEFT JOIN gifts g ON gt.gift_id = g.id
            WHERE gt.session_id = $1
        `;
        const params = [session_id];

        if (transaction_type) {
            query += ' AND gt.transaction_type = $2';
            params.push(transaction_type);
        }

        query += ' ORDER BY gt.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM gift_transactions WHERE session_id = $1` + 
            (transaction_type ? ' AND transaction_type = $2' : ''),
            transaction_type ? [session_id, transaction_type] : [session_id]
        );

        return {
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
    } catch (error) {
        console.error('[DB] Error getting gift transactions:', error);
        return {
            success: false,
            error: 'Failed to get gift transactions'
        };
    }
}

// Монетизация подарков
async function monetizeGifts(pool, req) {
    const { session_id, user_id, gift_ids, currency = 'USD' } = req.body;

    if (!session_id || !gift_ids || !Array.isArray(gift_ids) || gift_ids.length === 0) {
        return {
            success: false,
            error: 'session_id and gift_ids array are required'
        };
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let totalUsdValue = 0;
        const monetizedGifts = [];

        for (const giftId of gift_ids) {
            // Получаем подарок
            const giftResult = await client.query(
                `SELECT ug.*, g.name, g.price_credits 
                 FROM user_gifts ug
                 JOIN gifts g ON ug.gift_id = g.id
                 WHERE ug.id = $1 AND ug.receiver_session_id = $2 AND ug.status != 'monetized'`,
                [giftId, session_id]
            );

            if (giftResult.rows.length === 0) {
                continue; // Пропускаем недоступные подарки
            }

            const gift = giftResult.rows[0];
            
            // Рассчитываем стоимость монетизации (30% от стоимости, 1 кредит = 0.1 USD)
            const usdValue = (gift.price_credits * 0.1 * 0.3);
            totalUsdValue += usdValue;

            // Обновляем статус подарка
            await client.query(
                `UPDATE user_gifts 
                 SET status = 'monetized', monetized_at = CURRENT_TIMESTAMP, 
                     monetization_value_usd = $1, monetization_currency = $2
                 WHERE id = $3`,
                [usdValue, currency, giftId]
            );

            // Записываем транзакцию монетизации
            await client.query(
                `INSERT INTO gift_transactions 
                 (session_id, user_id, transaction_type, gift_id, user_gift_id, usd_earned, currency, description)
                 VALUES ($1, $2, 'monetize', $3, $4, $5, $6, $7)`,
                [session_id, user_id, gift.gift_id, giftId, usdValue, currency, `Monetized ${gift.name} for ${usdValue} ${currency}`]
            );

            monetizedGifts.push({
                id: giftId,
                name: gift.name,
                credits: gift.price_credits,
                usd_value: usdValue
            });
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: {
                monetized_gifts: monetizedGifts,
                total_usd_value: totalUsdValue,
                currency: currency
            },
            message: `Successfully monetized ${monetizedGifts.length} gifts for ${totalUsdValue.toFixed(2)} ${currency}`
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[DB] Error monetizing gifts:', error);
        return {
            success: false,
            error: 'Failed to monetize gifts'
        };
    } finally {
        client.release();
    }
}

// Получить уведомления пользователя
async function getUserNotifications(pool, req) {
    const { session_id, is_read, limit = 50, offset = 0 } = req.method === 'GET' ? req.query : req.body;

    if (!session_id) {
        return {
            success: false,
            error: 'session_id is required'
        };
    }

    try {
        let query = 'SELECT * FROM user_notifications WHERE session_id = $1';
        const params = [session_id];

        if (is_read !== undefined) {
            query += ' AND is_read = $2';
            params.push(is_read === 'true');
        }

        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        return {
            success: true,
            data: result.rows,
            total: result.rows.length
        };
    } catch (error) {
        console.error('[DB] Error getting notifications:', error);
        return {
            success: false,
            error: 'Failed to get notifications'
        };
    }
}

// Отметить уведомление как прочитанное
async function markNotificationRead(pool, req) {
    const { session_id, notification_id } = req.body;

    if (!session_id || !notification_id) {
        return {
            success: false,
            error: 'session_id and notification_id are required'
        };
    }

    try {
        const result = await pool.query(
            'UPDATE user_notifications SET is_read = true WHERE id = $1 AND session_id = $2 RETURNING *',
            [notification_id, session_id]
        );

        if (result.rows.length === 0) {
            return {
                success: false,
                error: 'Notification not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Notification marked as read'
        };
    } catch (error) {
        console.error('[DB] Error marking notification as read:', error);
        return {
            success: false,
            error: 'Failed to mark notification as read'
        };
    }
}