const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Це обов'язково для хмарних баз на зразок Neon!
    }
});

// Робимо найпростіший тестовий запит до БД при запуску сервера
pool.query('SELECT NOW()', async (err, res) => {
    if (err) {
        console.error('❌ Помилка підключення до бази даних:', err.message);
        return;
    }

    console.log('✅ Підключено до бази даних PostgreSQL успішно!');
    try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS public_key TEXT');
        console.log('✅ Колонку users.public_key перевірено');
    } catch (migrationError) {
        console.error('❌ Не вдалося перевірити users.public_key:', migrationError.message);
    }
});

module.exports = pool;