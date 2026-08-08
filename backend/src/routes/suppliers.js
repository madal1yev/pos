const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, incrementDelivered } = require('../controllers/supplierController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/delivered', incrementDelivered);

module.exports = router;
