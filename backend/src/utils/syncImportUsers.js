// users-import.json → bazaga AVTOMATIK sinxronlash (har boot da, faqat fayl o'zgarganda).
// Fayl — akkauntlar manbai: mavjud account_id YANGILANADI (ism/parol/rol),
// yangisi qo'shiladi. Shunda jonli (Vercel/Postgres) bazada ham fayldagi
// ID + parol bilan kirish ishlaydi — qo'lda import shart emas.
// Hech qachon xato OTMAYDI — server boot to'xtab qolmasligi uchun.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const IMPORT_PATH = path.join(__dirname, '..', '..', 'users-import.json');

const normalizeAccountId = (value) => {
  if (!value) return null;
  const digits = String(value).trim().toUpperCase().replace(/^M-?/, '').replace(/\D/g, '');
  return digits ? 'M-' + digits : null;
};

async function syncImportUsers(q) {
  try {
    if (!fs.existsSync(IMPORT_PATH)) return; // fayl deploy qilinmagan — o'tkazib yuborish
    const raw = fs.readFileSync(IMPORT_PATH, 'utf8');
    const hash = crypto.createHash('sha1').update(raw).digest('hex');
    let list;
    try {
      list = JSON.parse(raw);
    } catch (e) {
      console.log('⚠️ users-import.json — JSON xato, sinxronlash o‘tkazildi');
      return;
    }
    if (!Array.isArray(list) || list.length === 0) return;

    try {
      await q.query('CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT)');
    } catch (e) { /* jadval allaqachon boshqa sxemada bo'lishi mumkin */ }
    try {
      const prev = await q.query("SELECT value FROM app_meta WHERE key = 'users_import_hash'");
      if (prev.rows[0] && prev.rows[0].value === hash) return; // o'zgarish yo'q — chiqish
    } catch (e) { /* jadval bo'lmasa — sinxronlashda davom etamiz */ }

    let roles;
    try {
      roles = await q.query('SELECT id, name FROM roles');
    } catch (e) {
      console.log('⚠️ users sync: roles jadvali yo‘q, o‘tkazildi');
      return;
    }
    const roleByName = {};
    for (const r of roles.rows) roleByName[r.name] = r.id;
    if (!roleByName['cashier'] && !roleByName['admin']) {
      console.log('⚠️ users sync: rollar bo‘sh, o‘tkazildi');
      return;
    }

    let defaultStoreId = null;
    try {
      const store = await q.query('SELECT id FROM stores ORDER BY id LIMIT 1');
      if (store.rows[0]) defaultStoreId = store.rows[0].id;
    } catch (e) { /* do'kon shart emas */ }

    // entry.store (nom) yoki entry.store_id bo'yicha do'konni aniqlaydi,
    // yo'q bo'lsa yangi do'kon yaratadi. Har bir akkaunt ALOHLIDA do'konga ega bo'ladi.
    const resolveStoreId = async (entry) => {
      if (entry.store_id) return parseInt(entry.store_id, 10);
      const storeName = String(entry.store || '').trim();
      if (!storeName) return defaultStoreId; // entry'da do'kon ko'rsatilmagan — o'zgarmaydi
      try {
        const found = await q.query('SELECT id FROM stores WHERE LOWER(name) = LOWER($1)', [storeName]);
        if (found.rows[0]) return found.rows[0].id;
        const created = await q.query('INSERT INTO stores (name) VALUES ($1) RETURNING id', [storeName]);
        const newId = created.rows[0].id;
        try {
          await q.query(
            `INSERT INTO settings (store_name, currency, currency_symbol, tax_percentage, low_stock_threshold, store_id)
             VALUES ($1, 'UZS', $2, 0, 10, $3)`,
            [storeName, "so'm", newId]
          );
        } catch (e) { /* settings yaratilmasa ham do'kon ishlaydi */ }
        return newId;
      } catch (e) {
        return defaultStoreId;
      }
    };

    let added = 0;
    let updated = 0;
    for (const entry of list) {
      const name = String(entry.name || '').trim();
      const password = String(entry.password || '');
      if (!name || password.length < 6) continue;
      const accountId = normalizeAccountId(entry.account_id || '');
      if (!accountId) continue;
      const roleId = roleByName[entry.role] || roleByName['cashier'];
      if (!roleId) continue;
      const hashPw = await bcrypt.hash(password, 10);
      const email = accountId.toLowerCase() + '@pos.local';
      const explicitStore = !!(entry.store || entry.store_id);
      const storeId = await resolveStoreId(entry);
      const existing = await q.query('SELECT id, store_id FROM users WHERE account_id = $1', [accountId]);
      if (existing.rows.length > 0) {
        // Do'kon faqat faylda aniq ko'rsatilganda yangilanadi (boshqa joyda
        // ko'chirilgan foydalanuvchi tasodifan qaytmasligi uchun)
        if (explicitStore && storeId && parseInt(existing.rows[0].store_id, 10) !== storeId) {
          await q.query(
            'UPDATE users SET name = $1, password = $2, role_id = $3, store_id = $4 WHERE account_id = $5',
            [name, hashPw, roleId, storeId, accountId]
          );
        } else {
          await q.query(
            'UPDATE users SET name = $1, password = $2, role_id = $3 WHERE account_id = $4',
            [name, hashPw, roleId, accountId]
          );
        }
        updated++;
      } else {
        await q.query(
          'INSERT INTO users (name, email, password, role_id, store_id, account_id) VALUES ($1, $2, $3, $4, $5, $6)',
          [name, email, hashPw, roleId, storeId, accountId]
        );
        added++;
      }
    }

    try {
      const cur = await q.query("SELECT value FROM app_meta WHERE key = 'users_import_hash'");
      if (cur.rows.length === 0) {
        await q.query("INSERT INTO app_meta (key, value) VALUES ('users_import_hash', $1)", [hash]);
      } else {
        await q.query("UPDATE app_meta SET value = $1 WHERE key = 'users_import_hash'", [hash]);
      }
    } catch (e) { /* hash saqlanmasa — keyingi boot da qayta uriniladi */ }

    console.log(`✅ users-import.json sinxronlandi: ${added} qo'shildi, ${updated} yangilandi`);
  } catch (e) {
    console.log('⚠️ users sync xato:', String(e.message || e).slice(0, 150));
  }
}

module.exports = syncImportUsers;
