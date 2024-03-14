const GroupMember = require('../models/groupMembers');
const getUser = require('../util/helperFunctions').getUser;
const ChatTypes = require('../models/chats').ChatTypes;
let io;
let userSocket = new Map();
let socketToUser = new Map();

exports.init = server => {
    io = require('socket.io')(server);
    return io;
}

exports.getIO = () => {
    if(!io) {
        throw new Error('io not initialized.');
    }
    return io;
}

exports.onConnection = socket => {
    socket.on('add-user', async token => {
        const sender = await getUser(token);
        userSocket.set(sender.id, socket.id);
        socketToUser.set(socket.id, sender.id);
    });
    socket.on('send-msg', async data => {
        const sender = await getUser(data.token);
        delete sender.password_Reset_Token;
        delete sender.token_Expiry;
        delete sender.password;
        if(data.type == ChatTypes.private) {
            const recipientSocket = userSocket.get(data.user_Id);
            if(recipientSocket) {
                return socket.to(recipientSocket).emit('msg-receive', {from: sender, msg: data.message, voice: data.voice, image: data.image});
            }
        }
        else if(data.type == ChatTypes.group){
            let members = await GroupMember.find(data.group_Id);
            members.forEach(value => {
                const recipientSocket = userSocket.get(value.user_Id);
                if(recipientSocket) {
                    return socket.to(recipientSocket).emit('msg-receive', {from: sender, msg: data.message, voice: data.voice, image: data.image});
                }
            });
        }
    });
    socket.on('disconnect', () => {
        let userId = socketToUser.get(socket.id);
        socketToUser.delete(socket.id);
        userSocket.delete(userId);
    })
}