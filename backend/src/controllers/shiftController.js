const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = ['1=1'];
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      where.push(`s.status = $${paramCount}`);
      params.push(status);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM shifts s WHERE ${where.join(' AND ')}`,
      params
    );

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const result = await db.query(
      `SELECT s.*, u.name as cashier_name
       FROM shifts s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE ${where.join(' AND ')}
       ORDER BY s.opened_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      shifts: result.rows,
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
};

exports.getById = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.*, u.name as cashier_name
       FROM shifts s LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json({ shift: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.openShift = async (req, res, next) => {
  try {
    const { opening_cash = 0, notes } = req.body;

    // Check if user already has an open shift
    const existing = await db.query(
      `SELECT id FROM shifts WHERE user_id = $1 AND status = 'open' LIMIT 1`,
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Sizda ochiq smena mavjud. Avval yoping.' });
    }

    const result = await db.query(
      `INSERT INTO shifts (user_id, opening_cash, status, notes, opened_by_name)
       VALUES ($1, $2, 'open', $3, $4) RETURNING *`,
      [req.user.id, opening_cash, notes || null, req.user.name]
    );

    await logAudit(req, 'shift_open', 'shifts', result.rows[0].id, null, JSON.stringify({ opening_cash, notes }));

    res.status(201).json({ shift: result.rows[0], message: 'Smena ochildi' });
  } catch (error) {
    next(error);
  }
};

exports.closeShift = async (req, res, next) => {
  try {
    const { closing_cash, notes } = req.body;
    const shiftId = req.params.id;

    const shift = await db.query(
      `SELECT * FROM shifts WHERE id = $1 AND user_id = $2 AND status = 'open'`,
      [shiftId, req.user.id]
    );
    if (shift.rows.length === 0) {
      return res.status(404).json({ error: 'Smena topilmadi yoki allaqachon yopilgan' });
    }

    // Get today's sales for this shift
    const shiftSales = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM sales WHERE shift_id = $1`,
      [shiftId]
    );

    const totalSales = parseFloat(shiftSales.rows[0].total || 0);
    const totalTransactions = parseInt(shiftSales.rows[0].count || 0);
    const openingCash = parseFloat(shift.rows[0].opening_cash || 0);
    const expectedCash = openingCash + totalSales;

    // Z-report data
    const paymentBreakdown = await db.query(
      `SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM sales WHERE shift_id = $1
       GROUP BY payment_method`,
      [shiftId]
    );

    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    const cashDiff = closing_cash ? parseFloat(closing_cash) - expectedCash : null;

    await db.query(
      `UPDATE shifts SET
        closed_at = ${nowExpr},
        closing_cash = $1,
        expected_cash = $2,
        cash_difference = $3,
        total_sales = $4,
        total_transactions = $5,
        status = 'closed',
        notes = COALESCE($6, notes)
       WHERE id = $7`,
      [closing_cash || expectedCash, expectedCash, cashDiff, totalSales, totalTransactions, notes || null, shiftId]
    );

    const updatedShift = await db.query('SELECT * FROM shifts WHERE id = $1', [shiftId]);

    await logAudit(req, 'shift_close', 'shifts', shiftId,
      JSON.stringify({ status: 'open', closing_cash: null }),
      JSON.stringify({ status: 'closed', closing_cash, expected_cash: expectedCash, difference: cashDiff })
    );

    res.json({
      shift: updatedShift.rows[0],
      z_report: {
        opening_cash: openingCash,
        total_sales: totalSales,
        expected_cash: expectedCash,
        closing_cash: closing_cash || expectedCash,
        difference: cashDiff,
        total_transactions: totalTransactions,
        payment_breakdown: paymentBreakdown.rows,
      },
      message: 'Smena yopildi'
    });
  } catch (error) {
    next(error);
  }
};

exports.getActiveShift = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.*, u.name as cashier_name
       FROM shifts s LEFT JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1 AND s.status = 'open'
       LIMIT 1`,
      [req.user.id]
    );
    res.json({ shift: result.rows[0] || null });
  } catch (error) {
    next(error);
  }
};

exports.zReport = async (req, res, next) => {
  try {
    const shiftId = req.params.id;
    const shift = await db.query(
      `SELECT s.*, u.name as cashier_name
       FROM shifts s LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [shiftId]
    );
    if (shift.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const paymentBreakdown = await db.query(
      `SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM sales WHERE shift_id = $1
       GROUP BY payment_method`,
      [shiftId]
    );

    const sales = await db.query(
      `SELECT s.*, u.name as cashier_name
       FROM sales s LEFT JOIN users u ON s.user_id = u.id
       WHERE s.shift_id = $1
       ORDER BY s.created_at ASC`,
      [shiftId]
    );

    const topProducts = await db.query(
      `SELECT p.name, SUM(si.quantity) as qty, SUM(si.subtotal) as total
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.shift_id = $1
       GROUP BY p.name
       ORDER BY total DESC LIMIT 10`,
      [shiftId]
    );

    res.json({
      shift: shift.rows[0],
      z_report: {
        payment_breakdown: paymentBreakdown.rows,
        top_products: topProducts.rows,
      },
      sales: sales.rows,
    });
  } catch (error) {
    next(error);
  }
};

async function logAudit(req, action, entityType, entityId, oldValue, newValue) {
  try {
    const ip = req.ip || req.connection?.remoteAddress || null;
    await db.query(
      `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, old_value, new_value, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [req.user?.id, req.user?.name, action, entityType, entityId, oldValue, newValue, ip]
    );
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

exports.logAudit = logAudit;
