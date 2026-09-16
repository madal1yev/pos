const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = ['store_id = $1'];
    let params = [req.user.store_id];
    let paramCount = 1;

    if (search) {
      paramCount++;
      const likeOp = db.isSqlite ? 'LIKE' : 'ILIKE';
      where.push(`(name ${likeOp} $${paramCount} OR phone ${likeOp} $${paramCount} OR email ${likeOp} $${paramCount})`);
      params.push(`%${search}%`);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM customers WHERE ${where.join(' AND ')}`, params
    );

    paramCount++;
    const limitP = paramCount;
    paramCount++;
    const offsetP = paramCount;

    const result = await db.query(
      `SELECT * FROM customers WHERE ${where.join(' AND ')} ORDER BY name ASC LIMIT $${limitP} OFFSET $${offsetP}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      customers: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM customers WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer: result.rows[0] });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, phone, email, address, type, tax_id, notes, debt } = req.body;
    const debtVal = parseFloat(debt) || 0;
    const debtStatus = debtVal > 0 ? 'has_debt' : 'no_debt';
    const result = await db.query(
      `INSERT INTO customers (name, phone, email, address, type, tax_id, notes, debt, debt_amount, debt_status, store_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, phone || null, email || null, address || null, type || 'regular', tax_id || null, notes || null, debtVal, debtVal, debtStatus, req.user.store_id]
    );
    res.status(201).json({ customer: result.rows[0] });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, phone, email, address, type, tax_id, notes, debt } = req.body;
    const debtVal = parseFloat(debt);
    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    const existing = await db.query('SELECT id FROM customers WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    let result;
    if (!isNaN(debtVal)) {
      const debtStatus = debtVal > 0 ? 'has_debt' : 'no_debt';
      result = await db.query(
        `UPDATE customers SET name = COALESCE($1, name), phone = COALESCE($2, phone),
         email = COALESCE($3, email), address = COALESCE($4, address),
         type = COALESCE($5, type), tax_id = COALESCE($6, tax_id),
         notes = COALESCE($7, notes), debt = $8, debt_amount = $8, debt_status = $9, updated_at = ${nowExpr}
         WHERE id = $10 RETURNING *`,
        [name, phone, email, address, type, tax_id, notes, debtVal, debtStatus, req.params.id]
      );
    } else {
      result = await db.query(
        `UPDATE customers SET name = COALESCE($1, name), phone = COALESCE($2, phone),
         email = COALESCE($3, email), address = COALESCE($4, address),
         type = COALESCE($5, type), tax_id = COALESCE($6, tax_id),
         notes = COALESCE($7, notes), updated_at = ${nowExpr}
         WHERE id = $8 RETURNING *`,
        [name, phone, email, address, type, tax_id, notes, req.params.id]
      );
    }
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer: result.rows[0] });
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await db.query('SELECT id FROM customers WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Mijoz topilmadi' });
    await db.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Mijoz o\'chirildi' });
  } catch (error) { next(error); }
};
