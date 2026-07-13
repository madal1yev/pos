const express = require('express');
const router = express.Router();
const { daily, monthly, topProducts, inventory, revenue } = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/daily', daily);
router.get('/monthly', monthly);
router.get('/top-products', topProducts);
router.get('/inventory', inventory);
router.get('/revenue', revenue);

module.exports = router;
