const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

// Робимо найпростіший тестовий запит до БД при запуску сервера
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Помилка підключення до бази даних:', err.message);
    } else {
        console.log('✅ Підключено до бази даних PostgreSQL успішно!');
    }
});

module.exports = pool;