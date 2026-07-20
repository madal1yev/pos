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
      where.push(`(s.customer_name LIKE $${paramCount} OR s.invoice_number LIKE $${paramCount} OR u.name LIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (payment_method) {
      paramCount++;
      where.push(`s.payment_method = $${paramCount}`);
      params.push(payment_method);
    }

    if (from_date) {
      paramCount++;
      where.push(`s.created_at >= $${paramCount}`);
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      where.push(`date(s.created_at) <= date($${paramCount})`);
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
    const { customer_name, payment_method, received_amount, items, notes } = req.body;
    const invoiceNumber = generateInvoiceNumber();

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

    const changeAmount = Math.max(0, (received_amount || 0) - totalAmount);

    const saleResult = await db.query(
      `INSERT INTO sales (user_id, customer_name, total_amount, payment_method, received_amount, change_amount, invoice_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, customer_name || null, totalAmount, payment_method,
        received_amount || totalAmount, changeAmount, invoiceNumber, notes || null]
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
