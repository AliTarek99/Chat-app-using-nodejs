const express = require('express');
const authRouter = require('./routes/auth');
const chatsRouter = require('./routes/chats');
const profileRouter = require('./routes/profile');
const dbPool = require('./util/database');
const multer = require('multer');
const io = require('./util/sockets');
const helper = require('./util/helperFunctions');
const path = require('path');
const PrivateChat = require('./models/privateChats');
const { ChatTypes } = require('./models/chats');
const GroupChats = require('./models/groupChats');
const GroupMember = require('./models/groupMembers');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            if(req.originalUrl.split('/')[2] == 'messages' && file.mimetype != 'audio/mp3' && file.mimetype != 'audio/mpeg') {
                cb(null, path.join('data', 'images'));
            }
            else if(req.originalUrl.split('/')[2] == 'messages' && (file.mimetype == 'audio/mp3' || file.mimetype == 'audio/mpeg'))
                cb(null, path.join('data', 'voiceRecords'));
            else if(req.originalUrl.split('/')[2] == 'profile'){
                cb(null, path.join('data', 'profilePics'));
            }
        } catch(err) {
            cb(err);
        }
    },
    filename: async function (req, file, cb) {
        try {
            await helper.isAuth(req);
            if(req.user) {
                if(req.originalUrl.split('/')[2] == 'messages') {
                    let found;
                    if(req.body.type == ChatTypes.group) {
                        found = await GroupMember.find(req.body.chat_Id, req.user.id);
                    }
                    else if(req.body.type == ChatTypes.private) {
                        found = await PrivateChat.findAllChats({sender: req.user.id, id: req.body.chat_Id})
                    }
                    if(found.length)
                        cb(null, `${new Date().getTime()}-${req.body.chat_Id}-${file.originalname}`);
                    else 
                        cb(new Error('Chat not found!'));
                }
                else if(req.originalUrl.split('/')[2] == 'profile') {
                    cb(null, req.user.id + '.' + file.mimetype.split('/')[1]);
                }
            }
            else
                cb(new Error('Not authorized!'));
        } catch(err) {
            cb(err);
        }
    },
});

const uploadImages = multer({
    storage: storage, 
    fileFilter: helper.messageFilter
}).single('media');

const uploadProfilePics = multer({
    storage: storage, 
    fileFilter: helper.imageFilter
}).single('profile_Pic');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/data/profilePics', helper.isAuth, (req, res, next) => {
    res.setHeader('Content-Type', 'image/png');
    next();
}, express.static(path.join('data', 'profilePics')));

app.use('/data/images', helper.isAuth, helper.staticFileAuth, (req, res, next) => {
    res.setHeader('Content-Type', 'image/png');
    next();
}, express.static(path.join('data', 'images')));

app.use('/data/voiceRecords', helper.isAuth, helper.staticFileAuth, (req, res, next) => {
    res.setHeader('Content-Type', 'audio/mp3');
    next();
}, express.static(path.join('data', 'voiceRecords')));


app.use("/api/auth", authRouter);
app.use("/api/messages", uploadImages, chatsRouter);
app.use("/api/profile", uploadProfilePics, profileRouter);

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({msg: 'Something went wrong we are working on it.'});
});

const server = app.listen(3000);
io.init(server);
io.getIO().on('connection', io.onConnection);