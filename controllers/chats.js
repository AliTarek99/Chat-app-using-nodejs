const Private = require('../models/privateChats');
const Group = require('../models/groupChats');
const Message = require('../models/messages');
const GroupMember = require('../models/groupMembers');
const { ChatTypes, Chat } = require('../models/chats');
const User = require('../models/users');
const { validationResult } = require('express-validator');
const sockets = require('../util/sockets');
const GroupChats = require('../models/groupChats');
const crypto = require('crypto');
const helper = require('../util/helperFunctions');

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
            let chat = new Group({group_Pic: req.body.group_Pic || null, description: req.body.description || '', name: req.body.name});
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
        if(!req.body.phone_Num && !req.body.email && !req.body.recipient_Id) {
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
        let authenticated;

        authenticated = await GroupMember.find(req.body.chat_Id, req.user.id);
        if(!authenticated.length)
            authenticated = await Private.findAllChats({sender: req.user.id, id: req.body.chat_Id});
        if(authenticated.length) {
            let msgs = await Message.getChat(req.body.chat_Id, req.body.limit, req.body.skip);
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
        let io = sockets.getIO();
        const sender = req.user;
        delete sender.password_Reset_Token;
        delete sender.token_Expiry;
        delete sender.password;
        if(req.body.type == ChatTypes.private) {
            let recipient = await User.find({phone_Num: req.body.phone_Num, id: req.body.user_Id});
            if(!recipient) {
                return res.status(200).json({msg: 'User not found.'});
            }
            let chat = await Private.findAllChats({sender: sender.id, id: req.body.chat_Id});
            if(!chat.length) {
                throw new Error('Chat must be created first');
            }
            chat = chat[0];
            let message = new Message({sender_Id: req.user.id ,chat_Id: chat.id, image: req.file? (req.file.mimetype != 'audio/mp3' && req.file.mimetype != 'audio/mpeg' ? req.file.path: undefined): null, voice: req.file? (req.file.mimetype == 'audio/mp3' || req.file.mimetype == 'audio/mpeg'? req.file.path: undefined): null, message: req.body.message});
            let successful = await message.save();
            if(!successful) throw new Error('falied to save message');
            const recipientSocket = io.userSocket.get(req.body.user_Id);
            if(recipientSocket) {
                return io.to(recipientSocket).emit('msg-receive', message);
            }
        }
        else if(req.body.type == ChatTypes.group) {
            let members = await GroupMember.find(req.body.chat_Id);
            let auth = false;
            members.forEach(function(value) {
                if(value.id == sender.id) auth = true;
            });
            if(!auth) return;
            let message = new Message({sender_Id: req.user.id ,chat_Id: req.body.chat_Id, image: req.file? (req.file.mimetype != 'audio/mp3' && req.file.mimetype != 'audio/mpeg' ? req.file.path: undefined): null, voice: req.file? (req.file.mimetype == 'audio/mp3' || req.file.mimetype == 'audio/mpeg'? req.file.path: undefined): null, message: req.body.message});
            await message.save();
            members.forEach(value => {
                if(value.id == sender.id) return;
                const recipientSocket = io.userSocket.get(value.id);
                if(recipientSocket) {
                    return io.to(recipientSocket).emit('msg-receive', message);
                }
            });
        }
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
    if(!req.body.chat_Id || (!req.body.user_Id && !req.body.phone_Num)) {
        return res.status(400).json({msg: "Missing required info."});
    }
    if(!req.body.user_Id) {
        req.body.user_Id = await User.find({phone_Num: req.body.phone_Num});
        if(req.body.user_Id)
            req.body.user_Id = req.body.user_Id.id;
        else return res.status(400).json({msg: 'User not found!'});
    }
    try{
        let member = await GroupMember.find(req.body.chat_Id, req.user.id);
        member = member[0];
        if(member && (member.admin || req.body.user_Id == req.user.id)) {
            let result = await GroupMember.delete(req.body.chat_Id, req.body.user_Id);
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
    if(req.params.invite) {
        if(!req.user)
            return res.status(401).json({msg: 'Not authorized!'});
        let found = await GroupChats.findAllChats({join_Link: req.params.invite});
        found = found[0];
        if(found) {
            let member = new GroupMember({group_Id: found.id, user_Id: req.user.id});
            await member.save();
            res.status(201).json({found});
        }
        else {
            return res.status(400).json({msg: 'Invite link not working!'});
        }
    }
    else {
        let member = await GroupMember.find(req.body.chat_Id, req.user.id);
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
        let newMember = await GroupMember.find(req.body.chat_Id, req.body.user_Id);
        if(newMember[0]) {
            return res.status(200).json({msg: 'User already added.'});
        }
        newMember = new GroupMember({group_Id: req.body.chat_Id, user_Id: req.body.user_Id, admin: false});
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
    if(!req.body.chat_Id || !req.body.user_Id || !req.body.admin) {
        return res.status(400).json({msg: 'Missing required info.'});
    }
    try {
        let member = await GroupMember.find(req.body.chat_Id, req.user.id);
        member = member[0];
        if(!member || !member.admin) {
            return res.status(401).json({msg: 'Not authorized.'});
        }

    
        let result = await GroupMember.updateAdmin(req.body.chat_Id, req.body.user_Id, req.body.admin)
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
    const token = req.get('Authorization');
    if(token) {
        req.user_Id = await helper.getId(token);
        if(req.body.chat_Id && req.user_Id) {
            try {
                let member = await GroupMember.find(req.body.chat_Id, req.user_Id);
                member = member[0];
                if(member && member.admin) {
                    crypto.randomBytes(32, async (err, buf) => {
                        let link = buf.toString('hex');
                        let link_Expiry = req.body.link_Expiry || new Date(new Date().getTime() + 86400000);
                        let result = await GroupChats.update({id: req.body.chat_Id, link_Expiry: link_Expiry, join_Link: link});
                        if(result) {
                            res.status(201).json({join_Link: `${req.protocol}://${req.headers.host}/api/messages/groups/members/${link}`, link_Expiry: link_Expiry});
                        }
                        else 
                            res.status(500).json({msg: 'Server Error!'});
                    });
                }
                else {
                    res.status(401).json({msg: 'Unauthorized access!'});
                }
            } catch (err) {
                next(err);
            }
        }
        else {
            res.status(400).json({msg: 'Missing chat_Id!'});
        }
    }
    else {
        res.status(400).json({msg: 'Missing chat_Id!'});
    }
}