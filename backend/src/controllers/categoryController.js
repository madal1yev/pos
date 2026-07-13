const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, COUNT(p.id) as product_count 
       FROM categories c 
       LEFT JOIN products p ON p.category_id = c.id 
       GROUP BY c.id 
       ORDER BY c.name ASC`
    );
    res.json({ categories: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const result = await db.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    res.status(201).json({ category: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), 
       updated_at = datetime('now') WHERE id = $3 RETURNING *`,
      [name, description, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ category: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const products = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [req.params.id]
    );
    if (parseInt(products.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing products' });
    }

    const existing = await db.query('SELECT id FROM categories WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await db.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
