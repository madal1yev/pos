const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);
router.use(authorize('admin'));

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, status, date_from, date_to } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const likeOp = db.isSqlite ? 'LIKE' : 'ILIKE';
    let where = ['l.store_id = $1'];
    let params = [req.user.store_id];
    let paramCount = 1;

    if (search) {
      paramCount++;
      where.push(`(l.email ${likeOp} $${paramCount} OR u.name ${likeOp} $${paramCount})`);
      params.push(`%${search}%`);
    }
    if (status) {
      paramCount++;
      where.push(`l.status = $${paramCount}`);
      params.push(status);
    }
    if (date_from) {
      paramCount++;
      where.push(`l.created_at >= $${paramCount}`);
      params.push(date_from);
    }
    if (date_to) {
      paramCount++;
      where.push(`l.created_at <= $${paramCount}`);
      params.push(date_to);
    }

    const whereClause = where.join(' AND ');

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM login_audit_logs l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE ${whereClause}`,
      params
    );

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const result = await db.query(
      `SELECT l.*, u.name as user_name FROM login_audit_logs l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      logs: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0]?.count || 0),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.count || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
