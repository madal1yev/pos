const express = require('express');
const router = express.Router();
const { login, getMe, logout, updateProfile, changePassword } = require('../controllers/authController');
const { auth, canManageUsers } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginSchema } = require('../validators/schemas');

router.post('/login', validate(loginSchema), login);

// Yangi do'kon akkaunti ochish O'CHIRILGAN — hech kim interfeys yoki API
// orqali o'zi akkaunt yarata olmaydi. Yangi akkaunt faqat
// backend/users-import.json + `npm run import-users` orqali, egasining
// o'zi tomonidan qo'shiladi.
router.post('/create-store-account', (req, res) => {
  res.status(403).json({ error: "Bu funksiya o'chirilgan. Yangi akkaunt faqat tizim egasi tomonidan qo'shiladi." });
});

router.get('/me', auth, getMe);
router.post('/logout', auth, logout);
router.put('/profile', auth, updateProfile);
router.post('/change-password', auth, changePassword);

module.exports = router;
