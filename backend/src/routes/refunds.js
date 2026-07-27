const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', refundController.getAll);
router.get('/:id', refundController.getById);
router.get('/by-sale/:saleId', refundController.getBySaleId);
router.post('/', refundController.create);

module.exports = router;
