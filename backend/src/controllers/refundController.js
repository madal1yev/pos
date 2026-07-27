const db = require('../config/db');
const { generateInvoiceNumber } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, from_date, to_date } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['1=1'];
    let params = [];
    let paramCount = 0;

    if (from_date) {
      paramCount++;
      where.push(`date(r.created_at) >= date($${paramCount})`);
      params.push(from_date);
    }
    if (to_date) {
      paramCount++;
      where.push(`date(r.created_at) <= date($${paramCount})`);
      params.push(to_date);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM refunds r WHERE ${where.join(' AND ')}`,
      params
    );

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const result = await db.query(
      `SELECT r.*, u.name as cashier_name,
        s.invoice_number as sale_invoice, s.customer_name
       FROM refunds r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN sales s ON r.sale_id = s.id
       WHERE ${where.join(' AND ')}
       ORDER BY r.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, parseInt(limit), offset]
    );

    // Get items for each refund
    for (const refund of result.rows) {
      const items = await db.query(
        `SELECT ri.*, p.name as product_name, p.product_code
         FROM refund_items ri
         LEFT JOIN products p ON ri.product_id = p.id
         WHERE ri.refund_id = $1`,
        [refund.id]
      );
      refund.items = items.rows;
    }

    res.json({
      refunds: result.rows,
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
      `SELECT r.*, u.name as cashier_name,
        s.invoice_number as sale_invoice, s.customer_name, s.total_amount as sale_total
       FROM refunds r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN sales s ON r.sale_id = s.id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Refund not found' });
    }
    const items = await db.query(
      `SELECT ri.*, p.name as product_name, p.product_code, p.unit
       FROM refund_items ri
       LEFT JOIN products p ON ri.product_id = p.id
       WHERE ri.refund_id = $1`,
      [req.params.id]
    );
    res.json({ refund: { ...result.rows[0], items: items.rows } });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { sale_id, items, reason } = req.body;

    if (!sale_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Sale ID and items are required' });
    }

    // Verify sale exists
    const sale = await db.query('SELECT * FROM sales WHERE id = $1', [sale_id]);
    if (sale.rows.length === 0) {
      return res.status(404).json({ error: 'Savdo topilmadi' });
    }

    // Check total already refunded for this sale
    const previousRefunds = await db.query(
      `SELECT COALESCE(SUM(ri.quantity), 0) as total_refunded
       FROM refund_items ri
       JOIN refunds r ON ri.refund_id = r.id
       WHERE r.sale_id = $1`,
      [sale_id]
    );

    // Calculate refund total and validate
    let refundAmount = 0;
    for (const item of items) {
      const product = await db.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
      if (product.rows.length === 0) {
        return res.status(404).json({ error: `Mahsulot topilmadi: ID ${item.product_id}` });
      }

      // Check original sale had this item and validate quantity
      const originalItem = await db.query(
        `SELECT * FROM sale_items WHERE sale_id = $1 AND product_id = $2`,
        [sale_id, item.product_id]
      );
      if (originalItem.rows.length === 0) {
        return res.status(400).json({ error: `${product.rows[0].name} ushbu savdoda topilmadi` });
      }

      // Validate refund quantity doesn't exceed original purchase quantity
      if (item.quantity > originalItem.rows[0].quantity) {
        return res.status(400).json({
          error: `${product.rows[0].name} uchun qaytarish miqdori (${item.quantity}) asl sotilgan miqdordan (${originalItem.rows[0].quantity}) ko'p`
        });
      }

      const subtotal = item.price * item.quantity;
      refundAmount += subtotal;
    }

    // Create refund record
    const refundResult = await db.query(
      `INSERT INTO refunds (sale_id, user_id, refund_amount, reason, status)
       VALUES ($1, $2, $3, $4, 'completed') RETURNING *`,
      [sale_id, req.user.id, refundAmount, reason || null]
    );

    const refund = refundResult.rows[0];

    // Create refund items and restore stock
    for (const item of items) {
      await db.query(
        `INSERT INTO refund_items (refund_id, product_id, quantity, price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [refund.id, item.product_id, item.quantity, item.price, item.price * item.quantity]
      );

      // Restore stock
      const product = await db.query('SELECT stock_quantity FROM products WHERE id = $1', [item.product_id]);
      const currentStock = product.rows[0].stock_quantity;
      const newStock = currentStock + item.quantity;

      const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
      await db.query(
        `UPDATE products SET stock_quantity = $1, updated_at = ${nowExpr} WHERE id = $2`,
        [newStock, item.product_id]
      );

      await db.query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity, previous_stock, new_stock, note, created_by)
         VALUES ($1, 'refund', $2, $3, $4, $5, $6)`,
        [item.product_id, item.quantity, currentStock, newStock,
          `Refund for sale #${sale.rows[0].invoice_number}`, req.user.id]
      );
    }

    // Check if all items have been fully refunded -> set to fully_refunded
    const remainingItems = await db.query(
      `SELECT si.id, si.product_id, si.quantity,
        COALESCE((SELECT SUM(ri.quantity) FROM refund_items ri
         JOIN refunds r2 ON ri.refund_id = r2.id
         WHERE r2.sale_id = $1 AND ri.product_id = si.product_id), 0) as refunded_qty
       FROM sale_items si
       WHERE si.sale_id = $1`,
      [sale_id]
    );
    const allRefunded = remainingItems.rows.every(row => parseInt(row.refunded_qty) >= parseInt(row.quantity));
    const saleType = allRefunded ? 'fully_refunded' : 'partially_refunded';

    await db.query(
      `UPDATE sales SET sale_type = $1 WHERE id = $2 AND sale_type IN ('sale', 'partially_refunded')`,
      [saleType, sale_id]
    );

    // Log audit - safely handle if table doesn't exist
    try {
      const ip = req.ip || req.connection?.remoteAddress || null;
      await db.query(
        `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, new_value, ip_address)
         VALUES ($1, $2, 'refund_create', 'refunds', $3, $4, $5)`,
        [req.user.id, req.user.name, refund.id,
          JSON.stringify({ sale_id, amount: refundAmount, items, reason }), ip]
      );
    } catch (auditErr) {
      // audit_logs table might not exist yet, ignore
    }

    res.status(201).json({ refund, message: 'Qaytarish muvaffaqiyatli amalga oshirildi' });
  } catch (error) {
    next(error);
  }
};

exports.getBySaleId = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT r.*, u.name as cashier_name
       FROM refunds r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.sale_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.saleId]
    );

    for (const refund of result.rows) {
      const items = await db.query(
        `SELECT ri.*, p.name as product_name
         FROM refund_items ri
         LEFT JOIN products p ON ri.product_id = p.id
         WHERE ri.refund_id = $1`,
        [refund.id]
      );
      refund.items = items.rows;
    }

    res.json({ refunds: result.rows });
  } catch (error) {
    next(error);
  }
};
