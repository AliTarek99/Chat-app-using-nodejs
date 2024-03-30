const User = require('../models/users');
const sendEmail = require('../util/helperFunctions').sendEmail;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const {validationResult} = require('express-validator');

exports.getPasswordReset = async (req, res, next) => {
    let user = await User.find({phone_Num: req.body.phone_Num, email: req.body.email});
    if(user) {
        crypto.randomBytes(32, async (err, buf) => {
            if(err) {
                next(err);
            }
            let tmp = buf.toString('hex');
            user.password_Reset_Token = tmp;
            user.token_Expiry = new Date() + 3600000;
            try{
                await user.save();
            } catch(err) {
                next(err);
            }
            let message = {
                Subject: 'Password Reset.',
                text: 'To your password click here. If you did not request to reset your password ignore this email.',
                html: `To your password click <a href='${req.protocol()}://${req.get('host')}/change-password/${user.password_Reset_Token}'>here</a>. If you did not request to reset your password ignore this email.`
            };
            let recipient = {
                email: user.email,
                name: user.username
            }
            sendEmail(message, recipient);
            res.status(200).json({msg: 'If email entered exists you will recieve an email.'});
        });
    }
    res.status(200).json({msg: 'If email entered exists you will recieve an email.'});
}

exports.patchPassword = async (req, res, next) => {
    let errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({msg: 'input errors', errors: errors.array()});
    }
    let user = await User.find({token: req.params.token});
    if(!user || user.token_Expiry >= new Date()) {
        return res.status(404);
    }
    user.password = await bcrypt.hash(req.body.password, 12);
    crypto.randomBytes(32, async (err, buf) => {
        if(err) {
            next(err);
        }
        let tmp = buf.toString('hex');
        user.password_Reset_Token = tmp;
        user.token_Expiry = new Date() + (3600000 * 2);
        try{
            await user.save();
        } catch(err) {
            next(err);
        }
        res.status(200).json({msg: 'Password changed successfully!'});
        let message = {
            Subject: 'Password Changed.',
            text: 'Your password has been changed, If it was not you click here to reset it. This link is valid for 2 hours only.',
            html: `Your password has been changed, If it was not you click <a href='${req.protocol()}://${req.get('host')}/change-password/${user.password_Reset_Token}'>here</a> to reset it. This link is valid for 2 hours only.`
        };
        let recipient = {
            email: user.email,
            name: user.username
        }
        sendEmail(message, recipient);
    });
}

exports.modifyAccountInfo = async (req, res, next) => {
    let errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({msg: 'input errors', errors: errors.array()});
    }
    if(req.user) {
        let user = req.user;
        user.username = req.body.username || user.username;
        user.phone_Num = req.body.phone_Num || user.phone_Num;
        user.email = req.body.email  || user.email;
        user.status = req.body.status  || user.status;
        user.profile_Pic = (req.file? req.file.path: undefined);
        let result;
        try {
            result = await user.update();
        } catch(err) {
            next(err);
        }
        if(result)
            res.status(200).json({msg: 'Modified Successfully!'});
        else 
            res.status(500).json({msg: 'Server Error!'});
    }
}