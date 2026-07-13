const express = require('express');
const router = express.Router();
const { getAll, getById, getByBarcode, create, update, remove } = require('../controllers/productController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { productSchema } = require('../validators/schemas');

router.use(auth);

router.get('/barcode/:barcode', getByBarcode);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', validate(productSchema), create);
router.put('/:id', validate(productSchema.partial()), update);
router.delete('/:id', remove);

module.exports = router;
