const express = require('express');
const router = express.Router();
const { getAll, getById, create, getInvoice, cancelOrder, remove, bulkDelete } = require('../controllers/salesController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { saleSchema } = require('../validators/schemas');

router.use(auth);

router.get('/', getAll);
router.post('/', validate(saleSchema), create);
router.post('/bulk-delete', bulkDelete);
router.get('/:id', getById);
router.get('/:id/invoice', getInvoice);
router.post('/:id/cancel', cancelOrder);
router.delete('/:id', remove);

module.exports = router;
