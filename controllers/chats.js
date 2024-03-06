const Chat = require('../models/chats').Chat;


exports.getChats = (req, res, next) => {
    let chats = Chat.find({user1_Id: req.user.id});
    if(chats) res.status(200).json({chats: chats});
}

exports.getMessages = (req, res, next) => {

}

exports.sendMessage = (req, res, next) => {

}