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
        const { email, password } = req.body;

        // Шукаємо користувача за email
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
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

        res.json({ message: 'Вхід успішний!', token, username: user.rows[0].username });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Помилка сервера' });
    }
};

module.exports = { register, login };