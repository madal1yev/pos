import fs from 'fs';
import path from 'path';
import { db } from '../config/database';
import logger from '../infrastructure/logger';

/**
 * Agent DB ni ishga tayyorlaydi: schema.sql ni bajaradi va
 * default tenant/sozlamalar/owner bog'lanishini yaratadi.
 * Idempotent — qayta-qayta ishlatish xavfsiz.
 */
export async function bootstrapDatabase(): Promise<void> {
  if (!db.isSqlite) {
    logger.warn('Bootstrap faqat SQLite rejimda ishlaydi (DATABASE_URL o\'rnatilmagan holat).');
    return;
  }

  const candidates = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, '../src/database/schema.sql'),
    path.join(process.cwd(), 'src/database/schema.sql'),
  ];
  const schemaPath = candidates.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    throw new Error(`schema.sql topilmadi: ${candidates.join(', ')}`);
  }
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await db.run(stmt);
    } catch (err: any) {
      logger.warn(`Schema statement skipped: ${(err?.message || String(err)).slice(0, 120)}`);
    }
  }

  await db.run(`CREATE TABLE IF NOT EXISTS token_blacklist (
    token TEXT PRIMARY KEY,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS worker_state (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  // 1) Default tenant
  let tenant = await db.query(`SELECT id FROM tenants WHERE id = 1`);
  if (tenant.rows.length === 0) {
    await db.run(
      `INSERT INTO tenants (id, name, slug, email, timezone, currency, currency_symbol, language, tier, is_active)
       VALUES (1, 'MaxPOS Agent', 'default', 'admin@pos.uz', 'Asia/Tashkent', 'UZS', 'som', 'uz', 'enterprise', 1)`
    );
    logger.info('Tenant #1 yaratildi');
  }

  // 2) Owner roli
  const role = await db.query(`SELECT id FROM roles WHERE tenant_id = 1 AND name = 'Business Owner'`);
  let roleId: number;
  if (role.rows.length === 0) {
    const r = await db.run(
      `INSERT INTO roles (name, description, level, permissions, tenant_id, is_system)
       VALUES ('Business Owner', 'Full business access', 100, '*', 1, 0)`
    );
    roleId = Number(r.lastInsertRowid);
  } else {
    roleId = role.rows[0].id;
  }

  // 3) Biznes sozlamalari
  const settings = await db.query(`SELECT id FROM business_settings WHERE tenant_id = 1`);
  if (settings.rows.length === 0) {
    await db.run(
      `INSERT INTO business_settings (tenant_id, settings, currency, timezone, language, default_ai_model, low_stock_threshold)
       VALUES (1, '{}', 'UZS', 'Asia/Tashkent', 'uz', 'gpt-4o-mini', 5)`
    );
  }

  // 4) Owner Telegram bog'lanishi (OWNER_CHAT_ID)
  const ownerChatId = parseInt(process.env.OWNER_CHAT_ID || '7882709730', 10);
  if (Number.isFinite(ownerChatId) && ownerChatId > 0) {
    let user = await db.query(
      `SELECT id FROM users WHERE tenant_id = 1 AND email = $1`,
      [`tg_${ownerChatId}@telegram.local`]
    );
    let userId: number;
    if (user.rows.length === 0) {
      const u = await db.run(
        `INSERT INTO users (tenant_id, email, name, username, role_id, is_active, is_admin)
         VALUES (1, $1, 'Telegram Owner', 'owner', $2, 1, 1)`,
        [`tg_${ownerChatId}@telegram.local`, roleId]
      );
      userId = Number(u.lastInsertRowid);
    } else {
      userId = user.rows[0].id;
    }

    const acc = await db.query(
      `SELECT id FROM telegram_accounts WHERE tenant_id = 1 AND telegram_user_id = $1`,
      [ownerChatId]
    );
    if (acc.rows.length === 0) {
      await db.run(
        `INSERT INTO telegram_accounts (tenant_id, user_id, telegram_user_id, telegram_chat_id, first_name, is_active)
         VALUES (1, $1, $2, $2, 'Owner', 1)`,
        [userId, ownerChatId]
      );
      logger.info(`Owner Telegram bog'landi: chat ${ownerChatId}`);
    } else {
      await db.run(
        `UPDATE telegram_accounts SET user_id = $1, telegram_chat_id = $2, is_active = 1 WHERE tenant_id = 1 AND telegram_user_id = $2`,
        [userId, ownerChatId]
      );
    }
  }

  // 5) Default POS ulanishi
  const pos = await db.query(`SELECT id FROM pos_connections WHERE tenant_id = 1`);
  if (pos.rows.length === 0) {
    const storeId = parseInt(process.env.POS_STORE_ID || '1', 10) || 1;
    await db.run(
      `INSERT INTO pos_connections (tenant_id, name, api_url, api_key, store_id, is_active, health_status)
       VALUES (1, 'Default POS', $1, $2, $3, 1, 'unknown')`,
      [process.env.POS_API_URL || 'http://localhost:5000/api', process.env.POS_API_KEY || '', storeId]
    );
  }

  logger.info('Database bootstrap tayyor');
}

if (require.main === module) {
  bootstrapDatabase()
    .then(() => {
      logger.info('Bootstrap yakunlandi');
      process.exit(0);
    })
    .catch((err) => {
      logger.error(`Bootstrap xato: ${err?.message || err}`);
      process.exit(1);
    });
}
