const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

// Підключаємо маршрути
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes'); // <--- ПЕРЕВІР, ЧИ Є ЦЕЙ РЯДОК

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Використовуємо маршрути
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes); // <--- ПЕРЕВІР, ЧИ Є ЦЕЙ РЯДОК

app.get('/', (req, res) => {
    res.send('Сервер безпечного чату працює!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});