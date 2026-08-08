const express = require('express');
const router = express.Router();
const { returnProducts, getSaleForReturn } = require('../controllers/returnController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/sale/:saleId', getSaleForReturn);
router.post('/', returnProducts);

module.exports = router;
