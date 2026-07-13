const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_PATH = path.join(__dirname, '../../pos_database.db');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

function mapParams(sql, params = []) {
  const newParams = [];
  let paramIdx = 0;
  const replaced = sql.replace(/\$(\d+)/g, () => {
    newParams.push(params[paramIdx]);
    paramIdx++;
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
      const stmt2 = sqlite.prepare(mapped);
      const rows = stmt2.all(...mappedParams);
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

const db = {
  query: (sql, params) => Promise.resolve(runQuery(sql, params)),
  getClient: () => ({
    query: (sql, params) => Promise.resolve(runQuery(sql, params)),
    release: () => {},
  }),
  sqlite,
};

module.exports = db;
