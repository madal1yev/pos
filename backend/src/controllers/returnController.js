const db = require('../config/db');

exports.returnProducts = async (req, res) => {
  try {
    const { sale_id, items, reason } = req.body;

    if (!sale_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Mahsulotlar tanlanmagan' });
    }

    const sale = await db.query('SELECT * FROM sales WHERE id = $1', [sale_id]);
    if (sale.rows.length === 0) {
      return res.status(404).json({ error: 'Savdo topilmadi' });
    }

    const saleData = sale.rows[0];
    let totalReturnAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const productId = parseInt(item.product_id);
      const returnQty = parseInt(item.quantity);
      if (!productId || !returnQty || returnQty <= 0) continue;

      const originalItem = await db.query(
        'SELECT * FROM sale_items WHERE sale_id = $1 AND product_id = $2',
        [sale_id, productId]
      );
      if (originalItem.rows.length === 0) continue;

      const origPrice = parseFloat(originalItem.rows[0].price) || 0;
      const price = parseFloat(item.price) || origPrice;
      totalReturnAmount += price * returnQty;
      processedItems.push({ productId, returnQty, price, origPrice });
    }

    if (processedItems.length === 0) {
      return res.status(400).json({ error: 'Qaytariladigan mahsulot topilmadi' });
    }

    // Transaction
    await db.query(db.isSqlite ? 'BEGIN TRANSACTION' : 'BEGIN');

    try {
      const refundResult = await db.query(
        "INSERT INTO refunds (sale_id, user_id, refund_amount, reason, status) VALUES ($1, $2, $3, $4, 'completed') RETURNING *",
        [sale_id, req.user?.id || 1, totalReturnAmount, reason || 'Mahsulot qaytarish']
      );
      const refund = refundResult.rows[0];

      for (const pi of processedItems) {
        await db.query(
          'INSERT INTO refund_items (refund_id, product_id, quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [refund.id, pi.productId, pi.returnQty, pi.price, pi.price * pi.returnQty]
        );

        const product = await db.query('SELECT stock_quantity FROM products WHERE id = $1', [pi.productId]);
        if (product.rows.length > 0) {
          const currentStock = parseInt(product.rows[0].stock_quantity) || 0;
          const newStock = currentStock + pi.returnQty;
          const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';

          await db.query(
            `UPDATE products SET stock_quantity = $1, updated_at = ${nowExpr} WHERE id = $2`,
            [newStock, pi.productId]
          );

          await db.query(
            'INSERT INTO inventory_logs (product_id, change_type, quantity, previous_stock, new_stock, note, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [pi.productId, pi.returnQty, currentStock, newStock, `Qaytarish: ${saleData.invoice_number}`, req.user?.id || 1]
          );
        }
      }

      await db.query(db.isSqlite ? 'COMMIT' : 'COMMIT');
      res.json({ message: 'Mahsulot qaytarildi', amount: totalReturnAmount });
    } catch (innerErr) {
      await db.query(db.isSqlite ? 'ROLLBACK' : 'ROLLBACK');
      throw innerErr;
    }
  } catch (error) {
    console.error('Return error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getSaleForReturn = async (req, res) => {
  try {
    const saleId = parseInt(req.params.saleId);
    if (!saleId) return res.status(400).json({ error: 'Noto\'g\'ri savdo ID' });

    const sale = await db.query(
      'SELECT s.*, u.name as cashier_name FROM sales s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = $1',
      [saleId]
    );
    if (sale.rows.length === 0) return res.status(404).json({ error: 'Savdo topilmadi' });

    const items = await db.query(
      `SELECT si.id, si.sale_id, si.product_id, si.quantity, si.price, si.discount, si.tax, si.subtotal,
        p.name as product_name, p.product_code, p.unit, p.stock_quantity as current_stock,
        COALESCE((SELECT SUM(ri.quantity) FROM refund_items ri
         JOIN refunds r ON ri.refund_id = r.id
         WHERE r.sale_id = $1 AND ri.product_id = si.product_id), 0) as refunded_qty
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1`,
      [saleId]
    );

    res.json({
      sale: sale.rows[0],
      items: items.rows.map(item => ({
        ...item,
        quantity: parseInt(item.quantity) || 0,
        price: parseFloat(item.price) || 0,
        refunded_qty: parseInt(item.refunded_qty) || 0,
        available_to_return: (parseInt(item.quantity) || 0) - (parseInt(item.refunded_qty) || 0)
      }))
    });
  } catch (error) {
    console.error('Get sale error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
