const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

// Реєстрація нового користувача
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Перевіряємо, чи існує вже такий email
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Користувач з таким email вже існує!' });
        }

        // Хешуємо пароль (щоб він не зберігався в базі у відкритому вигляді)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Зберігаємо користувача в базу
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: 'Реєстрація успішна!', user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Помилка сервера' });
    }
};

// Вхід (Логін)
const login = async (req, res) => {
    try {
        const { password } = req.body;
        const identifier = typeof req.body.identifier === 'string'
            ? req.body.identifier.trim()
            : typeof req.body.email === 'string' ? req.body.email.trim() : '';

        const user = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $1 ORDER BY CASE WHEN email = $1 THEN 0 ELSE 1 END LIMIT 1',
            [identifier]
        );
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Неправильний email або пароль' });
        }

        // Перевіряємо правильність пароля
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({ message: 'Неправильний email або пароль' });
        }

        // Генеруємо JWT токен для доступу до чату
        const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ message: 'Вхід успішний!', token, username: user.rows[0].username, userId: user.rows[0].id });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Помилка сервера' });
    }
};

const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, avatar, bio, is_name_encrypted, encrypted_name, name_cipher_type, public_key
             FROM users WHERE id = $1`,
            [req.user.userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Профіль не знайдено' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Не вдалося завантажити профіль' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
        const avatar = req.body.avatar || null;
        const bio = typeof req.body.bio === 'string' ? req.body.bio.trim() : '';
        const isNameEncrypted = req.body.is_name_encrypted === true;
        const nameCipherType = req.body.name_cipher_type;
        const encryptedName = req.body.encrypted_name;

        if (username.length < 2 || username.length > 32) {
            return res.status(400).json({ message: 'Логін має містити від 2 до 32 символів' });
        }
        if (bio.length > 240) {
            return res.status(400).json({ message: 'Опис має містити не більше 240 символів' });
        }
        if (avatar !== null && (
            typeof avatar !== 'string' ||
            Buffer.byteLength(avatar, 'utf8') > 400000 ||
            !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar) ||
            Buffer.from(avatar.split(',')[1], 'base64').length > 300 * 1024
        )) {
            return res.status(400).json({ message: 'Аватар має бути PNG, JPEG або WebP розміром до 300 КБ' });
        }
        if (isNameEncrypted && (
            !['caesar', 'transposition', 'sdes'].includes(nameCipherType) ||
            typeof encryptedName !== 'string' ||
            encryptedName.length === 0 ||
            encryptedName.length > 128
        )) {
            return res.status(400).json({ message: 'Вкажіть коректне зашифроване ім’я' });
        }
        if (isNameEncrypted && nameCipherType === 'sdes' && !/^(?:[\da-f]{2})+$/i.test(encryptedName)) {
            return res.status(400).json({ message: 'Зашифроване ім’я S-DES має бути коректним Hex-рядком' });
        }

        const result = await pool.query(
            `UPDATE users
             SET username = $1, avatar = $2, bio = $3, is_name_encrypted = $4, encrypted_name = $5, name_cipher_type = $6
             WHERE id = $7
             RETURNING id, username, email, avatar, bio, is_name_encrypted, encrypted_name, name_cipher_type`,
            [
                username,
                avatar,
                bio,
                isNameEncrypted,
                isNameEncrypted ? encryptedName : null,
                isNameEncrypted ? nameCipherType : 'none',
                req.user.userId
            ]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Профіль не знайдено' });
        res.json({ message: 'Профіль оновлено', user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'Такий логін уже зайнятий' });
        res.status(500).json({ message: 'Не вдалося оновити профіль' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
            return res.status(400).json({ message: 'Новий пароль має містити від 8 до 72 байтів' });
        }

        const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Профіль не знайдено' });

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!isCurrentPasswordValid) return res.status(400).json({ message: 'Поточний пароль неправильний' });

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.userId]);
        res.json({ message: 'Пароль змінено' });
    } catch (err) {
        res.status(500).json({ message: 'Не вдалося змінити пароль' });
    }
};

const refreshToken = async (req, res) => {
    try {
        const user = await pool.query(
            'SELECT id, username FROM users WHERE id = $1',
            [req.user.userId]
        );
        if (!user.rows.length) return res.status(404).json({ message: 'Користувача не знайдено' });

        const token = jwt.sign(
            { userId: user.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token });
    } catch (err) {
        console.error('Не вдалося оновити JWT:', err.message);
        res.status(500).json({ message: 'Не вдалося оновити токен' });
    }
};

const setPublicKey = async (req, res) => {
    const publicKey = typeof req.body.publicKey === 'string' ? req.body.publicKey.trim() : '';
    if (!/^\d+$/.test(publicKey) || BigInt(publicKey) < 1n || BigInt(publicKey) >= 101n) {
        return res.status(400).json({ message: 'Некоректний відкритий D-H ключ' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET public_key = $1 WHERE id = $2 RETURNING public_key',
            [publicKey, req.user.userId]
        );
        if (!result.rows.length) return res.status(404).json({ message: 'Користувача не знайдено' });
        res.json({ publicKey: result.rows[0].public_key });
    } catch (err) {
        res.status(500).json({ message: 'Не вдалося зберегти відкритий D-H ключ' });
    }
};

module.exports = { register, login, getProfile, updateProfile, changePassword, refreshToken, setPublicKey };