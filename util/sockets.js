const GroupMember = require('../models/groupMembers');
const PrivateChat = require('../models/privateChats');
const getUser = require('../util/helperFunctions').getUser;
const ChatTypes = require('../models/chats').ChatTypes;
let io;

exports.init = server => {
    io = require('socket.io')(server);
    io.userSocket = new Map();
    io.socketToUser = new Map();
    return io;
}

exports.getIO = () => {
    if(!io) {
        throw new Error('io not initialized.');
    }
    return io;
}

exports.onConnection = socket => {
    console.log('connected');
    socket.on('add-user', async data => {
        // console.log('adding user');
        const sender = await getUser(data.token);
        io.userSocket.set(sender.id, socket.id);
        io.socketToUser.set(socket.id, sender.id);
    });
    socket.on('disconnect', () => {
        let userId = io.socketToUser.get(socket.id);
        // console.log(`disconnted ${userId}`);
        io.socketToUser.delete(socket.id);
        io.userSocket.delete(userId);
    })
}