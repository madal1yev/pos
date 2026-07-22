const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, 
        COUNT(p.id) as product_count,
        cp.name as parent_name
       FROM categories c 
       LEFT JOIN products p ON p.category_id = c.id
       LEFT JOIN categories cp ON c.parent_id = cp.id
       GROUP BY c.id 
       ORDER BY c.sort_order ASC, c.name ASC`
    );

    // Build tree structure
    const categories = result.rows;
    const tree = buildCategoryTree(categories);

    res.json({ categories, tree });
  } catch (error) {
    next(error);
  }
};

function buildCategoryTree(categories, parentId = null) {
  return categories
    .filter(c => c.parent_id === parentId)
    .map(c => ({
      ...c,
      children: buildCategoryTree(categories, c.id),
    }));
}

exports.create = async (req, res, next) => {
  try {
    const { name, description, parent_id, sort_order } = req.body;
    const result = await db.query(
      'INSERT INTO categories (name, description, parent_id, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || null, parent_id || null, sort_order || 0]
    );
    res.status(201).json({ category: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, description, parent_id, sort_order } = req.body;
    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    const result = await db.query(
      `UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description),
       parent_id = COALESCE($3, parent_id), sort_order = COALESCE($4, sort_order),
       updated_at = ${nowExpr} WHERE id = $5 RETURNING *`,
      [name, description, parent_id || null, sort_order || 0, req.params.id]
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
