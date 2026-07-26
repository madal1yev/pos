const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getAll, create, update, remove, bulkDelete, reorder, exportCsv, importCsv } = require('../controllers/categoryController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { categorySchema } = require('../validators/schemas');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(auth);

router.get('/', getAll);
router.post('/', validate(categorySchema), create);
router.put('/:id', validate(categorySchema.partial()), update);
router.delete('/:id', remove);
router.post('/bulk-delete', bulkDelete);
router.patch('/reorder', reorder);
router.get('/export-csv', exportCsv);
router.post('/import-csv', upload.single('file'), importCsv);

module.exports = router;
