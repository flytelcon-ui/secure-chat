const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Це обов'язково для хмарних баз на зразок Neon!
    }
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