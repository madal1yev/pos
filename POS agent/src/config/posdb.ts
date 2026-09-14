import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import DatabaseLib from 'better-sqlite3';

dotenv.config();

export interface IPosDb {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
  isAvailable: boolean;
  dbPath: string;
}

function mapParams(sql: string, params: any[] = []): { sql: string; params: any[] } {
  const newParams: any[] = [];
  const replaced = sql.replace(/\$(\d+)/g, (_match, num) => {
    const idx = parseInt(num, 10) - 1;
    newParams.push(params[idx]);
    return '?';
  });
  return { sql: replaced, params: newParams };
}

function resolvePosDbPath(): string {
  if (process.env.POS_DB_PATH) return path.resolve(process.env.POS_DB_PATH);
  return path.join(__dirname, '../../../backend/pos_database.db');
}

const DB_PATH = resolvePosDbPath();

const storeColumnCache: Record<string, boolean> = {};

function createPosDb(): IPosDb {
  if (!fs.existsSync(DB_PATH)) {
    const unavailable: IPosDb = {
      isAvailable: false,
      dbPath: DB_PATH,
      query: async () => {
        throw new Error(
          `POS ma'lumotlar bazasi topilmadi: ${DB_PATH}. ` +
          `POS_DB_PATH ni .env da ko'rsating yoki backend ni ishga tushiring.`
        );
      },
    };
    return unavailable;
  }

  const sqlite = new (DatabaseLib as any)(DB_PATH, { readonly: true });

  return {
    isAvailable: true,
    dbPath: DB_PATH,
    query: async (sql: string, params?: any[]) => {
      const mapped = mapParams(sql, params || []);
      const stmt = sqlite.prepare(mapped.sql);
      const rows = stmt.all(...mapped.params);
      return { rows, rowCount: rows.length };
    },
  };
}

export const posDb: IPosDb = createPosDb();

export function posStoreId(): number {
  const v = parseInt(process.env.POS_STORE_ID || '1', 10);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

/** Backend jadvalida store_id ustuni bo'lsa, WHERE ga qo'shish uchun filter qaytaradi. */
export function posStoreFilter(table: string, alias?: string): string {
  try {
    if (!posDb.isAvailable) return '';
    if (storeColumnCache[table] === undefined) {
      const sqlite = new (DatabaseLib as any)(DB_PATH, { readonly: true });
      try {
        const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as any[];
        storeColumnCache[table] = cols.some((c) => c.name === 'store_id');
      } finally {
        sqlite.close();
      }
    }
    if (!storeColumnCache[table]) return '';
    const prefix = alias ? `${alias}.` : '';
    return ` AND ${prefix}store_id = ${posStoreId()}`;
  } catch {
    return '';
  }
}
