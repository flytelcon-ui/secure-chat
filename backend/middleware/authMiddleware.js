const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    // Отримуємо токен із заголовків запиту
    const token = req.header('Authorization');
    
    if (!token) {
        return res.status(401).json({ message: 'Немає доступу. Будь ласка, увійдіть у систему.' });
    }

    try {
        // Перевіряємо токен
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user = decoded; // Додаємо дані користувача (його ID) у запит
        next(); // Пропускаємо далі
    } catch (err) {
        res.status(401).json({ message: 'Недійсний токен' });
    }
};