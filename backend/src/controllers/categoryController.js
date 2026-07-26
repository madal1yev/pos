const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count
       FROM categories c
       ORDER BY c.sort_order, c.name`
    );
    const tree = buildCategoryTree(rows);
    res.json({ categories: rows, tree });
  } catch (error) {
    next(error);
  }
};

exports.getWithProducts = async (req, res, next) => {
  try {
    const { rows: categories } = await db.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count
       FROM categories c 
       ORDER BY c.sort_order, c.name`
    );
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
    
    // Unique nom tekshiruvi
    const existing = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Bunday nomli kategoriya allaqachon mavjud' });
    }
    
    const result = await db.query(
      'INSERT INTO categories (name, description, parent_id, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [name.trim(), description || null, parent_id || null, sort_order || 0]
    );
    res.status(201).json({ category: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, description, parent_id, sort_order } = req.body;
    
    // Unique nom tekshiruvi (o'zidan boshqa)
    if (name) {
      const existing = await db.query(
        'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2',
        [name.trim(), req.params.id]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Bunday nomli kategoriya allaqachon mavjud' });
      }
    }
    
    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    const result = await db.query(
      `UPDATE categories SET 
        name = COALESCE($1, name), 
        description = COALESCE($2, description),
        parent_id = COALESCE($3, parent_id), 
        sort_order = COALESCE($4, sort_order),
        updated_at = ${nowExpr} 
       WHERE id = $5 RETURNING *`,
      [name ? name.trim() : null, description, parent_id || null, sort_order || 0, req.params.id]
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
    const { rows: products } = await db.query(
      'SELECT id FROM products WHERE category_id = $1 LIMIT 1',
      [req.params.id]
    );
    if (products.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing products' });
    }
    await db.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.bulkStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Ids array is required' });
    }
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive' });
    }
    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    const uniqueIds = [...new Set(ids.map(Number).filter(id => Number.isInteger(id) && id > 0))];
    let updated = 0;
    for (const id of uniqueIds) {
      await db.query(
        `UPDATE categories SET status = $1, updated_at = ${nowExpr} WHERE id = $2`,
        [status, id]
      );
      updated++;
    }
    res.json({ success: true, updated });
  } catch (error) {
    next(error);
  }
};

exports.bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Ids array is required' });
    }
    const uniqueIds = [...new Set(ids.map(Number).filter(id => Number.isInteger(id) && id > 0))];
    let deleted = 0;
    const errors = [];
    for (const id of uniqueIds) {
      try {
        const { rows: products } = await db.query('SELECT id FROM products WHERE category_id = $1 LIMIT 1', [id]);
        if (products.length > 0) {
          errors.push({ id, error: 'Has existing products' });
          continue;
        }
        const result = await db.query('DELETE FROM categories WHERE id = $1', [id]);
        if (result.rowCount > 0) deleted++;
        else errors.push({ id, error: 'Not found' });
      } catch (err) {
        errors.push({ id, error: err.message });
      }
    }
    res.json({ deleted, errors, total: uniqueIds.length });
  } catch (error) {
    next(error);
  }
};

exports.reorder = async (req, res, next) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: 'Orders array is required' });
    }
    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    for (const item of orders) {
      await db.query(
        `UPDATE categories SET sort_order = $1, updated_at = ${nowExpr} WHERE id = $2`,
        [item.sort_order, item.id]
      );
    }
    res.json({ success: true, updated: orders.length });
  } catch (error) {
    next(error);
  }
};

exports.exportCsv = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT c.id, c.name, c.description, c.status, c.sort_order, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as product_count FROM categories c ORDER BY c.sort_order, c.name'
    );
    const header = 'id,name,description,status,sort_order,product_count\n';
    const csvRows = rows.map(c =>
      `${c.id},"${(c.name || '').replace(/"/g, '""')}","${(c.description || '').replace(/"/g, '""')}",${c.status || 'active'},${c.sort_order || 0},${c.product_count || 0}`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=categories_export.csv');
    res.send(header + csvRows);
  } catch (error) {
    next(error);
  }
};

exports.importCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }
    const content = req.file.buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have header row and at least one data row' });
    }
    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const nameIdx = header.findIndex(h => h === 'name' || h === 'nomi');
    const descIdx = header.findIndex(h => h === 'description' || h === 'tavsif');
    const statusIdx = header.findIndex(h => h === 'status' || h === 'holat');
    const sortIdx = header.findIndex(h => h === 'sort_order' || h === 'tartib');
    if (nameIdx === -1) {
      return res.status(400).json({ error: 'CSV must have a "name" column' });
    }
    let imported = 0;
    let updated = 0;
    const errors = [];
    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const vals = cols.map(c => c.replace(/^"|"$/g, '').trim());
        const name = vals[nameIdx];
        if (!name) { errors.push({ row: i + 1, error: 'Missing name' }); continue; }
        const existing = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
        if (existing.rows.length > 0) {
          await db.query(
            'UPDATE categories SET description = $1, status = $2, sort_order = $3 WHERE id = $4',
            [descIdx >= 0 ? vals[descIdx] : null, statusIdx >= 0 ? vals[statusIdx] : 'active', sortIdx >= 0 ? parseInt(vals[sortIdx]) || 0 : 0, existing.rows[0].id]
          );
          updated++;
        } else {
          await db.query(
            'INSERT INTO categories (name, description, status, sort_order) VALUES ($1, $2, $3, $4)',
            [name, descIdx >= 0 ? vals[descIdx] : null, statusIdx >= 0 ? vals[statusIdx] : 'active', sortIdx >= 0 ? parseInt(vals[sortIdx]) || 0 : 0]
          );
          imported++;
        }
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }
    res.json({ imported, updated, errors, total: lines.length - 1 });
  } catch (error) {
    next(error);
  }
};