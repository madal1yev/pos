const express = require('express');
const router = express.Router();
const { getAll, getById, create, getInvoice } = require('../controllers/salesController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { saleSchema } = require('../validators/schemas');

router.use(auth);

router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/invoice', getInvoice);
router.post('/', validate(saleSchema), create);

module.exports = router;
