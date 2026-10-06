const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

// Підключаємо маршрути
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

// Middleware
app.use(cors());

// Збільшуємо ліміт для передачі великих зашифрованих зображень (Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Використовуємо маршрути
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
    res.send('Сервер безпечного чату працює!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});