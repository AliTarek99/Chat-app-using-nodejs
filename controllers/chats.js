const Private = require('../models/privateChats');
const Group = require('../models/groupChats');
const Message = require('../models/messages');
const GroupMember = require('../models/groupMembers');
const { ChatTypes } = require('../models/chats');
const User = require('../models/users');

const DEFAULT_GROUP_PIC = '';

exports.getChats = async(req, res, next) => {
    try {
        let privateChats = await Private.findAllChats(req.user.id);
        let groupChats = await Group.findAllChats({user_Id: req.user.id});
        res.status(200).json({privateChats: privateChats, groupChats: groupChats});
    } catch(err) {
        next(err);
    }
}

exports.createChat = async (req, res, next) => {
    if(!req.body.phone_Num) {
        return res.status(400).json({msg: 'Missing phone_Num!'});
    }
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
            let groupMember = new GroupMember({group_Id: chat.id, user_Id: req.user.id, admin: true});
            await groupMember.save();
            if(!groupMember) {
                throw new Error('Error adding member to the group!');
            }
            res.status(201).json({msg: 'Group created successfully.', group: chat});
        } catch(err) {
            next(err);
        }
    }
    else if(req.body.type == ChatTypes.private){
        if(!req.body.phone_Num && !req.body.email && req.body.recipient_Id) {
            return res.status(400).json({msg: 'Missing recipient data.'});
        }
        try {
            let user = await User.find({phone_Num: req.body.phone_Num, id: req.body.recipient_Id, email: req.body.email});
            if(!user) {
                return res.status(400).json({msg: 'Invalid recipient data.'});
            }
            let chat = new Private({user1_Id: req.user.id, user2_Id: req.body.recipient_Id});
            chat = await chat.save();
            if(!chat) {
                throw new Error('Error while creating chat.');
            }
            return res.status(201).json({msg: 'Chat created successfully'});
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

}

exports.getMembers = async (req, res, next) => {
    if(!req.body.group_Id) {
        return res.status(400).json({msg: 'Missing group ID.'});
    }
    try {
        let member = await GroupMember.find(req.body.group_Id, req.user.id);
        if(member) {
            let members = await GroupMember.find(req.body.group_Id);
            return res.status(200).json({members: members});
        }
        return res.status(401).json({msg: 'Unauthorized.'});
    } catch(err) {
        next(err);
    }
}

exports.removeMember = async (req, res, next) => {
    if(!req.body.user_Id || !req.body.group_Id) {
        return res.status(400).json({msg: 'Missing required info.'});
    }
    try{
        let member = await GroupMember.find(req.body.group_Id, req.user.id);
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
        let member = await GroupMember.find(req.body.groupId, req.user.id);
        if(!member || !member.admin) {
            return res.status(401).json({msg: 'Not authenticated.'});
        }
        let newMember = await GroupMember.find(req.body.groupId, req.body.user_Id);
        if(newMember) {
            return res.status(400).json({msg: 'User already added.'});
        }
        let result = new GroupMember({group_Id: req.body.group_Id, user_Id: req.body.user_Id, admin: false});
        if(result) {
            res.status(201).json({msg:'User added successfully.'});
        }
        else {
            res.status(500).json({msg:'Something went wrong!'});
        }
    }
}

exports.createJoinLink = async (req, res, next) => {
    
}