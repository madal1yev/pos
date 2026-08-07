const express = require('express');
const router = express.Router();
const { login, pinLogin, register, getMe, logout, updateProfile, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/schemas');

router.post('/login', validate(loginSchema), login);
router.post('/pin-login', pinLogin);
router.post('/register', validate(registerSchema), register);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);
router.put('/profile', auth, updateProfile);
router.post('/change-password', auth, changePassword);

module.exports = router;
