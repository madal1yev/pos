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
      where.push(`(name ${likeOp} $${paramCount} OR phone ${likeOp} $${paramCount})`);
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
      `SELECT id, name, phone, car_number, transport_type, status, delivered_orders, notes, address, contact_person, email, created_at, updated_at
       FROM suppliers WHERE ${where.join(' AND ')} ORDER BY name ASC LIMIT $${limitP} OFFSET $${offsetP}`,
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
    const result = await db.query(
      `SELECT id, name, phone, car_number, transport_type, status, delivered_orders, notes, address, contact_person, email, created_at, updated_at
       FROM suppliers WHERE id = $1 AND store_id = $2`,
      [req.params.id, req.user.store_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kuryer topilmadi' });
    res.json({ supplier: result.rows[0] });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, phone, car_number, transport_type, status, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Kuryer nomi majburiy' });
    const result = await db.query(
      `INSERT INTO suppliers (name, phone, car_number, transport_type, status, notes, store_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, phone || null, car_number || null, transport_type || 'car', status || 'active', notes || null, req.user.store_id]
    );
    res.status(201).json({ supplier: result.rows[0] });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, phone, car_number, transport_type, status, notes } = req.body;
    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    const existing = await db.query('SELECT id FROM suppliers WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Kuryer topilmadi' });
    const result = await db.query(
      `UPDATE suppliers SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        car_number = COALESCE($3, car_number),
        transport_type = COALESCE($4, transport_type),
        status = COALESCE($5, status),
        notes = COALESCE($6, notes),
        updated_at = ${nowExpr}
       WHERE id = $7 RETURNING *`,
      [name, phone, car_number, transport_type, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kuryer topilmadi' });
    res.json({ supplier: result.rows[0] });
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await db.query('SELECT id FROM suppliers WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Kuryer topilmadi' });
    await db.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Kuryer o\'chirildi' });
  } catch (error) { next(error); }
};

exports.incrementDelivered = async (req, res, next) => {
  try {
    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    const result = await db.query(
      `UPDATE suppliers SET delivered_orders = COALESCE(delivered_orders, 0) + 1, updated_at = ${nowExpr} WHERE id = $1 AND store_id = $2 RETURNING *`,
      [req.params.id, req.user.store_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kuryer topilmadi' });
    res.json({ supplier: result.rows[0] });
  } catch (error) { next(error); }
};
