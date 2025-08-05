// API для управления просмотренными профилями

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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

        if (req.method === 'GET') {
            // Получить список просмотренных профилей пользователя
            const { user_id, action } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id is required'
                });
            }

            let query = 'SELECT * FROM viewed_profiles WHERE user_id = $1';
            const params = [user_id];

            if (action) {
                query += ' AND action = $2';
                params.push(action);
            }

            query += ' ORDER BY created_at DESC';

            const result = await pool.query(query, params);
            
            await pool.end();
            res.status(200).json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });

        } else if (req.method === 'POST') {
            // Добавить просмотренный профиль
            const { user_id, profile_id, action = 'viewed' } = req.body;

            if (!user_id || !profile_id) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id and profile_id are required'
                });
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

            await pool.end();
            res.status(200).json({
                success: true,
                data: result.rows[0]
            });

        } else if (req.method === 'DELETE') {
            // Очистить историю просмотренных профилей
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id is required'
                });
            }

            const result = await pool.query(
                'DELETE FROM viewed_profiles WHERE user_id = $1',
                [user_id]
            );

            await pool.end();
            res.status(200).json({
                success: true,
                deleted_count: result.rowCount
            });
        }

    } catch (error) {
        console.error('[VIEWED-PROFILES] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to manage viewed profiles',
            details: error.message
        });
    }
}