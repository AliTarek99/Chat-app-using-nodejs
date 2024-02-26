const express = require('express');
const { check } = require('express-validator');
const chatsController = require('../controllers/chats');

const router = express.Router();

router.get('/chats', chatsController.getChats); // must be authenticated

router.get('/messages/:chatId', chatsController.getMessages); // must be authenticated

router.put('/messages/:chatId', check('message').custom((value, req) => {
    if(!value && !req.image && !req.voice)
        return false;
    return true;
}).withMessage('Failed to send message'), chatsController.sendMessage); // must be authenticated