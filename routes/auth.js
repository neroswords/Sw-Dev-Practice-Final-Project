const express = require('express');

const {register, login, getMe, reGenerateOtp, verify, logout} = require('../controllers/auth');
const {protect} = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/regenerate-otp', reGenerateOtp);
router.post('/verify', verify);
router.get('/me', protect, getMe);
router.get('/logout',protect,logout);
module.exports = router;