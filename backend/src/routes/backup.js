const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, authorize } = require('../middleware/auth');

router.use(auth, authorize('admin'));

const CORE_TABLES = [
  'settings',
  'roles',
  'users',
  'categories',
  'products',
  'sales',
  'sale_items',
  'customers',
  'suppliers',
  'shifts',
  'refunds',
  'refund_items',
  'discounts',
  'promo_codes',
  'inventory_logs',
  'app_meta',
];

// Tables scoped directly by their own store_id column
const DIRECTLY_SCOPED = new Set([
  'settings', 'users', 'categories', 'products', 'sales', 'customers',
  'suppliers', 'shifts', 'refunds', 'discounts', 'promo_codes', 'inventory_logs',
]);
// Tables reached only via a store-scoped parent join
const JOIN_SCOPED = {
  sale_items: `SELECT si.* FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE s.store_id = $1`,
  refund_items: `SELECT ri.* FROM refund_items ri JOIN refunds r ON ri.refund_id = r.id WHERE r.store_id = $1`,
};
// Global/shared, not store data
const UNSCOPED = new Set(['roles', 'app_meta']);

// Export full database as JSON (scoped to the requesting admin's store)
router.get('/', async (req, res, next) => {
  try {
    const backup = { exported_at: new Date().toISOString(), version: 1, data: {} };
    for (const table of CORE_TABLES) {
      try {
        if (JOIN_SCOPED[table]) {
          const result = await db.query(JOIN_SCOPED[table], [req.user.store_id]);
          backup.data[table] = result.rows || [];
        } else if (UNSCOPED.has(table)) {
          const result = await db.query(`SELECT * FROM ${table}`);
          backup.data[table] = result.rows || [];
        } else if (DIRECTLY_SCOPED.has(table)) {
          const result = await db.query(`SELECT * FROM ${table} WHERE store_id = $1`, [req.user.store_id]);
          backup.data[table] = result.rows || [];
        } else {
          backup.data[table] = [];
        }
      } catch (e) {
        backup.data[table] = [];
      }
    }
    res.json(backup);
  } catch (error) {
    next(error);
  }
});

module.exports = router;