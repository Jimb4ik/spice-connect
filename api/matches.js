// API для управления матчами пользователей

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

        if (req.method === 'GET') {
            // Получить матчи пользователя
            const { user_id, limit = 50, offset = 0, unread_only = false } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id is required'
                });
            }

            let query = 'SELECT * FROM matches WHERE user_id = $1';
            const params = [user_id];

            if (unread_only === 'true') {
                query += ' AND is_read = FALSE';
            }

            query += ' ORDER BY match_date DESC LIMIT $2 OFFSET $3';
            params.push(parseInt(limit), parseInt(offset));

            const result = await pool.query(query, params);
            
            // Получить общее количество матчей
            let countQuery = 'SELECT COUNT(*) FROM matches WHERE user_id = $1';
            const countParams = [user_id];
            
            if (unread_only === 'true') {
                countQuery += ' AND is_read = FALSE';
            }
            
            const countResult = await pool.query(countQuery, countParams);
            
            await pool.end();
            res.status(200).json({
                success: true,
                data: result.rows,
                total: parseInt(countResult.rows[0].count),
                count: result.rows.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

        } else if (req.method === 'POST') {
            // Добавить новый матч
            const { 
                user_id, 
                matched_user_id, 
                matched_user_name,
                matched_user_age,
                matched_user_city,
                matched_user_photos = []
            } = req.body;

            if (!user_id || !matched_user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id and matched_user_id are required'
                });
            }

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
                    matched_user_photos = EXCLUDED.matched_user_photos,
                    match_date = CURRENT_TIMESTAMP
                 RETURNING *`,
                [user_id, matched_user_id, matched_user_name, matched_user_age, matched_user_city, JSON.stringify(matched_user_photos)]
            );

            await pool.end();
            res.status(200).json({
                success: true,
                data: result.rows[0]
            });

        } else if (req.method === 'PUT') {
            // Отметить матч как прочитанный
            const { user_id, matched_user_id, is_read = true } = req.body;

            if (!user_id || !matched_user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id and matched_user_id are required'
                });
            }

            const result = await pool.query(
                'UPDATE matches SET is_read = $3 WHERE user_id = $1 AND matched_user_id = $2 RETURNING *',
                [user_id, matched_user_id, is_read]
            );

            await pool.end();
            res.status(200).json({
                success: true,
                data: result.rows[0] || null,
                updated: result.rowCount > 0
            });

        } else if (req.method === 'DELETE') {
            // Удалить матч
            const { user_id, matched_user_id } = req.body;

            if (!user_id || !matched_user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id and matched_user_id are required'
                });
            }

            const result = await pool.query(
                'DELETE FROM matches WHERE user_id = $1 AND matched_user_id = $2',
                [user_id, matched_user_id]
            );

            await pool.end();
            res.status(200).json({
                success: true,
                deleted: result.rowCount > 0
            });
        }

    } catch (error) {
        console.error('[MATCHES] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to manage matches',
            details: error.message
        });
    }
}