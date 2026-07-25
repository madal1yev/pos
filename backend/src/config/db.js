const path = require('path');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

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
        const rows = sqlite.prepare(mapped).all(...mappedParams);
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

  // Auto-migration: add missing columns
  function autoMigrate() {
    const migrations = [
      { table: 'sales', column: 'delivery_address', sql: "ALTER TABLE sales ADD COLUMN delivery_address TEXT" },
      { table: 'settings', column: 'admin_telegram', sql: "ALTER TABLE settings ADD COLUMN admin_telegram TEXT" },
      { table: 'categories', column: 'emoji', sql: "ALTER TABLE categories ADD COLUMN emoji TEXT DEFAULT '📁'" },
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
