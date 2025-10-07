// API для работы с payouts в админке
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Create database connection
    const { Pool } = await import('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const query = async (text, params) => {
        const client = await pool.connect();
        try {
            return await client.query(text, params);
        } finally {
            client.release();
        }
    };

    try {
        const { action, payout_id, user_id, status } = req.body || req.query;

        console.log('[ADMIN-PAYOUTS] Request:', { action, payout_id, user_id, status });

        if (action === 'get_pending_payouts') {
            // Simply try to query; if tables don't exist, return empty array
            try {
                const result = await query(`
                    SELECT 
                        ug.id as gift_id,
                        ug.receiver_user_id,
                        ug.purchase_price_credits,
                        ug.sent_at,
                        ug.status as gift_status,
                        g.name as gift_name,
                        g.image_url as gift_image,
                        g.price_credits
                    FROM user_gifts ug
                    JOIN gifts g ON ug.gift_id = g.id
                    WHERE ug.status IN ('sent', 'received')
                      AND ug.receiver_user_id IS NOT NULL
                      AND ug.receiver_user_id != ''
                    ORDER BY ug.sent_at DESC
                    LIMIT 100
                `);

                // Group gifts by user
                const payoutsByUser = {};
                result.rows.forEach(gift => {
                    const userId = gift.receiver_user_id;
                if (!payoutsByUser[userId]) {
                    payoutsByUser[userId] = {
                        user_id: userId,
                        gifts: [],
                        total_credits: 0,
                        total_eur_value: 0,
                        total_withdrawable: 0
                    };
                }
                
                const giftCredits = gift.price_credits;
                const giftEurValue = giftCredits * 0.20;
                const withdrawable = giftEurValue * 0.1;
                
                payoutsByUser[userId].gifts.push({
                    gift_id: gift.gift_id,
                    gift_name: gift.gift_name,
                    gift_image: gift.gift_image,
                    credits: giftCredits,
                    eur_value: giftEurValue,
                    withdrawable: withdrawable,
                    sent_at: gift.sent_at
                });
                
                payoutsByUser[userId].total_credits += giftCredits;
                payoutsByUser[userId].total_eur_value += giftEurValue;
                payoutsByUser[userId].total_withdrawable += withdrawable;
            });

            return res.status(200).json({
                success: true,
                data: Object.values(payoutsByUser)
            });
            } catch (queryError) {
                // If tables don't exist, return empty array
                console.log('[ADMIN-PAYOUTS] Tables may not exist yet:', queryError.message);
                return res.status(200).json({
                    success: true,
                    data: []
                });
            }
        }

        if (action === 'seed_payout_users') {
            // Create active female users with many gifts and payout requests
            const { user_ids } = req.body;
            
            if (!user_ids || user_ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'user_ids array is required'
                });
            }

            console.log('[ADMIN-PAYOUTS] Seeding payout users for:', user_ids);

            try {
                // 1. Create tables with proper structure from database.js
                await query(`
                    CREATE TABLE IF NOT EXISTS gifts (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        image_url VARCHAR(255) NOT NULL,
                        price_credits INTEGER NOT NULL,
                        category VARCHAR(50) NOT NULL DEFAULT 'budget',
                        sort_order INTEGER DEFAULT 0,
                        is_active BOOLEAN DEFAULT true,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                await query(`
                    CREATE TABLE IF NOT EXISTS user_gifts (
                        id SERIAL PRIMARY KEY,
                        gift_id INTEGER REFERENCES gifts(id),
                        sender_user_id VARCHAR(255),
                        sender_session_id VARCHAR(255),
                        receiver_user_id VARCHAR(255),
                        receiver_session_id VARCHAR(255),
                        purchase_price_credits INTEGER NOT NULL,
                        monetization_value_usd DECIMAL(10,2),
                        monetization_currency VARCHAR(3) DEFAULT 'USD',
                        personal_message TEXT,
                        status VARCHAR(50) DEFAULT 'sent',
                        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        received_at TIMESTAMP,
                        monetized_at TIMESTAMP
                    )
                `);

                // 2. DON'T clear old data - just add new gifts to existing ones
                console.log('[ADMIN-PAYOUTS] Adding new demo gifts without clearing existing data...');

                // 3. Insert gifts if they don't exist (check first to avoid constraint errors)
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
                    { name: 'Watch', price: 175 },
                    { name: 'Gold Chain', price: 200 },
                    { name: 'Diamond Earrings', price: 300 },
                    { name: 'Gold Ring', price: 400 },
                    { name: 'Pearl Necklace', price: 500 },
                    { name: 'Diamond Bracelet', price: 650 },
                    { name: 'Platinum Ring', price: 800 },
                    { name: 'Luxury Watch', price: 1000 },
                    { name: 'Diamond Necklace', price: 1500 },
                    { name: 'Royal Crown', price: 2500 }
                ];

                // Check if gifts already exist, if not - insert them
                for (const gift of realGifts) {
                    const existing = await query(`SELECT id FROM gifts WHERE name = $1`, [gift.name]);
                    if (existing.rows.length === 0) {
                        await query(`
                            INSERT INTO gifts (name, price_credits, image_url)
                            VALUES ($1, $2, $3)
                        `, [gift.name, gift.price, `/gifts/${gift.name.toLowerCase().replace(/\s+/g, '-')}.png`]);
                    }
                }

                let totalGiftsAdded = 0;
                let totalPayoutsAdded = 0;

                // For each active user - create FEWER gifts and payouts
                for (const userId of user_ids) {
                    // 1. Add only 3-5 received gifts (available for payout)
                    const numGifts = Math.floor(Math.random() * 3) + 3; // 3-5 gifts
                    
                    for (let i = 0; i < numGifts; i++) {
                        const randomGift = realGifts[Math.floor(Math.random() * realGifts.length)];
                        // Pick sender from EXISTING user_ids (so we have their photo/name)
                        const randomSenderId = user_ids[Math.floor(Math.random() * user_ids.length)];
                        const daysAgo = Math.floor(Math.random() * 30); // Last 30 days
                        
                        // Get gift ID from database
                        const giftResult = await query(
                            'SELECT id FROM gifts WHERE name = $1 LIMIT 1',
                            [randomGift.name]
                        );
                        
                        if (giftResult.rows.length > 0) {
                            const giftDbId = giftResult.rows[0].id;
                            
                            // Insert using existing table structure (VARCHAR user_ids, status='received')
                            await query(`
                                INSERT INTO user_gifts (gift_id, sender_user_id, receiver_user_id, purchase_price_credits, status, sent_at)
                                VALUES ($1, $2::text, $3::text, $4, 'received', CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days')
                            `, [giftDbId, randomSenderId.toString(), userId.toString(), randomGift.price]);
                            
                            // Also add to transactions table
                            await query(`
                                INSERT INTO transactions (
                                    transaction_id, from_user_id, to_user_id,
                                    type, amount, credits, details, status
                                ) VALUES (
                                    gen_random_uuid()::text, $1, $2, 
                                    'gift', $3, $4, $5, 'completed'
                                )
                            `, [randomSenderId, userId, (randomGift.price * 0.20).toFixed(2), randomGift.price, randomGift.name]);
                            
                            totalGiftsAdded++;
                        }
                    }
                    
                    // 2. Add only 1-2 payout transactions (already completed)
                    const numPayouts = Math.floor(Math.random() * 2) + 1; // 1-2 payouts
                    
                    for (let i = 0; i < numPayouts; i++) {
                        const daysAgo = Math.floor(Math.random() * 60) + 30; // 30-90 days ago
                        const amount = (Math.random() * 100 + 20).toFixed(2); // €20-€120
                        const credits = Math.floor(amount / 0.20);
                        
                        await query(`
                            INSERT INTO transactions (
                                transaction_id, from_user_id, to_user_id,
                                type, amount, credits, status, payment_method
                            ) VALUES (
                                gen_random_uuid()::text, $1, NULL, 
                                'payout', $2, $3, 'completed',
                                'Bank Transfer (OCT)'
                            )
                        `, [userId, amount, credits]);
                        
                        totalPayoutsAdded++;
                    }
                    
                    // 3. Mark 20% gifts as monetized (for completed payouts)
                    const numMonetized = Math.max(1, Math.floor(numGifts * 0.2)); // At least 1
                    
                    await query(`
                        UPDATE user_gifts 
                        SET status = 'monetized', 
                            monetized_at = CURRENT_TIMESTAMP - INTERVAL '30 days'
                        WHERE receiver_user_id = $1::text
                          AND status = 'received'
                          AND id IN (
                              SELECT id FROM user_gifts 
                              WHERE receiver_user_id = $1::text
                                AND status = 'received'
                              ORDER BY sent_at ASC
                              LIMIT $2
                          )
                    `, [userId.toString(), numMonetized]);
                }

                console.log(`[ADMIN-PAYOUTS] Added ${totalGiftsAdded} gifts and ${totalPayoutsAdded} payouts`);

                return res.status(200).json({
                    success: true,
                    message: `Created ${totalGiftsAdded} gifts and ${totalPayoutsAdded} payouts for ${user_ids.length} users`
                });
            } catch (error) {
                console.error('[ADMIN-PAYOUTS] Error seeding:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        }

        if (action === 'approve_payout') {
            // Одобрить выплату
            const { gift_ids } = req.body;
            
            if (!gift_ids || !Array.isArray(gift_ids)) {
                return res.status(400).json({
                    success: false,
                    error: 'gift_ids array is required'
                });
            }

            // Get gift details and calculate total
            const giftsResult = await query(`
                SELECT 
                    ug.id as gift_id,
                    ug.receiver_user_id,
                    ug.purchase_price_credits,
                    g.name as gift_name,
                    g.price_credits
                FROM user_gifts ug
                JOIN gifts g ON ug.gift_id = g.id
                WHERE ug.id = ANY($1)
            `, [gift_ids]);

            if (giftsResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No gifts found'
                });
            }

            // Calculate total payout amount
            const userId = giftsResult.rows[0].receiver_user_id;
            let totalEurValue = 0;
            let totalCredits = 0;

            giftsResult.rows.forEach(gift => {
                const giftEurValue = gift.price_credits * 0.20;
                const withdrawable = giftEurValue * 0.1;
                totalEurValue += withdrawable;
                totalCredits += gift.price_credits;
            });

            // 1. Create payout transaction in transactions table
            await query(`
                INSERT INTO transactions (
                    transaction_id, from_user_id, to_user_id,
                    type, amount, credits, status, payment_method, details
                ) VALUES (
                    gen_random_uuid()::text, 
                    $1, 
                    NULL,
                    'payout', 
                    $2, 
                    $3, 
                    'completed',
                    'Bank Transfer (OCT)',
                    'Gift monetization - ' || $4 || ' gifts approved'
                )
            `, [userId, totalEurValue.toFixed(2), totalCredits, gift_ids.length]);

            // 2. Mark gifts as monetized
            for (const giftId of gift_ids) {
                await query(
                    `UPDATE user_gifts 
                     SET status = 'monetized', 
                         monetized_at = CURRENT_TIMESTAMP
                     WHERE id = $1`,
                    [giftId]
                );
            }

            console.log(`[ADMIN-PAYOUTS] Approved payout for user ${userId}: €${totalEurValue.toFixed(2)} from ${gift_ids.length} gifts`);

            return res.status(200).json({
                success: true,
                message: `Approved ${gift_ids.length} gifts for payout`,
                data: {
                    user_id: userId,
                    amount: totalEurValue.toFixed(2),
                    credits: totalCredits,
                    gifts_count: gift_ids.length
                }
            });
        }

        if (action === 'reject_payout') {
            // Отклонить выплату
            const { gift_ids, reason } = req.body;
            
            if (!gift_ids || !Array.isArray(gift_ids)) {
                return res.status(400).json({
                    success: false,
                    error: 'gift_ids array is required'
                });
            }

            // Mark gifts as rejected (keep as available but add note)
            for (const giftId of gift_ids) {
                await query(
                    `UPDATE user_gifts 
                     SET status = 'rejected',
                         rejection_reason = $1,
                         rejection_date = CURRENT_TIMESTAMP
                     WHERE id = $2`,
                    [reason || 'Payout rejected by admin', giftId]
                );
            }

            return res.status(200).json({
                success: true,
                message: `Rejected ${gift_ids.length} gifts`
            });
        }

        // Reset user gifts back to 'received' status (to undo monetization)
        if (action === 'reset_user_gifts') {
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id is required'
                });
            }

            console.log(`[ADMIN-PAYOUTS] Resetting gifts for user ${user_id} to 'received' status...`);

            await query(`
                UPDATE user_gifts 
                SET status = 'received',
                    monetized_at = NULL
                WHERE receiver_user_id = $1::text
                  AND status = 'monetized'
            `, [user_id]);

            return res.status(200).json({
                success: true,
                message: `Reset gifts for user ${user_id}`
            });
        }

        return res.status(400).json({
            success: false,
            error: 'Invalid action'
        });

    } catch (error) {
        console.error('[ADMIN-PAYOUTS] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

