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

// Export full database as JSON
router.get('/', async (req, res, next) => {
  try {
    const backup = { exported_at: new Date().toISOString(), version: 1, data: {} };
    for (const table of CORE_TABLES) {
      try {
        const result = await db.query(`SELECT * FROM ${table}`);
        backup.data[table] = result.rows || [];
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