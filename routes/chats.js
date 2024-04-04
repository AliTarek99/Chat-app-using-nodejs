const express = require('express');
const { check } = require('express-validator');
const chatsController = require('../controllers/chats');
const isAuth = require('../util/helperFunctions').isAuth;

const router = express.Router();

router.get('/chats', isAuth, chatsController.getChats);

router.put('/chats', isAuth, chatsController.createChat);

router.post('/chats', isAuth, chatsController.getMessages);

//modify group info

//delete group

router.put('/', isAuth, check('message').custom((value, {req}) => {
    if(!value && !req.file)
        return false;
    return true;
}).withMessage('Failed to send message'), chatsController.sendMessage);

router.get('/groups/members/:group_Id', isAuth, chatsController.getMembers);

router.delete('/groups/members', isAuth, chatsController.removeMember);

router.put('/groups/members', isAuth, chatsController.addMember);

router.put('/groups/members/:invite', isAuth, chatsController.addMember);

router.patch('/groups/join_Link', isAuth, chatsController.createJoinLink);

router.patch('/groups/members', isAuth, chatsController.makeAdmin);

module.exports = router;