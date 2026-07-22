const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = ['1=1'];
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      const likeOp = db.isSqlite ? 'LIKE' : 'ILIKE';
      where.push(`(name ${likeOp} $${paramCount} OR phone ${likeOp} $${paramCount} OR email ${likeOp} $${paramCount})`);
      params.push(`%${search}%`);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM suppliers WHERE ${where.join(' AND ')}`, params
    );

    paramCount++;
    const limitP = paramCount;
    paramCount++;
    const offsetP = paramCount;

    const result = await db.query(
      `SELECT * FROM suppliers WHERE ${where.join(' AND ')} ORDER BY name ASC LIMIT $${limitP} OFFSET $${offsetP}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      suppliers: result.rows,
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
    const result = await db.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ supplier: result.rows[0] });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, phone, email, address, contact_person, tax_id, notes } = req.body;
    const result = await db.query(
      `INSERT INTO suppliers (name, phone, email, address, contact_person, tax_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, phone || null, email || null, address || null, contact_person || null, tax_id || null, notes || null]
    );
    res.status(201).json({ supplier: result.rows[0] });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, phone, email, address, contact_person, tax_id, notes } = req.body;
    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    const result = await db.query(
      `UPDATE suppliers SET name = COALESCE($1, name), phone = COALESCE($2, phone),
       email = COALESCE($3, email), address = COALESCE($4, address),
       contact_person = COALESCE($5, contact_person), tax_id = COALESCE($6, tax_id),
       notes = COALESCE($7, notes), updated_at = ${nowExpr}
       WHERE id = $8 RETURNING *`,
      [name, phone, email, address, contact_person, tax_id, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ supplier: result.rows[0] });
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await db.query('SELECT id FROM suppliers WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    await db.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) { next(error); }
};
