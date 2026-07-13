const express = require('express');
const router = express.Router();
const { get, update } = require('../controllers/settingsController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', get);
router.put('/', update);

module.exports = router;
