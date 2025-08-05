// Database initialization for Neon PostgreSQL
// Создание таблиц для новой системы матчинга

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

        // SQL для создания таблиц
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
                action VARCHAR(50) NOT NULL, -- 'like', 'dislike', 'viewed'
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
                matched_user_photos TEXT[], -- JSON array of photo URLs
                match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT FALSE,
                UNIQUE(user_id, matched_user_id)
            );

            -- Таблица для кэширования профилей из Search API
            CREATE TABLE IF NOT EXISTS cached_profiles (
                id SERIAL PRIMARY KEY,
                profile_id VARCHAR(255) NOT NULL,
                profile_data JSONB NOT NULL,
                page_number INTEGER NOT NULL,
                search_filters JSONB,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour')
            );

            -- Индексы для оптимизации
            CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
            CREATE INDEX IF NOT EXISTS idx_viewed_profiles_user_id ON viewed_profiles(user_id);
            CREATE INDEX IF NOT EXISTS idx_viewed_profiles_profile_id ON viewed_profiles(profile_id);
            CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
            CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date DESC);
            CREATE INDEX IF NOT EXISTS idx_cached_profiles_profile_id ON cached_profiles(profile_id);
            CREATE INDEX IF NOT EXISTS idx_cached_profiles_page_number ON cached_profiles(page_number);
            CREATE INDEX IF NOT EXISTS idx_cached_profiles_expires_at ON cached_profiles(expires_at);
        `;

        // Выполняем SQL
        await pool.query(createTablesSQL);
        
        await pool.end();

        res.status(200).json({
            success: true,
            message: 'Database tables created successfully',
            tables: [
                'user_progress',
                'viewed_profiles', 
                'matches',
                'cached_profiles'
            ]
        });

    } catch (error) {
        console.error('[DB-INIT] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Database initialization failed',
            details: error.message
        });
    }
}