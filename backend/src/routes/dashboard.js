const express = require('express');
const router = express.Router();
const { get } = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', get);

module.exports = router;
