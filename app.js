const express = require('express');
const authRouter = require('./routes/auth');
const chatsRouter = require('./routes/chats');
const profileRouter = require('./routes/profile');
const dbPool = require('./util/database');
const multer = require('multer');
const io = require('./util/sockets');
const helper = require('./util/helperFunctions');

const imagesStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        if(req.url.split('/')[2] == 'messages')
            cb(null, path.join('data', 'images'));
        else if(req.url.split('/')[2] == 'profile'){
            cb(null, path.join('data', 'profilePics'));
        }
    },
    filename: async function (req, file, cb) {
        try {
            await helper.isAuth(req);
        } catch(err) {
            console.log(err);
        }
        if(req.user) {
            if(req.url.split('/')[1] == 'messages' && req.chat_Id)
                cb(null, `${new Date()}-${req.chat_Id}-${file.originalname}`);
            else
                cb(null, req.user.id + '.' + file.mimetype.split('/')[1]);
        }
        else
            cb(new Error('Not authorized!'));
    },
});
const voiceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        if(req.url.split('/')[2] == 'messages')
            cb(null, path.join('data', 'voiceRecords'));
    },
    filename: async function (req, file, cb) {
        try {
            await helper.isAuth(req);
        } catch(err) {
            console.log(err);
        }
        if(req.user) {
            if(req.url.split('/')[1] == 'messages')
                cb(null, `${new Date()}-${req.chat_Id}-${file.originalname}`);
        }
        else
            cb(new Error('Not authorized!'));
    },
});

const uploadImages = multer({
    storage: imagesStorage, 
    fileFilter: helper.imageFilter
}).single('image');

const uploadProfilePics = multer({
    storage: imagesStorage, 
    fileFilter: helper.imageFilter
}).single('profile_Pic');

const uploadVoice = multer({
    storage: voiceStorage, 
    fileFilter: function(req, file, cb) {
        if(file.mimetype == 'audio/mp3')
            cb(null, true);
        else
            cb(null, false);
    }
}).single('voice');


const app = express();

app.use(express.json());

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


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(uploadProfilePics);
app.use(uploadVoice);
app.use(uploadImages);
app.use("/api/auth", authRouter);
app.use("/api/messages", chatsRouter);
app.use("/api/profile", profileRouter);

app.use((err, req, res, next) => {
    console.log(err.message);
    res.status(500).json({msg: 'Something went wrong we are working on it.'});
});

const server = app.listen(3000);
io.init(server);
io.getIO().on('connection', io.onConnection);