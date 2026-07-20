const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(auth);

router.post('/bulk-update-prices', async (req, res, next) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' });
    }
    if (updates.length > 10000) {
      return res.status(400).json({ error: 'Maximum 10000 updates per request' });
    }

    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    let updated = 0;
    let errors = [];

    for (const u of updates) {
      try {
        if (!u.id) { errors.push({ id: u.id, error: 'Missing id' }); continue; }
        const sets = [];
        const params = [];
        let pIdx = 1;

        if (u.selling_price !== undefined) {
          sets.push(`selling_price = $${pIdx++}`);
          params.push(parseFloat(u.selling_price));
        }
        if (u.purchase_price !== undefined) {
          sets.push(`purchase_price = $${pIdx++}`);
          params.push(parseFloat(u.purchase_price));
        }
        if (u.name !== undefined) {
          sets.push(`name = $${pIdx++}`);
          params.push(u.name);
        }
        if (u.stock_quantity !== undefined) {
          sets.push(`stock_quantity = $${pIdx++}`);
          params.push(parseInt(u.stock_quantity));
        }
        if (u.minimum_stock !== undefined) {
          sets.push(`minimum_stock = $${pIdx++}`);
          params.push(parseInt(u.minimum_stock));
        }
        if (u.brand !== undefined) {
          sets.push(`brand = $${pIdx++}`);
          params.push(u.brand);
        }
        if (u.category_id !== undefined) {
          sets.push(`category_id = $${pIdx++}`);
          params.push(u.category_id ? parseInt(u.category_id) : null);
        }
        if (sets.length === 0) { errors.push({ id: u.id, error: 'No fields to update' }); continue; }

        sets.push(`updated_at = ${nowExpr}`);
        params.push(parseInt(u.id));

        const result = await db.query(
          `UPDATE products SET ${sets.join(', ')} WHERE id = $${pIdx}`,
          params
        );
        updated += result.rowCount;
      } catch (err) {
        errors.push({ id: u.id, error: err.message });
      }
    }

    res.json({ updated, errors, total: updates.length });
  } catch (error) {
    next(error);
  }
});

router.post('/import-csv', upload.single('file'), async (req, res, next) => {
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
    const nameIdx = header.findIndex(h => h === 'name' || h === 'nomi' || h === 'mahsulot_nomi');
    const priceIdx = header.findIndex(h => h === 'selling_price' || h === 'sotish_narxi' || h === 'narx');
    const purchaseIdx = header.findIndex(h => h === 'purchase_price' || h === 'sotib_narxi');
    const categoryIdx = header.findIndex(h => h === 'category' || h === 'kategoriya' || h === 'category_id');
    const brandIdx = header.findIndex(h => h === 'brand' || h === 'brend');
    const stockIdx = header.findIndex(h => h === 'stock' || h === 'stock_quantity' || h === 'miqdor' || h === 'zaxira');
    const barcodeIdx = header.findIndex(h => h === 'barcode' || h === 'shtrix_kod' || h === 'shtrix-kod');
    const unitIdx = header.findIndex(h => h === 'unit' || h === 'olchov');
    const minStockIdx = header.findIndex(h => h === 'minimum_stock' || h === 'min_zaxira');
    const statusIdx = header.findIndex(h => h === 'status' || h === 'holat');

    if (nameIdx === -1) {
      return res.status(400).json({ error: 'CSV must have a "name" column' });
    }

    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    let imported = 0;
    let updated = 0;
    let errors = [];
    const upsertMode = req.body.mode === 'update';

    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const vals = cols.map(c => c.replace(/^"|"$/g, '').trim());

        const name = vals[nameIdx];
        if (!name) { errors.push({ row: i + 1, error: 'Missing name' }); continue; }

        const selling_price = priceIdx >= 0 ? parseFloat(vals[priceIdx]) || 0 : 0;
        const purchase_price = purchaseIdx >= 0 ? parseFloat(vals[purchaseIdx]) || 0 : 0;
        const brand = brandIdx >= 0 ? vals[brandIdx] || null : null;
        const barcode = barcodeIdx >= 0 ? vals[barcodeIdx] || null : null;
        const unit = unitIdx >= 0 ? vals[unitIdx] || 'pcs' : 'pcs';
        const stock_quantity = stockIdx >= 0 ? parseInt(vals[stockIdx]) || 0 : 0;
        const minimum_stock = minStockIdx >= 0 ? parseInt(vals[minStockIdx]) || 0 : 0;
        const status = statusIdx >= 0 ? vals[statusIdx] || 'active' : 'active';
        const description = null;

        let category_id = null;
        if (categoryIdx >= 0 && vals[categoryIdx]) {
          const catName = vals[categoryIdx];
          const catResult = await db.query('SELECT id FROM categories WHERE name = $1', [catName]);
          if (catResult.rows.length > 0) {
            category_id = catResult.rows[0].id;
          } else {
            const newCat = await db.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [catName]);
            category_id = newCat.rows[0].id;
          }
        }

        if (upsertMode && barcode) {
          const existing = await db.query('SELECT id FROM products WHERE barcode = $1', [barcode]);
          if (existing.rows.length > 0) {
            const params = [name, category_id, brand, purchase_price, selling_price, stock_quantity, minimum_stock, unit, description, existing.rows[0].id];
            await db.query(
              `UPDATE products SET name=$1, category_id=$2, brand=$3, purchase_price=$4,
               selling_price=$5, stock_quantity=$6, minimum_stock=$7, unit=$8,
               description=$9, updated_at=${nowExpr} WHERE id=$10`,
              params
            );
            updated++;
            continue;
          }
        }

        const productCode = `PRD-${String(9000 + imported + 1).padStart(4, '0')}`;
        const autoBarcode = barcode || `2000${String(9000 + imported + 1).padStart(5, '0')}`;

        await db.query(
          `INSERT INTO products (name, product_code, category_id, brand, purchase_price, selling_price,
            stock_quantity, minimum_stock, unit, barcode, description, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [name, productCode, category_id, brand, purchase_price, selling_price,
            stock_quantity, minimum_stock, unit, autoBarcode, description, status]
        );
        imported++;
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    res.json({ imported, updated, errors, total: lines.length - 1 });
  } catch (error) {
    next(error);
  }
});

router.get('/export-csv', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT p.*, c.name as category_name FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id`
    );

    const header = 'name,product_code,barcode,brand,category,purchase_price,selling_price,stock_quantity,minimum_stock,unit,status\n';
    const rows = result.rows.map(p =>
      `"${(p.name || '').replace(/"/g, '""')}","${p.product_code}","${p.barcode || ''}","${p.brand || ''}","${p.category_name || ''}",${p.purchase_price},${p.selling_price},${p.stock_quantity},${p.minimum_stock},"${p.unit}","${p.status}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products_export.csv');
    res.send(header + rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
