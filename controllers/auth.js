const jwt = require('jsonwebtoken');
const User = require('../models/users');
const bcrypt = require('bcrypt')
const {validationResult} = require('express-validator');

const JWT_SECRET_KEY = '1jf42983qweji1jaksgasnk-vasd'

exports.login = async (req, res, next) => {
    try {
        let user = await User.find({phone_Num: req.body.phone_Num, email: req.body.email});
        if(user && await bcrypt.compare(req.body.password, user.password)) {
            let token = jwt.sign({user_Id: user.id, email: user.email}, JWT_SECRET_KEY, {expiresIn: '1h'});
            delete user.password;
            return res.status(200).json({user, token: token});
        } 
        else {
            return res.status(401).json({msg: "Incorrect email/number or password."});
        }
    } catch(err) {
        next(err);
    }
}

exports.register = async (req, res, next) => {
    let errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ msg: 'input errors', errors: errors.array()});
    }
    try {
        let usedNumber = await User.find({phone_Num: req.body.phone_Num});
        let usedEmail = await User.find({email: req.body.email});
        if(usedEmail) {
            return res.status(409).json({msg: 'Email already used.'});
        }
        else if(usedNumber) {
            return res.status(409).json({msg: 'Phone number already used.'});
        }
        else {
            let body = req.body;
            let hashedPassword = await bcrypt.hash(body.password, 12);
            let user = new User({
                phone_Num: body.phone_Num, 
                email: body.email,
                password: hashedPassword,
                profile_Pic: body.profile_Pic,
                username: body.username,
                status: body.status
            });
            user = await user.save();
            if(user) {
                let token = jwt.sign({user_Id: user.id, email: user.email}, JWT_SECRET_KEY, {expiresIn: '1h'});
                delete user.password;
                return res.status(200).json({user, token: token});
            }
            else {
                return res.status(500).json({msg: 'Server Error!'});
            }
        }
    } catch(err) {
        next(err);
    }
}