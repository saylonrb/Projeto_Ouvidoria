const express = require('express');
const router = express.Router();
const { processChat } = require('../controllers/chatController');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/', authenticate, processChat);

module.exports = router;

