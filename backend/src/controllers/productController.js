const db = require('../config/db');
const { generateProductCode, generateBarcode, guessImageUrl } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { search, category_id, status, page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['1=1'];
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      where.push(`(p.name LIKE $${paramCount} OR p.product_code LIKE $${paramCount} OR p.barcode LIKE $${paramCount} OR p.brand LIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (category_id) {
      paramCount++;
      where.push(`p.category_id = $${paramCount}`);
      params.push(parseInt(category_id));
    }

    if (status) {
      paramCount++;
      where.push(`p.status = $${paramCount}`);
      params.push(status);
    }

    const allowedSorts = ['name', 'selling_price', 'stock_quantity', 'created_at', 'product_code'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM products p WHERE ${where.join(' AND ')}`,
      params
    );

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const result = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE ${where.join(' AND ')}
       ORDER BY p.${sortCol} ${sortOrder}
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      products: result.rows,
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
      `SELECT p.*, c.name as category_name 
       FROM products p LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getByBarcode = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.barcode = $1 AND p.status = 'active'`,
      [req.params.barcode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found with this barcode' });
    }

    res.json({ product: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const productCode = await generateProductCode();
    const {
      name, category_id, brand, purchase_price, selling_price,
      stock_quantity, minimum_stock, unit, barcode, description, image_url
    } = req.body;

    const autoBarcode = barcode || generateBarcode(productCode);
    const autoImage = image_url || guessImageUrl(name);

    const result = await db.query(
      `INSERT INTO products (name, product_code, category_id, brand, purchase_price, selling_price,
        stock_quantity, minimum_stock, unit, barcode, description, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [name, productCode, category_id || null, brand || null, purchase_price || 0,
        selling_price, stock_quantity || 0, minimum_stock || 0, unit || 'pcs',
        autoBarcode, description || null, autoImage]
    );

    if (stock_quantity > 0) {
      await db.query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity, new_stock, note, created_by)
         VALUES ($1, 'initial', $2, $2, 'Initial stock', $3)`,
        [result.rows[0].id, stock_quantity || 0, req.user?.id || null]
      );
    }

    res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const {
      name, category_id, brand, purchase_price, selling_price,
      stock_quantity, minimum_stock, unit, barcode, description, status, image_url
    } = req.body;

    const current = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';

    const result = await db.query(
      `UPDATE products SET 
        name = COALESCE($1, name), category_id = COALESCE($2, category_id),
        brand = COALESCE($3, brand), purchase_price = COALESCE($4, purchase_price),
        selling_price = COALESCE($5, selling_price), stock_quantity = COALESCE($6, stock_quantity),
        minimum_stock = COALESCE($7, minimum_stock), unit = COALESCE($8, unit),
        barcode = COALESCE($9, barcode), description = COALESCE($10, description),
        status = COALESCE($11, status), image_url = COALESCE($12, image_url),
        updated_at = ${nowExpr}
       WHERE id = $13 RETURNING *`,
      [name, category_id, brand, purchase_price, selling_price, stock_quantity,
        minimum_stock, unit, barcode, description, status, image_url, req.params.id]
    );

    const stockDiff = (stock_quantity || 0) - current.rows[0].stock_quantity;
    if (stockDiff !== 0) {
      await db.query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity, previous_stock, new_stock, note, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [req.params.id, stockDiff > 0 ? 'adjustment_in' : 'adjustment_out',
          Math.abs(stockDiff), current.rows[0].stock_quantity, result.rows[0].stock_quantity,
          'Manual stock adjustment', req.user?.id || null]
      );
    }

    res.json({ product: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await db.query('SELECT id FROM products WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
