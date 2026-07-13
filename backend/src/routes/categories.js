const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/categoryController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { categorySchema } = require('../validators/schemas');

router.use(auth);

router.get('/', getAll);
router.post('/', validate(categorySchema), create);
router.put('/:id', validate(categorySchema.partial()), update);
router.delete('/:id', remove);

module.exports = router;
