const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);
router.use(authorize('admin'));

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, entity_type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = ['1=1'];
    let params = [];
    let paramCount = 0;

    if (action) {
      paramCount++;
      where.push(`action = $${paramCount}`);
      params.push(action);
    }
    if (entity_type) {
      paramCount++;
      where.push(`entity_type = $${paramCount}`);
      params.push(entity_type);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM audit_logs WHERE ${where.join(' AND ')}`,
      params
    );

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const result = await db.query(
      `SELECT * FROM audit_logs WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      logs: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
