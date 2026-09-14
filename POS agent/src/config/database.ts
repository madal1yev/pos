import path from 'path';
import dotenv from 'dotenv';
import DatabaseLib from 'better-sqlite3';
import { Pool } from 'pg';

dotenv.config();

export interface IDatabase {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
  getClient: () => Promise<any>;
  isSqlite: boolean;
  run: (sql: string, params?: any[]) => Promise<{ lastInsertRowid: number; changes: number }>;
  prepare: (sql: string) => any;
  close?: () => void;
}

function mapParams(sql: string, params: any[] = []): { sql: string; params: any[] } {
  const newParams: any[] = [];
  const replaced = sql.replace(/\$(\d+)/g, (match, num) => {
    const idx = parseInt(num) - 1;
    newParams.push(params[idx]);
    return '?';
  });
  return { sql: replaced, params: newParams };
}

const DATABASE_URL = process.env.DATABASE_URL;
let _dbInstance: IDatabase | null = null;

function createSqliteDb(): IDatabase {
  const DB_PATH = path.join(__dirname, '../../pos_agent.db');
  const sqlite = new (DatabaseLib as any)(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const sqliteDb: IDatabase = {
    isSqlite: true,
    query: async (sql: string, params?: any[]) => {
      const mapped = mapParams(sql, params || []);
      const trimmed = mapped.sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
        const stmt = sqlite.prepare(mapped.sql);
        return { rows: stmt.all(...mapped.params), rowCount: stmt.all(...mapped.params).length };
      }
      const stmt = sqlite.prepare(mapped.sql);
      const info = stmt.run(...mapped.params);
      return { rows: [], rowCount: info.changes };
    },
    getClient: async () => ({ query: async (sql: string, params: any[]) => { const mapped = mapParams(sql, params); return { rows: sqlite.prepare(mapped.sql).all(...mapped.params), rowCount: 0 }; }, release: () => {} }),
    run: async (sql: string, params?: any[]) => {
      const mapped = mapParams(sql, params || []);
      const stmt = sqlite.prepare(mapped.sql);
      const info = stmt.run(...mapped.params);
      return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
    },
    prepare: (sql: string) => sqlite.prepare(sql),
    close: () => sqlite.close(),
  };

  const migrations = [
    { table: 'tenants', column: 'slug', sql: "ALTER TABLE tenants ADD COLUMN slug TEXT" },
    { table: 'tenants', column: 'timezone', sql: "ALTER TABLE tenants ADD COLUMN timezone TEXT DEFAULT 'Asia/Tashkent'" },
    { table: 'tenants', column: 'tier', sql: "ALTER TABLE tenants ADD COLUMN tier TEXT DEFAULT 'starter'" },
    { table: 'users', column: 'tenant_id', sql: "ALTER TABLE users ADD COLUMN tenant_id INTEGER" },
    { table: 'users', column: 'role_id', sql: "ALTER TABLE users ADD COLUMN role_id INTEGER" },
    { table: 'users', column: 'is_admin', sql: "ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0" },
    { table: 'conversations', column: 'tenant_id', sql: "ALTER TABLE conversations ADD COLUMN tenant_id INTEGER" },
    { table: 'conversations', column: 'status', sql: "ALTER TABLE conversations ADD COLUMN status TEXT DEFAULT 'active'" },
    { table: 'conversations', column: 'language', sql: "ALTER TABLE conversations ADD COLUMN language TEXT DEFAULT 'uz'" },
  ];
  for (const m of migrations) {
    try { const cols = sqlite.prepare(`PRAGMA table_info(${m.table})`).all(); if (!cols.some((c: any) => c.name === m.column)) sqlite.exec(m.sql); } catch (e) {}
  }
  return sqliteDb;
}

function createPgDb(): IDatabase {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
  const pgDb: IDatabase = {
    isSqlite: false,
    query: async (sql: string, params?: any[]) => { const mapped = mapParams(sql, params || []); const result = await pool.query(mapped.sql, mapped.params); return { rows: result.rows, rowCount: result.rowCount }; },
    getClient: async () => { const client = await pool.connect(); return client; },
    run: async (sql: string, params?: any[]) => { const mapped = mapParams(sql, params || []); const result = await pool.query(mapped.sql, mapped.params); return { lastInsertRowid: result.rows[0]?.id || 0, changes: result.rowCount }; },
    prepare: () => { throw new Error('Prepare not supported for PostgreSQL'); },
  };
  return pgDb;
}

if (DATABASE_URL) { _dbInstance = createPgDb(); } else { _dbInstance = createSqliteDb(); }
export const db: IDatabase = _dbInstance;
