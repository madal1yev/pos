const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');

router.use(auth);

// Get stock ledger for a product
router.get('/ledger/:productId', async (req, res, next) => {
  try {
    const { from_date, to_date, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['il.product_id = $1'];
    let params = [req.params.productId];
    let paramCount = 1;

    if (from_date) {
      paramCount++;
      where.push(`date(il.created_at) >= date($${paramCount})`);
      params.push(from_date);
    }
    if (to_date) {
      paramCount++;
      where.push(`date(il.created_at) <= date($${paramCount})`);
      params.push(to_date);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM inventory_logs il WHERE ${where.join(' AND ')}`,
      params
    );

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const logs = await db.query(
      `SELECT il.*, u.name as created_by_name
       FROM inventory_logs il
       LEFT JOIN users u ON il.created_by = u.id
       WHERE ${where.join(' AND ')}
       ORDER BY il.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, parseInt(limit), offset]
    );

    const product = await db.query('SELECT * FROM products WHERE id = $1', [req.params.productId]);

    res.json({
      logs: logs.rows,
      product: product.rows[0] || null,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all inventory movements with filters
router.get('/movements', async (req, res, next) => {
  try {
    const { change_type, from_date, to_date, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = ['1=1'];
    let params = [];
    let paramCount = 0;

    if (change_type) {
      paramCount++;
      where.push(`il.change_type = $${paramCount}`);
      params.push(change_type);
    }
    if (from_date) {
      paramCount++;
      where.push(`date(il.created_at) >= date($${paramCount})`);
      params.push(from_date);
    }
    if (to_date) {
      paramCount++;
      where.push(`date(il.created_at) <= date($${paramCount})`);
      params.push(to_date);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM inventory_logs il WHERE ${where.join(' AND ')}`,
      params
    );

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const logs = await db.query(
      `SELECT il.*, p.name as product_name, p.product_code, u.name as created_by_name
       FROM inventory_logs il
       LEFT JOIN products p ON il.product_id = p.id
       LEFT JOIN users u ON il.created_by = u.id
       WHERE ${where.join(' AND ')}
       ORDER BY il.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      movements: logs.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Add inventory adjustment
router.post('/adjust', async (req, res, next) => {
  try {
    const { product_id, quantity, change_type, note } = req.body;
    if (!product_id || !quantity || !change_type) {
      return res.status(400).json({ error: 'product_id, quantity, change_type required' });
    }

    const product = await db.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentStock = product.rows[0].stock_quantity;
    let newStock;
    if (['sale', 'waste', 'damage', 'loss'].includes(change_type)) {
      newStock = currentStock - Math.abs(quantity);
    } else if (['refund', 'purchase', 'return'].includes(change_type)) {
      newStock = currentStock + Math.abs(quantity);
    } else {
      // adjustment_in, adjustment_out, initial etc.
      if (quantity > 0) {
        newStock = currentStock + Math.abs(quantity);
      } else {
        newStock = currentStock - Math.abs(quantity);
      }
    }
    newStock = Math.max(0, newStock);

    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    await db.query(
      `UPDATE products SET stock_quantity = $1, updated_at = ${nowExpr} WHERE id = $2`,
      [newStock, product_id]
    );

    const logResult = await db.query(
      `INSERT INTO inventory_logs (product_id, change_type, quantity, previous_stock, new_stock, note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [product_id, change_type, parseInt(quantity), currentStock, newStock, note || null, req.user.id]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, old_value, new_value)
       VALUES ($1, $2, 'inventory_adjust', 'products', $3, $4, $5)`,
      [req.user.id, req.user.name, product_id,
        JSON.stringify({ stock: currentStock }), JSON.stringify({ stock: newStock, change_type })]
    );

    res.json({
      log: logResult.rows[0],
      product: { ...product.rows[0], stock_quantity: newStock },
      message: 'Inventory updated',
    });
  } catch (error) {
    next(error);
  }
});

// Stock summary
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await db.query(
      `SELECT
        COUNT(*) as total_products,
        SUM(stock_quantity) as total_stock,
        SUM(CASE WHEN stock_quantity <= minimum_stock AND status = 'active' THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN stock_quantity = 0 AND status = 'active' THEN 1 ELSE 0 END) as out_of_stock_count,
        SUM(stock_quantity * purchase_price) as total_purchase_value,
        SUM(stock_quantity * selling_price) as total_selling_value
       FROM products WHERE status = 'active'`
    );

    // Get recent movements count
    const recent = await db.query(
      `SELECT change_type, COUNT(*) as count FROM inventory_logs
       WHERE created_at >= date(${db.isSqlite ? "'now'" : "CURRENT_DATE"}, '-7 days')
       GROUP BY change_type`
    );

    res.json({
      summary: summary.rows[0] || {},
      recent_movements: recent.rows || [],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
