const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/completion', chatController.handleChatCompletion);

module.exports = router;