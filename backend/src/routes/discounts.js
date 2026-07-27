const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.get('/', discountController.getAll);
router.get('/promo-codes', discountController.getPromoCodes);
router.get('/:id', discountController.getById);
router.post('/', discountController.create);
router.put('/:id', discountController.update);
router.delete('/:id', discountController.remove);
router.post('/promo-codes', discountController.createPromoCode);
router.post('/validate-promo', discountController.validatePromoCode);

module.exports = router;
