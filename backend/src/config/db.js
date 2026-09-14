const path = require('path');
require('dotenv').config();
const storeScopedTables = require('./storeScopedTables');

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Tables that only exist via Vercel's api/index.js cold-start block historically —
  // create them here too so non-Vercel Postgres deploys (e.g. Render, running
  // src/server.js directly) end up with the same schema.
  async function pgCreateTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS stores (id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, created_at TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS shifts (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, opened_at TIMESTAMP DEFAULT NOW(), closed_at TIMESTAMP, opening_cash DECIMAL(12,2) DEFAULT 0, closing_cash DECIMAL(12,2), expected_cash DECIMAL(12,2), cash_difference DECIMAL(12,2), total_sales DECIMAL(12,2) DEFAULT 0, total_transactions INTEGER DEFAULT 0, status VARCHAR(20) DEFAULT 'open', notes TEXT, opened_by_name TEXT, store_id INTEGER)`,
      `CREATE TABLE IF NOT EXISTS audit_logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, username VARCHAR(100), action VARCHAR(50) NOT NULL, entity_type VARCHAR(50), entity_id INTEGER, old_value TEXT, new_value TEXT, ip_address VARCHAR(50), created_at TIMESTAMP DEFAULT NOW(), store_id INTEGER)`,
      `CREATE TABLE IF NOT EXISTS refunds (id SERIAL PRIMARY KEY, sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, refund_amount DECIMAL(12,2) NOT NULL, reason TEXT, status VARCHAR(20) DEFAULT 'completed', created_at TIMESTAMP DEFAULT NOW(), store_id INTEGER)`,
      `CREATE TABLE IF NOT EXISTS refund_items (id SERIAL PRIMARY KEY, refund_id INTEGER REFERENCES refunds(id) ON DELETE CASCADE, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, quantity INTEGER NOT NULL, price DECIMAL(12,2) NOT NULL, subtotal DECIMAL(12,2) NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS discounts (id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, type VARCHAR(20) NOT NULL DEFAULT 'percentage', value DECIMAL(12,2) NOT NULL, min_purchase DECIMAL(12,2) DEFAULT 0, max_discount DECIMAL(12,2), start_date TIMESTAMP, end_date TIMESTAMP, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), store_id INTEGER)`,
      `CREATE TABLE IF NOT EXISTS promo_codes (id SERIAL PRIMARY KEY, code VARCHAR(50) UNIQUE NOT NULL, discount_id INTEGER REFERENCES discounts(id) ON DELETE CASCADE, max_uses INTEGER DEFAULT 0, current_uses INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW(), store_id INTEGER)`,
      `CREATE TABLE IF NOT EXISTS product_variants (id SERIAL PRIMARY KEY, product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, name VARCHAR(200) NOT NULL, sku VARCHAR(100), price DECIMAL(12,2), stock_quantity INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS combo_items (id SERIAL PRIMARY KEY, product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, combo_id INTEGER REFERENCES products(id) ON DELETE CASCADE, quantity INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS token_blacklist (token TEXT PRIMARY KEY, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS login_audit_logs (id SERIAL PRIMARY KEY, user_id INTEGER, email VARCHAR(200) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'success', ip_address VARCHAR(50), user_agent TEXT, store_id INTEGER, created_at TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER, title VARCHAR(200) NOT NULL, message TEXT, type VARCHAR(50) DEFAULT 'info', is_read BOOLEAN DEFAULT false, store_id INTEGER, created_at TIMESTAMP DEFAULT NOW())`,
    ];
    for (const sql of tables) {
      try {
        await pool.query(sql);
      } catch (e) {
        console.log('⚠️ PG table create error:', e.message.slice(0, 100));
      }
    }
  }

  // Auto-migration: add missing columns for PostgreSQL
  async function pgAutoMigrate() {
    const migrations = [
      { table: 'categories', column: 'status', sql: "ALTER TABLE categories ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'" },
      { table: 'categories', column: 'emoji', sql: "ALTER TABLE categories ADD COLUMN IF NOT EXISTS emoji TEXT" },
      { table: 'sales', column: 'delivery_address', sql: "ALTER TABLE sales ADD COLUMN IF NOT EXISTS delivery_address TEXT" },
      { table: 'sales', column: 'shift_id', sql: "ALTER TABLE sales ADD COLUMN IF NOT EXISTS shift_id INTEGER" },
      { table: 'sales', column: 'sale_type', sql: "ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_type TEXT DEFAULT 'sale'" },
      { table: 'sales', column: 'discount_id', sql: "ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_id INTEGER" },
      { table: 'sales', column: 'promo_code', sql: "ALTER TABLE sales ADD COLUMN IF NOT EXISTS promo_code TEXT" },
      { table: 'settings', column: 'smtp_host', sql: "ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_host TEXT" },
      { table: 'users', column: 'pin', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS pin VARCHAR(10)" },
      { table: 'products', column: 'has_variants', sql: "ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants INTEGER DEFAULT 0" },
      { table: 'products', column: 'is_combo', sql: "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_combo INTEGER DEFAULT 0" },
      { table: 'roles', column: 'permissions', sql: "ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions TEXT" },
      // Multi-tenant store_id — one entry per store-scoped table (see storeScopedTables.js)
      { table: 'users', column: 'store_id', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'products', column: 'store_id', sql: "ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'categories', column: 'store_id', sql: "ALTER TABLE categories ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'sales', column: 'store_id', sql: "ALTER TABLE sales ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'customers', column: 'store_id', sql: "ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'customers', column: 'debt_amount', sql: "ALTER TABLE customers ADD COLUMN IF NOT EXISTS debt_amount DECIMAL(12,2) DEFAULT 0" },
      { table: 'customers', column: 'debt_status', sql: "ALTER TABLE customers ADD COLUMN IF NOT EXISTS debt_status VARCHAR(20) DEFAULT 'no_debt'" },
      { table: 'suppliers', column: 'store_id', sql: "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'settings', column: 'store_id', sql: "ALTER TABLE settings ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'shifts', column: 'store_id', sql: "ALTER TABLE shifts ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'discounts', column: 'store_id', sql: "ALTER TABLE discounts ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'promo_codes', column: 'store_id', sql: "ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'refunds', column: 'store_id', sql: "ALTER TABLE refunds ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'audit_logs', column: 'store_id', sql: "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'inventory_logs', column: 'store_id', sql: "ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'login_audit_logs', column: 'store_id', sql: "ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS store_id INTEGER" },
      { table: 'notifications', column: 'store_id', sql: "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS store_id INTEGER" },
    ];
    for (const m of migrations) {
      try {
        await pool.query(m.sql);
        console.log(`✅ PG migration verified: ${m.table}.${m.column}`);
      } catch (e) {
        if (e.code !== '42701' && !e.message.includes('already exists')) {
          console.log(`⚠️ PG migration check for ${m.table}.${m.column}:`, e.message.slice(0, 100));
        }
      }
    }
  }

  // Backfill: give every pre-existing row a store so nothing already in the DB
  // becomes invisible once store_id starts being enforced in queries.
  async function pgBackfillDefaultStore() {
    try {
      let storeId;
      const existing = await pool.query('SELECT id FROM stores ORDER BY id LIMIT 1');
      if (existing.rows.length > 0) {
        storeId = existing.rows[0].id;
      } else {
        let name = "Do'kon";
        try {
          const settingsRow = await pool.query('SELECT store_name FROM settings LIMIT 1');
          if (settingsRow.rows[0]?.store_name) name = settingsRow.rows[0].store_name;
        } catch (e) {}
        const created = await pool.query('INSERT INTO stores (name) VALUES ($1) RETURNING id', [name]);
        storeId = created.rows[0].id;
      }
      for (const table of storeScopedTables) {
        try {
          await pool.query(`UPDATE ${table} SET store_id = $1 WHERE store_id IS NULL`, [storeId]);
        } catch (e) {
          console.log(`⚠️ PG backfill store_id for ${table}:`, e.message.slice(0, 100));
        }
      }
    } catch (e) {
      console.log('⚠️ PG store backfill error:', e.message);
    }
  }

  // Run auto-migration on startup
  (async () => {
    await pgCreateTables();
    await pgAutoMigrate();
    await pgBackfillDefaultStore();
  })().catch(e => console.log('⚠️ PG auto-migration error:', e.message));

  const db = {
    query: (sql, params) => pool.query(sql, params),
    getClient: () => pool.connect(),
    isSqlite: false,
  };

  module.exports = db;
} else {
  const Database = require('better-sqlite3');
  const DB_PATH = path.join(__dirname, '../../pos_database.db');
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  function mapParams(sql, params = []) {
    const newParams = [];
    const paramMap = new Map();
    const replaced = sql.replace(/\$(\d+)/g, (match, num) => {
      const idx = parseInt(num) - 1;
      const val = params[idx];
      newParams.push(val);
      return '?';
    });
    return { sql: replaced, params: newParams };
  }

  function hasReturning(sql) {
    return /\bRETURNING\b/i.test(sql);
  }

  function runQuery(sql, params = []) {
    const trimmed = sql.trim().toUpperCase();
    const { sql: mapped, params: mappedParams } = mapParams(sql, params);

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      const stmt = sqlite.prepare(mapped);
      const rows = stmt.all(...mappedParams);
      return { rows, rowCount: rows.length };
    }

    if (trimmed.startsWith('INSERT')) {
      const stmt = sqlite.prepare(mapped);
      const info = stmt.run(...mappedParams);
      if (hasReturning(sql)) {
        const tableName = (sql.match(/INTO\s+(\w+)/i) || [])[1];
        const lastRow = sqlite.prepare(`SELECT * FROM ${tableName} WHERE rowid = ?`).get(info.lastInsertRowid);
        return { rows: lastRow ? [lastRow] : [], rowCount: info.changes };
      }
      return { rows: [], rowCount: info.changes };
    }

    if (trimmed.startsWith('UPDATE')) {
      const stmt = sqlite.prepare(mapped);
      const info = stmt.run(...mappedParams);
      if (hasReturning(sql)) {
        // SQLite has no RETURNING for UPDATE; rewrite into a SELECT so we
        // don't re-execute the write. Preserve only the WHERE clause params.
        let selectSql = sql
          .replace(/UPDATE\s+(\w+)\s+SET[\s\S]*?\bWHERE\s+/i, 'SELECT * FROM $1 WHERE ')
          .replace(/\s+RETURNING\s+[\s\S]*$/i, '');
        const selParams = (selectSql.match(/\$\d+/g) || []).map((m) => params[parseInt(m.slice(1)) - 1]);
        const { sql: remapped, params: remappedParams } = mapParams(selectSql, selParams);
        const rows = sqlite.prepare(remapped).all(...remappedParams);
        return { rows, rowCount: info.changes };
      }
      return { rows: [], rowCount: info.changes };
    }

    if (trimmed.startsWith('DELETE')) {
      const stmt = sqlite.prepare(mapped);
      const info = stmt.run(...mappedParams);
      return { rows: [], rowCount: info.changes };
    }

    const stmt = sqlite.prepare(mapped);
    const info = stmt.run(...mappedParams);
    return { rows: [], rowCount: info.changes };
  }

  // Auto-migration: add missing columns and tables
  function autoMigrate() {
    const migrations = [
      { table: 'categories', column: 'status', sql: "ALTER TABLE categories ADD COLUMN status TEXT DEFAULT 'active'" },
      { table: 'suppliers', column: 'transport_type', sql: "ALTER TABLE suppliers ADD COLUMN transport_type TEXT DEFAULT 'car'" },
      { table: 'suppliers', column: 'status', sql: "ALTER TABLE suppliers ADD COLUMN status TEXT DEFAULT 'active'" },
      { table: 'suppliers', column: 'delivered_orders', sql: "ALTER TABLE suppliers ADD COLUMN delivered_orders INTEGER DEFAULT 0" },
      { table: 'sales', column: 'delivery_address', sql: "ALTER TABLE sales ADD COLUMN delivery_address TEXT" },
      { table: 'sales', column: 'shift_id', sql: "ALTER TABLE sales ADD COLUMN shift_id INTEGER" },
      { table: 'sales', column: 'sale_type', sql: "ALTER TABLE sales ADD COLUMN sale_type TEXT DEFAULT 'sale'" },
      { table: 'sales', column: 'discount_id', sql: "ALTER TABLE sales ADD COLUMN discount_id INTEGER" },
      { table: 'sales', column: 'promo_code', sql: "ALTER TABLE sales ADD COLUMN promo_code TEXT" },
      { table: 'settings', column: 'smtp_host', sql: "ALTER TABLE settings ADD COLUMN smtp_host TEXT" },
      { table: 'settings', column: 'smtp_port', sql: "ALTER TABLE settings ADD COLUMN smtp_port INTEGER DEFAULT 587" },
      { table: 'users', column: 'pin', sql: "ALTER TABLE users ADD COLUMN pin VARCHAR(10)" },
      { table: 'products', column: 'has_variants', sql: "ALTER TABLE products ADD COLUMN has_variants INTEGER DEFAULT 0" },
      { table: 'products', column: 'is_combo', sql: "ALTER TABLE products ADD COLUMN is_combo INTEGER DEFAULT 0" },
      { table: 'roles', column: 'permissions', sql: "ALTER TABLE roles ADD COLUMN permissions TEXT" },
      // Multi-tenant store_id — one entry per store-scoped table (see storeScopedTables.js).
      // No-ops silently on first boot for tables that don't exist yet (created below in
      // newTables); self-heals on the next boot once the table exists, same as every
      // other entry in this array that predates a given table's creation.
      { table: 'users', column: 'store_id', sql: "ALTER TABLE users ADD COLUMN store_id INTEGER" },
      { table: 'products', column: 'store_id', sql: "ALTER TABLE products ADD COLUMN store_id INTEGER" },
      { table: 'categories', column: 'store_id', sql: "ALTER TABLE categories ADD COLUMN store_id INTEGER" },
      { table: 'sales', column: 'store_id', sql: "ALTER TABLE sales ADD COLUMN store_id INTEGER" },
      { table: 'customers', column: 'store_id', sql: "ALTER TABLE customers ADD COLUMN store_id INTEGER" },
      { table: 'customers', column: 'debt_amount', sql: "ALTER TABLE customers ADD COLUMN debt_amount REAL DEFAULT 0" },
      { table: 'customers', column: 'debt_status', sql: "ALTER TABLE customers ADD COLUMN debt_status TEXT DEFAULT 'no_debt'" },
      { table: 'suppliers', column: 'store_id', sql: "ALTER TABLE suppliers ADD COLUMN store_id INTEGER" },
      { table: 'settings', column: 'store_id', sql: "ALTER TABLE settings ADD COLUMN store_id INTEGER" },
      { table: 'shifts', column: 'store_id', sql: "ALTER TABLE shifts ADD COLUMN store_id INTEGER" },
      { table: 'discounts', column: 'store_id', sql: "ALTER TABLE discounts ADD COLUMN store_id INTEGER" },
      { table: 'promo_codes', column: 'store_id', sql: "ALTER TABLE promo_codes ADD COLUMN store_id INTEGER" },
      { table: 'refunds', column: 'store_id', sql: "ALTER TABLE refunds ADD COLUMN store_id INTEGER" },
      { table: 'audit_logs', column: 'store_id', sql: "ALTER TABLE audit_logs ADD COLUMN store_id INTEGER" },
      { table: 'inventory_logs', column: 'store_id', sql: "ALTER TABLE inventory_logs ADD COLUMN store_id INTEGER" },
      { table: 'login_audit_logs', column: 'store_id', sql: "ALTER TABLE login_audit_logs ADD COLUMN store_id INTEGER" },
      { table: 'notifications', column: 'store_id', sql: "ALTER TABLE notifications ADD COLUMN store_id INTEGER" },
    ];
    for (const m of migrations) {
      try {
        const cols = sqlite.prepare(`PRAGMA table_info(${m.table})`).all();
        if (!cols.some(c => c.name === m.column)) {
          sqlite.exec(m.sql);
          console.log(`✅ DB migration: Added ${m.column} to ${m.table}`);
        }
      } catch (e) {
        // Column might already exist, ignore
      }
    }

    // Create new tables if not exist
    const newTables = [
      `CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        opened_at TEXT DEFAULT (datetime('now')),
        closed_at TEXT,
        opening_cash REAL DEFAULT 0,
        closing_cash REAL,
        expected_cash REAL,
        cash_difference REAL,
        total_sales REAL DEFAULT 0,
        total_transactions INTEGER DEFAULT 0,
        status TEXT DEFAULT 'open',
        notes TEXT,
        opened_by_name TEXT,
        store_id INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        username TEXT,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        old_value TEXT,
        new_value TEXT,
        ip_address TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        store_id INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS refunds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        refund_amount REAL NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'completed',
        created_at TEXT DEFAULT (datetime('now')),
        store_id INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS refund_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        refund_id INTEGER REFERENCES refunds(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        subtotal REAL NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS discounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'percentage',
        value REAL NOT NULL,
        min_purchase REAL DEFAULT 0,
        max_discount REAL,
        start_date TEXT,
        end_date TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        store_id INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS promo_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        discount_id INTEGER REFERENCES discounts(id) ON DELETE CASCADE,
        max_uses INTEGER DEFAULT 0,
        current_uses INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        store_id INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sku TEXT,
        price REAL,
        stock_quantity INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS combo_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        combo_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS token_blacklist (
        token TEXT PRIMARY KEY,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS login_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'success',
        ip_address TEXT,
        user_agent TEXT,
        store_id INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        message TEXT,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        store_id INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )`
    ];

    for (const sql of newTables) {
      try {
        sqlite.exec(sql);
      } catch (e) {
        console.error('Table creation error:', e.message);
      }
    }

    // Second pass: tables created just above (shifts, discounts, promo_codes,
    // refunds, audit_logs) were skipped by the migrations loop above because
    // they didn't exist yet — add store_id to them now if still missing.
    for (const table of ['shifts', 'discounts', 'promo_codes', 'refunds', 'audit_logs']) {
      try {
        const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all();
        if (!cols.some(c => c.name === 'store_id')) {
          sqlite.exec(`ALTER TABLE ${table} ADD COLUMN store_id INTEGER`);
        }
      } catch (e) {}
    }
  }

  // Backfill: give every pre-existing row a store so nothing already in the DB
  // becomes invisible once store_id starts being enforced in queries.
  function backfillDefaultStore() {
    try {
      let storeId;
      const existing = sqlite.prepare('SELECT id FROM stores ORDER BY id LIMIT 1').get();
      if (existing) {
        storeId = existing.id;
      } else {
        let name = "Do'kon";
        try {
          const settingsRow = sqlite.prepare('SELECT store_name FROM settings LIMIT 1').get();
          if (settingsRow?.store_name) name = settingsRow.store_name;
        } catch (e) {}
        const info = sqlite.prepare('INSERT INTO stores (name) VALUES (?)').run(name);
        storeId = info.lastInsertRowid;
      }
      for (const table of storeScopedTables) {
        try {
          sqlite.prepare(`UPDATE ${table} SET store_id = ? WHERE store_id IS NULL`).run(storeId);
        } catch (e) {
          console.log(`⚠️ Backfill store_id for ${table}:`, e.message);
        }
      }
    } catch (e) {
      console.log('⚠️ Store backfill error:', e.message);
    }
  }

  autoMigrate();
  backfillDefaultStore();

  const db = {
    query: (sql, params) => Promise.resolve(runQuery(sql, params)),
    getClient: () => ({
      query: (sql, params) => Promise.resolve(runQuery(sql, params)),
      release: () => {},
    }),
    sqlite,
    isSqlite: true,
  };

  module.exports = db;
}
