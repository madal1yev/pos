const db = require('../config/db');
const { generateInvoiceNumber } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { search, payment_method, from_date, to_date, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['1=1'];
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      const likeOp = db.isSqlite ? 'LIKE' : 'ILIKE';
      where.push(`(s.customer_name ${likeOp} $${paramCount} OR s.invoice_number ${likeOp} $${paramCount} OR COALESCE(u.name, '') ${likeOp} $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (payment_method) {
      paramCount++;
      where.push(`s.payment_method = $${paramCount}`);
      params.push(payment_method);
    }

    if (from_date) {
      paramCount++;
      const dateVal = db.isSqlite ? `date($${paramCount})` : `$${paramCount}::date`;
      where.push(`date(s.created_at) >= ${dateVal}`);
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      const dateVal = db.isSqlite ? `date($${paramCount})` : `$${paramCount}::date`;
      where.push(`date(s.created_at) <= ${dateVal}`);
      params.push(to_date);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM sales s LEFT JOIN users u ON s.user_id = u.id WHERE ${where.join(' AND ')}`,
      params
    );

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const result = await db.query(
      `SELECT s.*, u.name as cashier_name,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
       FROM sales s 
       LEFT JOIN users u ON s.user_id = u.id
       WHERE ${where.join(' AND ')}
       ORDER BY s.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      sales: result.rows,
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
    const saleResult = await db.query(
      `SELECT s.*, u.name as cashier_name 
       FROM sales s LEFT JOIN users u ON s.user_id = u.id 
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const itemsResult = await db.query(
      `SELECT si.*, p.name as product_name, p.product_code, p.unit 
       FROM sale_items si 
       LEFT JOIN products p ON si.product_id = p.id 
       WHERE si.sale_id = $1`,
      [req.params.id]
    );

    res.json({
      sale: { ...saleResult.rows[0], items: itemsResult.rows },
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { customer_name, payment_method, received_amount, items, notes, delivery_address, shift_id, promo_code } = req.body;
    const invoiceNumber = generateInvoiceNumber();

    // If shift_id not provided, try to get active shift for user
    let activeShiftId = shift_id;
    if (!activeShiftId) {
      const activeShift = await db.query(
        `SELECT id FROM shifts WHERE user_id = $1 AND status = 'open' LIMIT 1`,
        [req.user.id]
      );
      if (activeShift.rows.length > 0) {
        activeShiftId = activeShift.rows[0].id;
      }
    }

    const settingsResult = await db.query('SELECT tax_percentage FROM settings LIMIT 1');
    const taxRate = parseFloat(settingsResult.rows[0]?.tax_percentage || 0) / 100;

    let totalAmount = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    for (const item of items) {
      const product = await db.query(
        'SELECT * FROM products WHERE id = $1 AND status = $2',
        [item.product_id, 'active']
      );

      if (product.rows.length === 0) {
        throw new Error(`Product with id ${item.product_id} not found or inactive`);
      }

      if (product.rows[0].stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${product.rows[0].name}". Available: ${product.rows[0].stock_quantity}`);
      }

      const discount = item.discount || 0;
      const lineSubtotal = (item.price * item.quantity) - discount;
      const tax = item.tax || 0 || Math.round(lineSubtotal * taxRate);
      const subtotal = lineSubtotal + tax;
      totalAmount += subtotal;
      totalTax += tax;
      totalDiscount += discount;
    }

    // Apply promo code discount if provided
    let finalDiscount = 0;
    let appliedPromoId = null;
    if (promo_code) {
      const promoResult = await db.query(
        `SELECT pc.*, d.type, d.value, d.max_discount, d.min_purchase
         FROM promo_codes pc JOIN discounts d ON pc.discount_id = d.id
         WHERE pc.code = $1 AND pc.is_active = 1 AND d.is_active = 1`,
        [promo_code.toUpperCase()]
      );
      if (promoResult.rows.length > 0) {
        const promo = promoResult.rows[0];
        if (promo.type === 'percentage') {
          finalDiscount = Math.min(totalAmount * (promo.value / 100), promo.max_discount || totalAmount);
        } else {
          finalDiscount = Math.min(promo.value, promo.max_discount || promo.value);
        }
        totalAmount = Math.max(0, totalAmount - finalDiscount);
        appliedPromoId = promo.id;

        // Increment promo usage
        await db.query(`UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = $1`, [promo.id]);
      }
    }

    const changeAmount = Math.max(0, (received_amount || 0) - totalAmount);

    const saleResult = await db.query(
      `INSERT INTO sales (user_id, customer_name, total_amount, payment_method, received_amount, change_amount, invoice_number, notes, delivery_address, shift_id, sale_type, promo_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'sale', $11) RETURNING *`,
      [req.user.id, customer_name || null, totalAmount, payment_method,
        received_amount || totalAmount, changeAmount, invoiceNumber, notes || null,
        delivery_address || null, activeShiftId || null, promo_code || null]
    );

    const sale = saleResult.rows[0];

    for (const item of items) {
      const discount = item.discount || 0;
      const lineSubtotal = (item.price * item.quantity) - discount;
      const tax = item.tax || 0 || Math.round(lineSubtotal * taxRate);
      const subtotal = lineSubtotal + tax;

      await db.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price, discount, tax, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale.id, item.product_id, item.quantity, item.price, discount, tax, subtotal]
      );

      const product = await db.query('SELECT stock_quantity FROM products WHERE id = $1', [item.product_id]);
      const newStock = product.rows[0].stock_quantity - item.quantity;

      const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
      await db.query(
        `UPDATE products SET stock_quantity = $1, updated_at = ${nowExpr} WHERE id = $2`,
        [newStock, item.product_id]
      );

      await db.query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity, previous_stock, new_stock, note, created_by)
         VALUES ($1, 'sale', $2, $3, $4, $5, $6)`,
        [item.product_id, -item.quantity, product.rows[0].stock_quantity, newStock,
          `Sale #${invoiceNumber}`, req.user.id]
      );
    }

    res.status(201).json({ sale, message: 'Sale completed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the sale
    const sale = await db.query('SELECT * FROM sales WHERE id = $1', [id]);
    if (sale.rows.length === 0) {
      return res.status(404).json({ error: 'Savdo topilmadi' });
    }

    const saleData = sale.rows[0];
    
    if (saleData.sale_type === 'fully_refunded' || saleData.sale_type === 'voided') {
      return res.status(400).json({ error: 'Bu buyurtma allaqachon bekor qilingan' });
    }

    // Restore stock for each item
    const items = await db.query(
      `SELECT si.*, p.stock_quantity as current_stock FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1`,
      [id]
    );

    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    for (const item of items.rows) {
      const newStock = (item.current_stock || 0) + item.quantity;
      await db.query(
        `UPDATE products SET stock_quantity = $1, updated_at = ${nowExpr} WHERE id = $2`,
        [newStock, item.product_id]
      );
      
      await db.query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity, previous_stock, new_stock, note, created_by)
         VALUES ($1, 'void', $2, $3, $4, $5, $6)`,
        [item.product_id, item.quantity, item.current_stock || 0, newStock,
          `Buyurtma bekor qilindi: ${saleData.invoice_number}`, req.user?.id || 1]
      );
    }

    // Mark sale as voided
    await db.query(
      `UPDATE sales SET sale_type = 'voided', notes = COALESCE($1, notes || '') || ' | Bekor qilindi: ' || ${nowExpr} WHERE id = $2`,
      [req.body?.reason || null, id]
    );

    res.json({ 
      message: 'Buyurtma bekor qilindi va mahsulotlar omborga qaytarildi',
      sale_id: id
    });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sale = await db.query('SELECT * FROM sales WHERE id = $1', [id]);
    if (sale.rows.length === 0) {
      return res.status(404).json({ error: 'Savdo topilmadi' });
    }

    const saleData = sale.rows[0];
    if (saleData.sale_type === 'voided') {
      return res.status(400).json({ error: 'Bu savdo allaqachon bekor qilingan' });
    }

    // Restore stock for each item
    const items = await db.query(
      `SELECT si.*, p.stock_quantity as current_stock FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1`,
      [id]
    );

    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    for (const item of items.rows) {
      const newStock = (item.current_stock || 0) + item.quantity;
      await db.query(
        `UPDATE products SET stock_quantity = $1, updated_at = ${nowExpr} WHERE id = $2`,
        [newStock, item.product_id]
      );
      await db.query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity, previous_stock, new_stock, note, created_by)
         VALUES ($1, 'delete', $2, $3, $4, $5, $6)`,
        [item.product_id, item.quantity, item.current_stock || 0, newStock,
          `Savdo o'chirildi: ${saleData.invoice_number}`, req.user?.id || 1]
      );
    }

    // Delete sale items then sale
    await db.query('DELETE FROM sale_items WHERE sale_id = $1', [id]);
    await db.query('DELETE FROM sales WHERE id = $1', [id]);

    res.json({ message: "Savdo muvaffaqiyatli o'chirildi va mahsulotlar omborga qaytarildi" });
  } catch (error) {
    next(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const settings = await db.query('SELECT * FROM settings LIMIT 1');

    const saleResult = await db.query(
      `SELECT s.*, u.name as cashier_name 
       FROM sales s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = $1`,
      [req.params.id]
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const itemsResult = await db.query(
      `SELECT si.*, p.name as product_name, p.product_code, p.unit 
       FROM sale_items si LEFT JOIN products p ON si.product_id = p.id 
       WHERE si.sale_id = $1`,
      [req.params.id]
    );

    res.json({
      invoice: {
        ...saleResult.rows[0],
        items: itemsResult.rows,
        settings: settings.rows[0] || {},
      },
    });
  } catch (error) {
    next(error);
  }
};
