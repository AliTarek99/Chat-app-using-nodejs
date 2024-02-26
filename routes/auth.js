const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/auth');

const router = express.Router();

router.post('/login', authController.login);

router.put('/register', [
        check('email').notEmpty().isEmail().withMessage('invalid Email.'),
        check('password').notEmpty().isLength({min: 5, max: 20}).withMessage('password length should be between 5 and 20 characters.'),
        check('phone').isMobilePhone().notEmpty().withMessage('invalid phone number!'),
        check('username').notEmpty().withMessage('username is required.')
    ], 
    authController.register
);