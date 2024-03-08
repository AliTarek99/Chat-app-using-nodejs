const express = require('express');
const { check } = require('express-validator');
const chatsController = require('../controllers/chats');
const isAuth = require('../util/helperFunctions').isAuth;

const router = express.Router();

router.get('/chats', isAuth, chatsController.getChats);

router.put('/chats', isAuth, chatsController.createChat);

router.get('/messages/:chat_Id', isAuth, chatsController.getMessages);

router.put('/messages/:chat_Id', isAuth, check('message').custom((value, req) => {
    if(!value && !req.image && !req.voice)
        return false;
    return true;
}).withMessage('Failed to send message'), chatsController.sendMessage);

router.get('/groups/members', isAuth, chatsController.getMembers);

router.delete('/groups/members', isAuth, chatsController.removeMember);

router.put('/groups/memebers', isAuth, chatsController.addMember);

router.patch('groups/join_Link', isAuth, chatsController.createJoinLink);