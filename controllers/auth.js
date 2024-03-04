const jwt = require('jsonwebtoken');
const User = require('../models/users');
const bcrypt = require('bcrypt')

const JWT_SECRET_KEY = '1jf42983qweji1jaksgasnk-vasd'

exports.login = async (req, res, next) => {
    try {
        let user = await User.find(req.body.phone_Num, req.body.email, undefined);
        if(user && await bcrypt.compare(req.body.password, user.password)) {
            let token = jwt.sign({userId: user.id, email: user.email}, JWT_SECRET_KEY);
            delete user.password;
            return res.status(200).json({status: true, user, token: token});
        } 
        else {
            return res.status(401).json({msg: "Incorrect email/number or password.", status: false});
        }
    } catch(err) {
        next(err);
    }
}

exports.register = async (req, res, next) => {
    try {
        let usedNumber = await User.find(req.body.phone_Num);
        let usedEmail = await User.find(req.body.email);
        if(usedEmail) {
            return res.status(409).json({status: false, msg: 'Email already used.'});
        }
        else if(usedNumber) {
            return res.status(409).json({status: false, msg: 'Phone number already used.'});
        }
        else {
            let body = req.body;
            let user = new User({
                phone_Num: body.phone_Num, 
                email: body.email,
                password: body.password,
                profile_Pic: body.profile_Pic,
                username: body.username,
                status: body.status
            });
            user = await user.save();
            if(user) {
                let token = jwt.sign({userId: user.id, email: user.email}, JWT_SECRET_KEY);
                return res.status(200).json({status: true, user, token: token});
            }
            else {
                return res.status(500).json({status: false, msg: 'Server Error!'});
            }
        }
    } catch(err) {
        next(err);
    }
}