const pool = require('../config/db');
const crypto = require('crypto');

// Локальна пам'ять сервера для швидких статусів (щоб не перевантажувати БД)
const onlineUsers = {};
const typingUsers = {};

const getUsers = async (req, res) => {
    try {
        const users = await pool.query(
              `SELECT u.id,
                    COALESCE(c.custom_name, CASE WHEN u.is_name_encrypted
                        THEN COALESCE(NULLIF(u.encrypted_name, ''), 'Зашифроване ім’я')
                        ELSE u.username
                    END) AS username,
                    CASE WHEN u.is_name_encrypted
                        THEN COALESCE(NULLIF(u.encrypted_name, ''), 'Зашифроване ім’я')
                        ELSE u.username
                    END AS profile_name,
                    u.avatar,
                    u.bio,
                    u.is_name_encrypted,
                                        (
                                                SELECT COUNT(*)::INTEGER FROM messages unread_message
                                                WHERE unread_message.sender_id = u.id
                                                    AND unread_message.receiver_id = $1
                                                    AND unread_message.is_read = FALSE
                                        ) AS unread_count,
                    (c.contact_id IS NOT NULL) AS is_contact,
                    EXISTS (
                        SELECT 1 FROM messages m
                        WHERE (m.sender_id = $1 AND m.receiver_id = u.id)
                           OR (m.sender_id = u.id AND m.receiver_id = $1)
                    ) AS has_chat
             FROM users u
             LEFT JOIN contacts c ON c.contact_id = u.id AND c.user_id = $1
             WHERE u.id != $1
               AND (c.contact_id IS NOT NULL OR EXISTS (
                   SELECT 1 FROM messages m
                   WHERE (m.sender_id = $1 AND m.receiver_id = u.id)
                      OR (m.sender_id = u.id AND m.receiver_id = $1)
               ))
             ORDER BY is_contact DESC, username`,
            [req.user.userId]
        );
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

const getUserProfileById = async (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isSafeInteger(userId) || userId <= 0 || userId === req.user.userId) {
        return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    try {
        const result = await pool.query(
            `SELECT u.id,
                    COALESCE(c.custom_name, CASE WHEN u.is_name_encrypted
                        THEN COALESCE(NULLIF(u.encrypted_name, ''), 'Зашифроване ім’я')
                        ELSE u.username
                    END) AS username,
                    CASE WHEN u.is_name_encrypted
                        THEN COALESCE(NULLIF(u.encrypted_name, ''), 'Зашифроване ім’я')
                        ELSE u.username
                    END AS profile_name,
                    u.avatar,
                    u.bio,
                    u.is_name_encrypted,
                    (c.contact_id IS NOT NULL) AS is_contact,
                    EXISTS (
                        SELECT 1 FROM messages m
                        WHERE (m.sender_id = $1 AND m.receiver_id = u.id)
                           OR (m.sender_id = u.id AND m.receiver_id = $1)
                    ) AS has_chat
             FROM users u
             LEFT JOIN contacts c ON c.contact_id = u.id AND c.user_id = $1
             WHERE u.id = $2 AND (
                 c.contact_id IS NOT NULL OR EXISTS (
                     SELECT 1 FROM messages m
                     WHERE (m.sender_id = $1 AND m.receiver_id = u.id)
                        OR (m.sender_id = u.id AND m.receiver_id = $1)
                 )
             )`,
            [req.user.userId, userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Користувача не знайдено' });

        const user = result.rows[0];
        user.isOnline = Boolean(onlineUsers[user.id] && Date.now() - onlineUsers[user.id] < 8000);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Не вдалося відкрити профіль користувача' });
    }
};

const createChatInvite = async (req, res) => {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    try {
        const result = await pool.query(
            `INSERT INTO chat_invites (token_hash, inviter_id, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '7 days')
             RETURNING expires_at`,
            [tokenHash, req.user.userId]
        );
        res.status(201).json({ token, expiresAt: result.rows[0].expires_at });
    } catch (err) {
        res.status(500).json({ message: 'Не вдалося створити посилання' });
    }
};

const redeemChatInvite = async (req, res) => {
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    if (!/^[a-f\d]{64}$/i.test(token)) {
        return res.status(400).json({ message: 'Посилання недійсне або пошкоджене' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query('BEGIN');
        transactionStarted = true;

        const redemption = await client.query(
            `UPDATE chat_invites
             SET used_at = NOW(), used_by = $2
             WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW() AND inviter_id <> $2
             RETURNING inviter_id`,
            [tokenHash, req.user.userId]
        );

        let inviterId = redemption.rows[0]?.inviter_id;
        if (!inviterId) {
            const priorRedemption = await client.query(
                'SELECT inviter_id FROM chat_invites WHERE token_hash = $1 AND used_by = $2',
                [tokenHash, req.user.userId]
            );
            inviterId = priorRedemption.rows[0]?.inviter_id;
        }

        if (!inviterId) {
            await client.query('ROLLBACK');
            transactionStarted = false;
            return res.status(410).json({ message: 'Посилання вже використали або воно прострочене' });
        }

        const profile = await client.query(
            `SELECT u.id,
                    COALESCE(c.custom_name, CASE WHEN u.is_name_encrypted
                        THEN COALESCE(NULLIF(u.encrypted_name, ''), 'Зашифроване ім’я')
                        ELSE u.username
                    END) AS username,
                    CASE WHEN u.is_name_encrypted
                        THEN COALESCE(NULLIF(u.encrypted_name, ''), 'Зашифроване ім’я')
                        ELSE u.username
                    END AS profile_name,
                    u.avatar,
                    u.bio,
                    u.is_name_encrypted,
                    (c.contact_id IS NOT NULL) AS is_contact,
                    EXISTS (
                        SELECT 1 FROM messages m
                        WHERE (m.sender_id = $1 AND m.receiver_id = u.id)
                           OR (m.sender_id = u.id AND m.receiver_id = $1)
                    ) AS has_chat
             FROM users u
             LEFT JOIN contacts c ON c.contact_id = u.id AND c.user_id = $1
             WHERE u.id = $2`,
            [req.user.userId, inviterId]
        );
        if (profile.rows.length === 0) {
            await client.query('ROLLBACK');
            transactionStarted = false;
            return res.status(410).json({ message: 'Посилання вже використали або воно прострочене' });
        }

        await client.query('COMMIT');
        transactionStarted = false;
        const user = profile.rows[0];
        user.isOnline = Boolean(onlineUsers[user.id] && Date.now() - onlineUsers[user.id] < 8000);
        res.json(user);
    } catch (err) {
        if (transactionStarted) await client.query('ROLLBACK').catch(() => {});
        res.status(500).json({ message: 'Не вдалося використати посилання' });
    } finally {
        client.release();
    }
};

const searchUsers = async (req, res) => {
    try {
        const query = req.query.q?.trim();
        if (!query) return res.json([]);

        const users = await pool.query(
              `SELECT u.id,
                    COALESCE(c.custom_name, CASE WHEN u.is_name_encrypted
                        THEN COALESCE(NULLIF(u.encrypted_name, ''), 'Зашифроване ім’я')
                        ELSE u.username
                    END) AS username,
                    CASE WHEN u.is_name_encrypted
                        THEN COALESCE(NULLIF(u.encrypted_name, ''), 'Зашифроване ім’я')
                        ELSE u.username
                    END AS profile_name,
                    u.avatar,
                    u.bio,
                    u.is_name_encrypted,
                                        (
                                                SELECT COUNT(*)::INTEGER FROM messages unread_message
                                                WHERE unread_message.sender_id = u.id
                                                    AND unread_message.receiver_id = $1
                                                    AND unread_message.is_read = FALSE
                                        ) AS unread_count,
                    (c.contact_id IS NOT NULL) AS is_contact
               FROM users u
               LEFT JOIN contacts c ON c.contact_id = u.id AND c.user_id = $1
                             WHERE u.id != $1 AND (
                                     (c.contact_id IS NOT NULL AND c.custom_name ILIKE $2)
                                     OR (u.is_name_encrypted AND COALESCE(NULLIF(u.encrypted_name, ''), 'Зашифроване ім’я') ILIKE $2)
                                     OR (NOT COALESCE(u.is_name_encrypted, false) AND u.username ILIKE $2)
                                     OR u.id::text = $3
                             )
               ORDER BY u.username
             LIMIT 50`,
                        [req.user.userId, `%${query}%`, query]
        );
        const now = Date.now();
        const usersWithStatus = users.rows.map(user => ({
            ...user,
            isOnline: onlineUsers[user.id] && (now - onlineUsers[user.id] < 8000),
            isTyping: typingUsers[user.id] && typingUsers[user.id].to === req.user.userId && (now - typingUsers[user.id].time < 3000)
        }));

        res.json(usersWithStatus);
    } catch (err) {
        res.status(500).json({ message: 'Помилка пошуку користувачів' });
    }
};

const addContact = async (req, res) => {
    const contactId = Number(req.body.contactId);
    const customName = typeof req.body.customName === 'string' ? req.body.customName.trim() : '';

    if (!Number.isSafeInteger(contactId) || contactId <= 0 || contactId === req.user.userId) {
        return res.status(400).json({ message: 'Оберіть коректного користувача' });
    }
    if (customName.length > 100) {
        return res.status(400).json({ message: 'Ім’я контакту має містити не більше 100 символів' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO contacts (user_id, contact_id, custom_name)
             SELECT $1, id, COALESCE(NULLIF($3, ''), username) FROM users WHERE id = $2
             ON CONFLICT (user_id, contact_id)
             DO UPDATE SET custom_name = EXCLUDED.custom_name
             RETURNING contact_id, custom_name`,
            [req.user.userId, contactId, customName]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Користувача не знайдено' });
        res.status(201).json({ contact: result.rows[0] });
    } catch (err) {
        res.status(500).json({ message: 'Не вдалося додати контакт' });
    }
};

const updateContact = async (req, res) => {
    const contactId = Number(req.params.contactId);
    const customName = typeof req.body.customName === 'string' ? req.body.customName.trim() : '';

    if (!Number.isSafeInteger(contactId) || contactId <= 0) {
        return res.status(400).json({ message: 'Оберіть коректного користувача' });
    }
    if (!customName || customName.length > 100) {
        return res.status(400).json({ message: 'Ім’я контакту має містити від 1 до 100 символів' });
    }

    try {
        const result = await pool.query(
            `UPDATE contacts SET custom_name = $1 WHERE user_id = $2 AND contact_id = $3
             RETURNING contact_id, custom_name`,
            [customName, req.user.userId, contactId]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Контакт не знайдено' });
        res.json({ contact: result.rows[0] });
    } catch (err) {
        res.status(500).json({ message: 'Не вдалося змінити контакт' });
    }
};

const deleteContact = async (req, res) => {
    const contactId = Number(req.params.contactId);

    if (!Number.isSafeInteger(contactId) || contactId <= 0) {
        return res.status(400).json({ message: 'Оберіть коректного користувача' });
    }

    try {
        const result = await pool.query(
            'DELETE FROM contacts WHERE user_id = $1 AND contact_id = $2 RETURNING contact_id',
            [req.user.userId, contactId]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Контакт не знайдено' });
        res.json({ message: 'Контакт видалено' });
    } catch (err) {
        res.status(500).json({ message: 'Не вдалося видалити контакт' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { receiverId, encryptedText, cipherType } = req.body;
        const newMessage = await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, encrypted_text, cipher_type, is_read) VALUES ($1, $2, $3, $4, FALSE) RETURNING *',
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
        await pool.query(
            'UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE',
            [chatWithUserId, myId]
        );
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

const deleteConversation = async (req, res) => {
    const otherUserId = Number(req.params.userId);
    if (!Number.isSafeInteger(otherUserId) || otherUserId <= 0 || otherUserId === req.user.userId) {
        return res.status(400).json({ message: 'Оберіть коректного співрозмовника' });
    }

    try {
        const result = await pool.query(
            `DELETE FROM messages
             WHERE (sender_id = $1 AND receiver_id = $2)
                OR (sender_id = $2 AND receiver_id = $1)`,
            [req.user.userId, otherUserId]
        );
        res.json({ success: true, deletedCount: result.rowCount });
    } catch (err) {
        res.status(500).json({ message: 'Не вдалося видалити переписку' });
    }
};

// ОНОВЛЕНО: Редагування повідомлення з детальними помилками
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
        // Виводимо точну помилку в консоль сервера
        console.error('Помилка редагування в БД:', err.message);
        res.status(500).json({ message: 'Помилка сервера при редагуванні: ' + err.message });
    }
};

// Видалення повідомлення
const deleteMessage = async (req, res) => {
    try {
        const { msgId } = req.params;
        await pool.query('DELETE FROM messages WHERE id = $1 AND sender_id = $2', [msgId, req.user.userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Помилка видалення' });
    }
};

// Оновлення статусу "Онлайн"
const pingStatus = (req, res) => {
    onlineUsers[req.user.userId] = Date.now();
    res.json({ success: true });
};

// Оновлення статусу "Друкує..."
const setTyping = (req, res) => {
    const { receiverId } = req.body;
    typingUsers[req.user.userId] = { to: receiverId, time: Date.now() };
    res.json({ success: true });
};

module.exports = { getUsers, getUserProfileById, createChatInvite, redeemChatInvite, searchUsers, addContact, updateContact, deleteContact, sendMessage, getMessages, deleteConversation, editMessage, deleteMessage, pingStatus, setTyping };