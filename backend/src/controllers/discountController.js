const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { is_active } = req.query;
    let where = '1=1';
    let params = [];
    if (is_active !== undefined) {
      where = 'd.is_active = $1';
      params.push(is_active === 'true' ? 1 : 0);
    }
    const result = await db.query(
      `SELECT d.*,
        (SELECT COUNT(*) FROM promo_codes pc WHERE pc.discount_id = d.id) as promo_count
       FROM discounts d WHERE ${where} ORDER BY d.created_at DESC`,
      params
    );
    res.json({ discounts: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM discounts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Discount not found' });

    const promos = await db.query('SELECT * FROM promo_codes WHERE discount_id = $1', [req.params.id]);
    res.json({ discount: { ...result.rows[0], promo_codes: promos.rows } });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type, value, min_purchase, max_discount, start_date, end_date } = req.body;
    const result = await db.query(
      `INSERT INTO discounts (name, type, value, min_purchase, max_discount, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, type, value, min_purchase || 0, max_discount || null, start_date || null, end_date || null]
    );

    // Log audit - safely handle if table doesn't exist
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, new_value)
         VALUES ($1, $2, 'discount_create', 'discounts', $3, $4)`,
        [req.user.id, req.user.name, result.rows[0].id, JSON.stringify({ name, type, value })]
      );
    } catch (auditErr) {
      // audit_logs table might not exist yet, ignore
    }

    res.status(201).json({ discount: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const current = await db.query('SELECT * FROM discounts WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Discount not found' });

    const { name, type, value, min_purchase, max_discount, start_date, end_date, is_active } = req.body;
    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    const result = await db.query(
      `UPDATE discounts SET
        name = COALESCE($1, name), type = COALESCE($2, type), value = COALESCE($3, value),
        min_purchase = COALESCE($4, min_purchase), max_discount = COALESCE($5, max_discount),
        start_date = COALESCE($6, start_date), end_date = COALESCE($7, end_date),
        is_active = COALESCE($8, is_active), updated_at = ${nowExpr}
       WHERE id = $9 RETURNING *`,
      [name, type, value, min_purchase, max_discount, start_date, end_date, is_active, req.params.id]
    );

    // Log audit - safely handle if table doesn't exist
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, old_value, new_value)
         VALUES ($1, $2, 'discount_update', 'discounts', $3, $4, $5)`,
        [req.user.id, req.user.name, req.params.id,
          JSON.stringify(current.rows[0]), JSON.stringify(result.rows[0])]
      );
    } catch (auditErr) {
      // audit_logs table might not exist yet, ignore
    }

    res.json({ discount: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM discounts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Discount deleted' });
  } catch (error) {
    next(error);
  }
};

// Promo codes
exports.createPromoCode = async (req, res, next) => {
  try {
    const { code, discount_id, max_uses } = req.body;
    const result = await db.query(
      `INSERT INTO promo_codes (code, discount_id, max_uses)
       VALUES ($1, $2, $3) RETURNING *`,
      [code.toUpperCase(), discount_id, max_uses || 0]
    );
    res.status(201).json({ promo_code: result.rows[0] });
  } catch (error) {
    if (error.code === '23505' || error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Bu promo-kod allaqachon mavjud' });
    }
    next(error);
  }
};

exports.validatePromoCode = async (req, res, next) => {
  try {
    const { code, order_total } = req.body;
    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';

    // Find promo code
    const result = await db.query(
      `SELECT pc.*, d.name as discount_name, d.type, d.value, d.min_purchase, d.max_discount, d.start_date, d.end_date
       FROM promo_codes pc
       JOIN discounts d ON pc.discount_id = d.id
       WHERE pc.code = $1 AND pc.is_active = $2 AND d.is_active = $3`,
      [code.toUpperCase(), 1, 1]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Promo-kod topilmadi yoki muddati o\'tgan' });
    }

    const promo = result.rows[0];

    // Check max uses
    if (promo.max_uses > 0 && promo.current_uses >= promo.max_uses) {
      return res.status(400).json({ valid: false, error: 'Promo-kod ishlatilish soni chegarasiga yetdi' });
    }

    // Check date validity
    const now = new Date();
    if (promo.start_date && new Date(promo.start_date) > now) {
      return res.status(400).json({ valid: false, error: 'Promo-kod hali ishga tushmagan' });
    }
    if (promo.end_date && new Date(promo.end_date) < now) {
      return res.status(400).json({ valid: false, error: 'Promo-kod muddati o\'tgan' });
    }

    // Check min purchase
    if (order_total && promo.min_purchase > 0 && order_total < promo.min_purchase) {
      return res.status(400).json({
        valid: false,
        error: `Minimal xarid miqdori: ${promo.min_purchase} so'm`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.type === 'percentage') {
      discountAmount = (order_total || 0) * (promo.value / 100);
    } else {
      discountAmount = promo.value;
    }

    // Apply max discount cap
    if (promo.max_discount && discountAmount > promo.max_discount) {
      discountAmount = promo.max_discount;
    }

    res.json({
      valid: true,
      discount_amount: Math.round(discountAmount),
      discount_name: promo.discount_name,
      discount_type: promo.type,
      discount_value: promo.value,
      promo_code_id: promo.id,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPromoCodes = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT pc.*, d.name as discount_name, d.type, d.value
       FROM promo_codes pc
       JOIN discounts d ON pc.discount_id = d.id
       ORDER BY pc.created_at DESC`,
      []
    );
    res.json({ promo_codes: result.rows });
  } catch (error) {
    next(error);
  }
};
