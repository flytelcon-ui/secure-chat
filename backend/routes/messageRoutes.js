const express = require('express');
const router = express.Router();
const { getUsers, getUserProfileById, createChatInvite, redeemChatInvite, searchUsers, addContact, updateContact, deleteContact, sendMessage, getMessages, deleteConversation, editMessage, deleteMessage, pingStatus, setTyping } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/users', authMiddleware, getUsers);
router.get('/users/:userId/profile', authMiddleware, getUserProfileById);
router.post('/invites', authMiddleware, createChatInvite);
router.post('/invites/redeem', authMiddleware, redeemChatInvite);
router.get('/users/search', authMiddleware, searchUsers);
router.post('/contacts', authMiddleware, addContact);
router.put('/contacts/:contactId', authMiddleware, updateContact);
router.delete('/contacts/:contactId', authMiddleware, deleteContact);
router.post('/send', authMiddleware, sendMessage);
router.delete('/conversation/:userId', authMiddleware, deleteConversation);
router.get('/:chatWithUserId', authMiddleware, getMessages);

// Нові маршрути для сучасних фіч
router.put('/:msgId', authMiddleware, editMessage);
router.delete('/:msgId', authMiddleware, deleteMessage);
router.post('/ping', authMiddleware, pingStatus);
router.post('/typing', authMiddleware, setTyping);

module.exports = router;