const Private = require('../models/privateChats');
const Group = require('../models/groupChats');
const Message = require('../models/messages');
const GroupMember = require('../models/groupMembers');
const { ChatTypes } = require('../models/chats');
const User = require('../models/users');
const { validationResult } = require('express-validator');

const DEFAULT_GROUP_PIC = '';

exports.getChats = async(req, res, next) => {
    try {
        let privateChats = await Private.findAllChats({sender: req.user.id});
        let groupChats = await Group.findAllChats({user_Id: req.user.id});
        res.status(200).json({privateChats: privateChats, groupChats: groupChats});
    } catch(err) {
        next(err);
    }
}

exports.createChat = async (req, res, next) => {
    if(req.body.type == ChatTypes.group) {
        if(!req.body.name) {
            return res.status(400).json({msg: 'Group name is required!'});
        }
        try {
            let chat = new Group({group_Pic: req.body.group_Pic || DEFAULT_GROUP_PIC, description: req.body.description || '', name: req.body.name});
            chat = await chat.save();
            if(!chat) {
                throw new Error('Error while creating the group.');
            }
            let groupMember = new GroupMember({group_Id: chat[0].id, user_Id: req.user.id, admin: true});
            await groupMember.save();
            if(!groupMember) {
                throw new Error('Error adding member to the group!');
            }
            res.status(201).json({msg: 'Group created successfully.', group: chat[0]});
        } catch(err) {
            next(err);
        }
    }
    else if(req.body.type == ChatTypes.private){
        if(!req.body.phone_Num && !req.body.email && req.body.recipient_Id) {
            return res.status(400).json({msg: 'Missing recipient data.'});
        }
        try {
            let recipient = await User.find({phone_Num: req.body.phone_Num, id: req.body.recipient_Id, email: req.body.email});
            if(!recipient) {
                return res.status(400).json({msg: 'Invalid recipient data.'});
            }
            let found = await Private.findAllChats({sender: req.user.id, recipient: recipient.id});
            if(found.length) {
                return res.status(200).json({msg: 'Chat already exists', chat: found[0]});
            }
            let chat = new Private({user1_Id: req.user.id, user2_Id: recipient.id});
            chat = await chat.save();
            if(!chat) {
                throw new Error('Error while creating chat.');
            }
            return res.status(201).json({msg: 'Chat created successfully', chat: chat[0]});
        } catch(err) {
            next(err);
        }
    }
    else {
        return res.status(400).json({msg: 'Invalid chat type.'});
    }
}

exports.getMessages = async (req, res, next) => {
    try{
        let authenticated = await GroupMember.find(req.params.chat_Id, req.user.id) || Private.findAllChats(req.user.id, req.params.chat_Id);
        if(authenticated) {
            let msgs = await Message.getChat(req.params.chat_Id, req.limit, req.skip);
            if(msgs) {
                return res.status(200).json({messages: msgs});
            }
            return res.status(404).json({msg: 'No messages found!'});
        }
        return res.status(401).json({msg: 'No chat found!'});
    } catch(err) {
        next(err);
    }
}

exports.sendMessage = async (req, res, next) => {
    let errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({msg: errors.array()[0].msg});
    }
    try {
        let recipient = await User.find({phone_Num: req.body.phone_Num, id: req.body.user_Id});
        if(!recipient) {
            return res.status(200).json({msg: 'User not found.'});
        }
        let message = new Message({sender_Id: req.user.id ,chat_Id: req.body.chat_Id, image: (req.file? req.file.path: undefined), voice: (req.file? req.file.path: undefined), message: req.body.message});
        await message.save();
        return res.status(201).json({msg: 'Message created successfully.'});
    } catch(err) {
        next(err);
    }
}

exports.getMembers = async (req, res, next) => {
    if(!req.params.group_Id) {
        return res.status(400).json({msg: 'Missing group ID.'});
    }
    try {
        let member = await GroupMember.find(req.params.group_Id, req.user.id);
        member = member[0];
        if(member) {
            let members = await GroupMember.find(req.params.group_Id);
            return res.status(200).json({members: members});
        }
        return res.status(401).json({msg: 'Unauthorized.'});
    } catch(err) {
        next(err);
    }
}

exports.removeMember = async (req, res, next) => {
    if(!req.body.group_Id) {
        return res.status(400).json({msg: 'Missing required info.'});
    }
    if(!req.body.user_Id) {
        req.body.user_Id = await User.find({phone_Num: req.body.phone_Num});
        if(req.body.user_Id)
            req.body.user_Id = req.body.user_Id.id;
        else return res.status(400).json({msg: 'User not found!'});
    }
    try{
        let member = await GroupMember.find(req.body.group_Id, req.user.id);
        member = member[0];
        if(member && member.admin) {
            let result = await GroupMember.delete(req.body.group_Id, req.body.user_Id);
            if(result) {
                return res.status(200).json({msg: 'Removed successfully.'});
            }
            return res.status(200).json({msg: 'User not found.'});
        }
        return res.status(401).json({msg: 'Unauthorized.'});
    } catch(err) {
        next(err);
    }
}

exports.addMember = async (req, res, next) => {
    if(req.query.invite) {
        // join using invite link
    }
    else {
        let member = await GroupMember.find(req.body.group_Id, req.user.id);
        member = member[0];
        if(!member || !member.admin) {
            return res.status(401).json({msg: 'Not authorized.'});
        }
        if(!req.body.user_Id) {
            req.body.user_Id = await User.find({phone_Num: req.body.phone_Num});
            if(req.body.user_Id)
                req.body.user_Id = req.body.user_Id.id;
            else return res.status(400).json({msg: 'User not found!'});
        }
        let newMember = await GroupMember.find(req.body.group_Id, req.body.user_Id);
        if(newMember[0]) {
            return res.status(200).json({msg: 'User already added.'});
        }
        newMember = new GroupMember({group_Id: req.body.group_Id, user_Id: req.body.user_Id, admin: false});
        await newMember.save()
        if(newMember) {
            res.status(201).json({msg:'User added successfully.'});
        }
        else {
            res.status(500).json({msg:'Something went wrong!'});
        }
    }
}

exports.makeAdmin = async (req, res, next) => {
    if(!req.body.group_Id || !req.body.user_Id || !req.body.admin) {
        return res.status(400).json({msg: 'Missing required info.'});
    }
    try {
        let member = await GroupMember.find(req.body.group_Id, req.user.id);
        member = member[0];
        if(!member || !member.admin) {
            return res.status(401).json({msg: 'Not authorized.'});
        }

    
        let result = await GroupMember.updateAdmin(req.body.group_Id, req.body.user_Id, req.body.admin)
        if(result) {
            return res.status(200).json({msg: 'Member updated Successfully.'});
        }
        else if(result === 0) {
            return res.status(400).json({msg: 'Member not found.'});
        }
        else {
            return res.status(500).json({msg: 'Something went wrong!'});
        }
    } catch(err) {
        next(err);
    }
}

exports.createJoinLink = async (req, res, next) => {
    
}