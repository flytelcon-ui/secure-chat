const pool = require('../config/db');

// Локальна пам'ять сервера для швидких статусів (щоб не перевантажувати БД)
const onlineUsers = {};
const typingUsers = {};

const getUsers = async (req, res) => {
    try {
        const users = await pool.query('SELECT id, username FROM users WHERE id != $1', [req.user.userId]);
        const now = Date.now();
        
        // Додаємо статуси до кожного користувача
        const usersWithStatus = users.rows.map(u => ({
            ...u,
            isOnline: onlineUsers[u.id] && (now - onlineUsers[u.id] < 8000), // Онлайн, якщо подавав сигнал останні 8 сек
            isTyping: typingUsers[u.id] && typingUsers[u.id].to === req.user.userId && (now - typingUsers[u.id].time < 3000)
        }));
        
        res.json(usersWithStatus);
    } catch (err) {
        res.status(500).json({ message: 'Помилка отримання користувачів' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { receiverId, encryptedText, cipherType } = req.body;
        const newMessage = await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, encrypted_text, cipher_type) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.userId, receiverId, encryptedText, cipherType]
        );
        res.status(201).json(newMessage.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Помилка відправки' });
    }
};

const getMessages = async (req, res) => {
    try {
        const { chatWithUserId } = req.params;
        const myId = req.user.userId;
        const messages = await pool.query(
            `SELECT * FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [myId, chatWithUserId]
        );
        res.json(messages.rows);
    } catch (err) {
        res.status(500).json({ message: 'Помилка отримання повідомлень' });
    }
};

// НОВЕ: Редагування повідомлення
const editMessage = async (req, res) => {
    try {
        const { msgId } = req.params;
        const { encryptedText, cipherType } = req.body;
        await pool.query(
            'UPDATE messages SET encrypted_text = $1, cipher_type = $2, is_edited = TRUE WHERE id = $3 AND sender_id = $4',
            [encryptedText, cipherType, msgId, req.user.userId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Помилка редагування' });
    }
};

// НОВЕ: Видалення повідомлення
const deleteMessage = async (req, res) => {
    try {
        const { msgId } = req.params;
        await pool.query('DELETE FROM messages WHERE id = $1 AND sender_id = $2', [msgId, req.user.userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Помилка видалення' });
    }
};

// НОВЕ: Оновлення статусу "Онлайн"
const pingStatus = (req, res) => {
    onlineUsers[req.user.userId] = Date.now();
    res.json({ success: true });
};

// НОВЕ: Оновлення статусу "Друкує..."
const setTyping = (req, res) => {
    const { receiverId } = req.body;
    typingUsers[req.user.userId] = { to: receiverId, time: Date.now() };
    res.json({ success: true });
};

module.exports = { getUsers, sendMessage, getMessages, editMessage, deleteMessage, pingStatus, setTyping };