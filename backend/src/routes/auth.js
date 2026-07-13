const express = require('express');
const router = express.Router();
const { login, register, getMe, logout, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/schemas');

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);
router.post('/change-password', auth, changePassword);

module.exports = router;
