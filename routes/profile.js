const express = require('express');
const { check } = require('express-validator');
const profileController = require('../controllers/profile');
const isAuth = require('../util/helperFunctions').isAuth;

const router = express.Router();

router.get('/change-password', profileController.getPasswordReset);

router.patch('/change-password/:token',
    check('password').notEmpty().isLength({min: 5, max: 20}).withMessage('password length should be between 5 and 20 characters.'), 
    profileController.patchPassword
);

router.patch('/account-info', [
        check('email').notEmpty().isEmail().withMessage('invalid Email.'),
        check('phone').isMobilePhone().notEmpty().withMessage('invalid phone number!'),
        check('username').notEmpty().withMessage('username is required.')
    ], 
    isAuth,
    profileController.modifyAccountInfo
);

module.exports = router;