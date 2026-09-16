const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/customerController');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

router.use(auth);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

router.put('/:id/debt', async (req, res, next) => {
  try {
    const debtAmount = parseFloat(req.body.debt_amount) || 0;
    const debtStatus = req.body.debt_status || 'no_debt';
    const result = await db.query(
      `UPDATE customers SET debt_amount = $1, debt_status = $2, debt = $3 WHERE id = $4 AND store_id = $5 RETURNING *`,
      [debtAmount, debtStatus, debtAmount, req.params.id, req.user.store_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Debt update error:', error.message);
    next(error);
  }
});

module.exports = router;
