const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.get('/', shiftController.getAll);
router.get('/active', shiftController.getActiveShift);
router.get('/:id', shiftController.getById);
router.get('/:id/z-report', shiftController.zReport);
router.post('/open', shiftController.openShift);
router.post('/:id/close', shiftController.closeShift);

module.exports = router;
