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
    const result = await client.query(`
      SELECT * FROM user_messages 
      WHERE (
        (sender_id = $1 AND recipient_id = $2) OR 
        (sender_id = $2 AND recipient_id = $1)
      )
      AND session_id = $3
      ORDER BY created_at ASC
    `, [userId, contactId, sessionId]);
    
    console.log(`[MESSAGES-DB] Найдено ${result.rows.length} сообщений между ${userId} и ${contactId}`);
    return result.rows;
  } catch (error) {
    console.error('[MESSAGES-DB] Ошибка получения сообщений:', error);
    throw error;
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
        
        const messages = await getMessages(user_id, contact_id, session_id);
        
        return res.status(200).json({
          success: true,
          data: messages
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