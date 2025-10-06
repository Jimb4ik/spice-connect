// API для модерации документов в админке
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { Pool } = await import('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const { action, document_id, status, admin_notes } = req.method === 'GET' ? req.query : req.body;

        switch (action) {
            case 'get_documents': {
                // Получить все документы на модерацию
                const result = await pool.query(`
                    SELECT * FROM verification_documents 
                    ORDER BY 
                        CASE status
                            WHEN 'pending' THEN 1
                            WHEN 'additional_required' THEN 2
                            WHEN 'approved' THEN 3
                            WHEN 'rejected' THEN 4
                        END,
                        submitted_at DESC
                `);
                
                return res.json({
                    success: true,
                    data: result.rows
                });
            }

            case 'update_status': {
                // Обновить статус документа
                if (!document_id || !status) {
                    return res.status(400).json({
                        success: false,
                        error: 'document_id and status are required'
                    });
                }

                await pool.query(`
                    UPDATE verification_documents 
                    SET status = $1, admin_notes = $2, reviewed_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `, [status, admin_notes || null, document_id]);
                
                return res.json({
                    success: true,
                    message: 'Document status updated'
                });
            }

            case 'seed_documents': {
                // Наполнить БД документами на модерацию
                console.log('[ADMIN] Seeding verification documents...');
                
                // Создаем таблицу если её нет
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS verification_documents (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        document_type VARCHAR(50) NOT NULL,
                        document_url TEXT,
                        status VARCHAR(50) DEFAULT 'pending',
                        admin_notes TEXT,
                        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        reviewed_at TIMESTAMP
                    )
                `);

                // Получаем реальных пользователей (больше для модерации)
                const apiKey = process.env.SPICE_API_KEY;
                const usersResponse = await fetch(`https://dev2018.de5a7.com/index_api/search?api_key=${apiKey}&page=0&pas=200&is_photo=1`);
                const usersData = await usersResponse.json();
                const users = usersData.result || [];
                
                if (users.length === 0) {
                    return res.status(500).json({
                        success: false,
                        error: 'No users found'
                    });
                }

                const statuses = [
                    { name: 'pending', weight: 40 },
                    { name: 'approved', weight: 30 },
                    { name: 'rejected', weight: 15 },
                    { name: 'additional_required', weight: 15 }
                ];

                const documentTypes = ['passport', 'id_card', 'driver_license'];
                const rejectionReasons = [
                    'Document is blurry or unreadable',
                    'Document has expired',
                    'Name does not match profile',
                    'Photo quality is too low',
                    'Document appears to be edited'
                ];
                const additionalRequests = [
                    'Please provide a clearer photo',
                    'Please upload both front and back',
                    'Please provide an unexpired document',
                    'Please ensure all corners are visible'
                ];

                const getWeightedRandomStatus = () => {
                    const total = statuses.reduce((sum, s) => sum + s.weight, 0);
                    let random = Math.random() * total;
                    for (const status of statuses) {
                        random -= status.weight;
                        if (random <= 0) return status.name;
                    }
                    return 'pending';
                };

                const documents = [];
                
                // Берем 150 случайных пользователей
                const selectedUsers = users.sort(() => 0.5 - Math.random()).slice(0, 150);
                
                for (const user of selectedUsers) {
                    const status = getWeightedRandomStatus();
                    const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
                    const daysAgo = Math.floor(Math.random() * 30);
                    const submittedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
                    
                    let adminNotes = null;
                    let reviewedAt = null;
                    
                    if (status === 'rejected') {
                        adminNotes = rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)];
                        reviewedAt = new Date(submittedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
                    } else if (status === 'additional_required') {
                        adminNotes = additionalRequests[Math.floor(Math.random() * additionalRequests.length)];
                        reviewedAt = new Date(submittedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
                    } else if (status === 'approved') {
                        adminNotes = 'Document verified successfully';
                        reviewedAt = new Date(submittedAt.getTime() + Math.random() * 48 * 60 * 60 * 1000);
                    }

                    documents.push({
                        user_id: user.id,
                        document_type: docType,
                        document_url: `https://placeholder.com/document/${user.id}`,
                        status: status,
                        admin_notes: adminNotes,
                        submitted_at: submittedAt,
                        reviewed_at: reviewedAt
                    });
                }

                // Вставляем документы в БД
                for (const doc of documents) {
                    try {
                        await pool.query(`
                            INSERT INTO verification_documents 
                            (user_id, document_type, document_url, status, admin_notes, submitted_at, reviewed_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                        `, [
                            doc.user_id,
                            doc.document_type,
                            doc.document_url,
                            doc.status,
                            doc.admin_notes,
                            doc.submitted_at,
                            doc.reviewed_at
                        ]);
                    } catch (err) {
                        console.error('[ADMIN] Error inserting document:', err.message);
                    }
                }

                console.log('[ADMIN] Seeded', documents.length, 'verification documents');
                
                return res.json({
                    success: true,
                    message: `Seeded ${documents.length} verification documents`,
                    count: documents.length
                });
            }

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action'
                });
        }
    } catch (error) {
        console.error('[ADMIN-MODERATION] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        await pool.end();
    }
}
