import { query } from './database.js';

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

    try {
        const { action, payout_id, user_id, status } = req.body || req.query;

        console.log('[ADMIN-PAYOUTS] Request:', { action, payout_id, user_id, status });

        if (action === 'get_pending_payouts') {
            // Получить все pending выплаты
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
                WHERE ug.status = 'available'
                  AND ug.receiver_user_id IS NOT NULL
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

            // Mark gifts as monetized
            for (const giftId of gift_ids) {
                await query(
                    `UPDATE user_gifts 
                     SET status = 'monetized', 
                         monetized_at = CURRENT_TIMESTAMP
                     WHERE id = $1`,
                    [giftId]
                );
            }

            return res.status(200).json({
                success: true,
                message: `Approved ${gift_ids.length} gifts for payout`
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

