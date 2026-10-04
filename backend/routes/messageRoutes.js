const express = require('express');
const router = express.Router();
const { getUsers, sendMessage, getMessages, editMessage, deleteMessage, pingStatus, setTyping } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/users', authMiddleware, getUsers);
router.post('/send', authMiddleware, sendMessage);
router.get('/:chatWithUserId', authMiddleware, getMessages);

// Нові маршрути для сучасних фіч
router.put('/:msgId', authMiddleware, editMessage);
router.delete('/:msgId', authMiddleware, deleteMessage);
router.post('/ping', authMiddleware, pingStatus);
router.post('/typing', authMiddleware, setTyping);

module.exports = router;