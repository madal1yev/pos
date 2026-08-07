const path = require('path');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

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
      { table: 'products', column: 'has_variants', sql: "ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants INTEGER DEFAULT 0" },
      { table: 'products', column: 'is_combo', sql: "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_combo INTEGER DEFAULT 0" },
      { table: 'roles', column: 'permissions', sql: "ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions TEXT" },
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

  // Run auto-migration on startup
  pgAutoMigrate().catch(e => console.log('⚠️ PG auto-migration error:', e.message));

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
      { table: 'sales', column: 'delivery_address', sql: "ALTER TABLE sales ADD COLUMN delivery_address TEXT" },
      { table: 'sales', column: 'shift_id', sql: "ALTER TABLE sales ADD COLUMN shift_id INTEGER" },
      { table: 'sales', column: 'sale_type', sql: "ALTER TABLE sales ADD COLUMN sale_type TEXT DEFAULT 'sale'" },
      { table: 'sales', column: 'discount_id', sql: "ALTER TABLE sales ADD COLUMN discount_id INTEGER" },
      { table: 'sales', column: 'promo_code', sql: "ALTER TABLE sales ADD COLUMN promo_code TEXT" },
      { table: 'settings', column: 'smtp_host', sql: "ALTER TABLE settings ADD COLUMN smtp_host TEXT" },
      { table: 'settings', column: 'smtp_port', sql: "ALTER TABLE settings ADD COLUMN smtp_port INTEGER DEFAULT 587" },
      { table: 'products', column: 'has_variants', sql: "ALTER TABLE products ADD COLUMN has_variants INTEGER DEFAULT 0" },
      { table: 'products', column: 'is_combo', sql: "ALTER TABLE products ADD COLUMN is_combo INTEGER DEFAULT 0" },
      { table: 'roles', column: 'permissions', sql: "ALTER TABLE roles ADD COLUMN permissions TEXT" },
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
        opened_by_name TEXT
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
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS refunds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        refund_amount REAL NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'completed',
        created_at TEXT DEFAULT (datetime('now'))
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
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS promo_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        discount_id INTEGER REFERENCES discounts(id) ON DELETE CASCADE,
        max_uses INTEGER DEFAULT 0,
        current_uses INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
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
      )`
    ];

    for (const sql of newTables) {
      try {
        sqlite.exec(sql);
      } catch (e) {
        console.error('Table creation error:', e.message);
      }
    }
  }

  autoMigrate();

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
