const publicKey = '45dc56f3e085146993094f22023a73d5', privateKey = 'fef96f600922fc17656542d1a0642386';
const mailjet = require('node-mailjet').apiConnect(publicKey, privateKey);
const jwt = require('jsonwebtoken');
const User = require('../models/users');

const JWT_SECRET_KEY = '1jf42983qweji1jaksgasnk-vasd'

exports.isAuth = async (req, res, next) => {
    if(req.get('Authorization')) {
        const token = req.get('Authorization');
        try {
            let decodedToken = jwt.decode(token, JWT_SECRET_KEY);
            let user = await User.find({id: decodedToken.user_Id});
            if(!user)
                throw new Error('Not Authorized!');
            req.user = user;
            if(next)
                return next();
        } catch(err) { 
            next(err);
        }
    }
};

exports.getUser = async token => {
    try {
        let decodedToken = jwt.decode(token, JWT_SECRET_KEY);
        let user = await User.find({id: decodedToken.user_Id});
        return user;
    } catch(err) { 
        next(err);
    }
};


exports.sendEmail = async (message, to) => {
    return await mailjet.post('send', {version: 'v3.1'}).request({
        Messages: [
            {
                From: {
                    Email: 'alitarek5120@gmail.com',
                    Name: 'Chat App'
                },
                To: [
                    {
                        Email: to.email,
                        Name: to.name
                    }
                ],
                Subject: message.subject,
                TextPart: message.text,
                HtmlPart: message.html
            }
        ]
    });
};

exports.imageFilter = (req, file, cb) => {
    if(file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg' || file.mimetype == 'image/png')
        cb(null, true);
    else
        cb(null, false);
}

exports.staticFileAuth = async (req, res, next) => {
    let chat_Id = req.originalUrl.split('/')[3].split('-')[1];
    if(chat_Id) {
        let found = await PrivateChat.findAllChats({id: chat_Id, sender: req.user.id});
        if(!found) {
            found = await GroupMember.find(chat_Id, req.user.id);
        }
        if(found) {
            res.setHeader('Content-Type', 'image/png');
            next();
        }
        res.status(401).json({msg: 'Unauthorized!'});
    }
}