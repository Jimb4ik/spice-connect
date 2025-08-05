// API для управления прогрессом пользователя в системе матчинга

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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

        const { user_id, session_id } = req.method === 'GET' ? req.query : req.body;

        if (!user_id || !session_id) {
            return res.status(400).json({
                success: false,
                error: 'user_id and session_id are required'
            });
        }

        if (req.method === 'GET') {
            // Получить прогресс пользователя
            const result = await pool.query(
                'SELECT * FROM user_progress WHERE user_id = $1 AND session_id = $2',
                [user_id, session_id]
            );

            if (result.rows.length === 0) {
                // Создать новую запись если не существует
                const newProgress = await pool.query(
                    `INSERT INTO user_progress (user_id, session_id, current_page, profiles_per_page, last_profile_index)
                     VALUES ($1, $2, 0, 30, 0)
                     RETURNING *`,
                    [user_id, session_id]
                );

                await pool.end();
                return res.status(200).json({
                    success: true,
                    data: newProgress.rows[0],
                    is_new: true
                });
            }

            await pool.end();
            res.status(200).json({
                success: true,
                data: result.rows[0],
                is_new: false
            });

        } else if (req.method === 'POST' || req.method === 'PUT') {
            // Обновить прогресс пользователя
            const { 
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

            await pool.end();
            res.status(200).json({
                success: true,
                data: result.rows[0]
            });
        }

    } catch (error) {
        console.error('[USER-PROGRESS] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to manage user progress',
            details: error.message
        });
    }
}