const db = require('../config/db');

exports.get = async (req, res, next) => {
  try {
    try {
      if (db.isSqlite) {
        db.sqlite.exec("ALTER TABLE settings ADD COLUMN admin_telegram TEXT DEFAULT ''");
      } else {
        await db.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS admin_telegram TEXT DEFAULT ''");
      }
    } catch {}
    const result = await db.query('SELECT * FROM settings LIMIT 1');
    if (result.rows.length > 0 && result.rows[0].admin_telegram === undefined) {
      result.rows[0].admin_telegram = '';
    }
    res.json({ settings: result.rows[0] || {} });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const {
      store_name, store_address, store_phone, store_email,
      currency, currency_symbol, tax_percentage,
      receipt_header, receipt_footer, low_stock_threshold, logo_url, admin_telegram
    } = req.body;

    const existing = await db.query('SELECT id FROM settings LIMIT 1');

    if (existing.rows.length === 0) {
      const insertResult = await db.query(
        `INSERT INTO settings (store_name, store_address, store_phone, store_email, currency, currency_symbol, tax_percentage, receipt_header, receipt_footer, low_stock_threshold, logo_url, admin_telegram)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [store_name || 'My Store', store_address, store_phone, store_email,
          currency || 'USD', currency_symbol || '$', tax_percentage || 0,
          receipt_header, receipt_footer, low_stock_threshold || 10, logo_url, admin_telegram || '']
      );
      return res.json({ settings: insertResult.rows[0] });
    }

    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';

    const result = await db.query(
      `UPDATE settings SET 
        store_name = COALESCE($1, store_name),
        store_address = COALESCE($2, store_address),
        store_phone = COALESCE($3, store_phone),
        store_email = COALESCE($4, store_email),
        currency = COALESCE($5, currency),
        currency_symbol = COALESCE($6, currency_symbol),
        tax_percentage = COALESCE($7, tax_percentage),
        receipt_header = COALESCE($8, receipt_header),
        receipt_footer = COALESCE($9, receipt_footer),
        low_stock_threshold = COALESCE($10, low_stock_threshold),
        logo_url = COALESCE($11, logo_url),
        admin_telegram = COALESCE($12, admin_telegram),
        updated_at = ${nowExpr}
       WHERE id = (SELECT id FROM settings LIMIT 1) RETURNING *`,
      [store_name || null, store_address || null, store_phone || null, store_email || null,
        currency || null, currency_symbol || null, tax_percentage || null,
        receipt_header || null, receipt_footer || null, low_stock_threshold || null, logo_url || null, admin_telegram || null]
    );

    res.json({ settings: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
