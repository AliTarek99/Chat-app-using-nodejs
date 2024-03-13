const getUser = require('../util/helperFunctions').getUser;
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
        const recipientSocket = userSocket.get(data.user_Id);
        if(recipientSocket) {
            socket.to(recipientSocket).emit('msg-receive', {from: sender, msg: data.message, voice: data.voice, image: data.image});
        }
    });
    socket.on('disconnect', () => {
        let userId = socketToUser.get(socket.id);
        socketToUser.delete(socket.id);
        userSocket.delete(userId);
    })
}