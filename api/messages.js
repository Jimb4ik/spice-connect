import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Инициализация таблицы сообщений
async function initMessagesTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_messages (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        recipient_id VARCHAR(255) NOT NULL,
        message_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(255),
        is_own BOOLEAN DEFAULT false
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_messages_sender ON user_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_user_messages_recipient ON user_messages(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_user_messages_created ON user_messages(created_at);
    `);
    console.log('[MESSAGES-DB] Таблица user_messages инициализирована');
  } catch (error) {
    console.error('[MESSAGES-DB] Ошибка инициализации таблицы:', error);
  } finally {
    client.release();
  }
}

// Сохранение сообщения в БД
async function saveMessage(senderUserId, recipientUserId, messageText, sessionId) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO user_messages (sender_id, recipient_id, message_text, session_id, is_own)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `, [senderUserId, recipientUserId, messageText, sessionId]);
    
    console.log('[MESSAGES-DB] Сообщение сохранено:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('[MESSAGES-DB] Ошибка сохранения сообщения:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Получение сообщений между пользователями
async function getMessages(userId, contactId, sessionId) {
  const client = await pool.connect();
  try {
    // Ищем сообщения без привязки к session_id для персистентности между сессиями
    const result = await client.query(`
      SELECT * FROM user_messages 
      WHERE (
        (sender_id = $1 AND recipient_id = $2) OR 
        (sender_id = $2 AND recipient_id = $1)
      )
      ORDER BY created_at ASC
    `, [userId, contactId]);
    
    console.log(`[MESSAGES-DB] Найдено ${result.rows.length} сообщений между ${userId} и ${contactId} (любые сессии)`);
    return result.rows;
  } catch (error) {
    console.error('[MESSAGES-DB] Ошибка получения сообщений:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Получение "сообщений-подарков" из истории транзакций
async function getGiftMessages(userId, contactId, sessionId) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT gt.created_at, g.name AS gift_name
      FROM gift_transactions gt
      LEFT JOIN gifts g ON gt.gift_id = g.id
      WHERE gt.transaction_type = 'purchase'
        AND (
              (gt.user_id = $1 AND gt.related_user_id = $2)
           OR (gt.session_id = $3 AND gt.related_user_id = $2)
        )
      ORDER BY gt.created_at ASC
    `, [userId, contactId, sessionId]);

    // Преобразуем транзакции в формат сообщений
    return result.rows.map(row => ({
      sender_id: userId,
      recipient_id: contactId,
      message_text: `Sent a gift: ${row.gift_name}`,
      created_at: row.created_at,
      session_id: sessionId,
      is_own: true
    }));
  } catch (error) {
    console.error('[MESSAGES-DB] Ошибка получения gift-сообщений:', error);
    return [];
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  // Инициализируем таблицу при первом запросе
  await initMessagesTable();
  
  const { method } = req;
  
  if (method === 'POST') {
    try {
      const { action, sender_id, recipient_id, message_text, session_id } = req.body;
      
      if (action === 'save_message') {
        if (!sender_id || !recipient_id || !message_text || !session_id) {
          return res.status(400).json({
            success: false,
            error: 'Отсутствуют обязательные поля: sender_id, recipient_id, message_text, session_id'
          });
        }
        
        const savedMessage = await saveMessage(sender_id, recipient_id, message_text, session_id);
        
        return res.status(200).json({
          success: true,
          data: savedMessage
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Неизвестное действие'
      });
      
    } catch (error) {
      console.error('[MESSAGES-API] Ошибка POST:', error);
      return res.status(500).json({
        success: false,
        error: 'Ошибка сервера при сохранении сообщения'
      });
    }
  }
  
  if (method === 'GET') {
    try {
      const { action, user_id, contact_id, session_id } = req.query;
      
      if (action === 'get_messages') {
        if (!user_id || !contact_id || !session_id) {
          return res.status(400).json({
            success: false,
            error: 'Отсутствуют обязательные параметры: user_id, contact_id, session_id'
          });
        }
        
        const [messages, giftMessages] = await Promise.all([
          getMessages(user_id, contact_id, session_id),
          getGiftMessages(user_id, contact_id, session_id)
        ]);

        // Объединяем и сортируем
        const combined = [...messages, ...giftMessages].sort((a, b) => {
          return new Date(a.created_at) - new Date(b.created_at);
        });
        
        return res.status(200).json({
          success: true,
          data: combined
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Неизвестное действие'
      });
      
    } catch (error) {
      console.error('[MESSAGES-API] Ошибка GET:', error);
      return res.status(500).json({
        success: false,
        error: 'Ошибка сервера при получении сообщений'
      });
    }
  }
  
  return res.status(405).json({
    success: false,
    error: 'Метод не поддерживается'
  });
}