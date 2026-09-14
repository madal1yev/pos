// users-import.json (ARRAY) dagi akkauntlarni bazaga qo'shadi.
// Ishlatish:  cd backend  →  npm run import-users
// Fayl formati (massiv):
//   [{ "name": "Sotuvchi Ali", "account_id": "M-100001", "password": "123456", "role": "cashier" }]
// - account_id bo'sh qoldirilsa avtomatik M-XXXXXX beriladi
// - role: "admin" yoki "cashier" (bo'lmasa cashier)
// - keyin o'sha ID + parol bilan login sahifasidan kiriladi
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const IMPORT_PATH = path.join(__dirname, '..', 'users-import.json');

const normalizeAccountId = (value) => {
  if (!value) return null;
  const digits = String(value).trim().toUpperCase().replace(/^M-?/, '').replace(/\D/g, '');
  return digits ? 'M-' + digits : null;
};

async function main() {
  if (!fs.existsSync(IMPORT_PATH)) {
    console.log('users-import.json topilmadi. Namuna yaratildi — uni to‘ldirib qayta ishga tushiring.');
    fs.writeFileSync(IMPORT_PATH, '[\n  {\n    "name": "Sotuvchi Ali",\n    "account_id": "M-100001",\n    "password": "123456",\n    "role": "cashier"\n  }\n]\n', 'utf8');
    return;
  }
  let list;
  try {
    list = JSON.parse(fs.readFileSync(IMPORT_PATH, 'utf8'));
  } catch (e) {
    console.error('users-import.json — JSON xato:', e.message);
    process.exit(1);
  }
  if (!Array.isArray(list)) {
    console.error('Xato: fayl ARRAY bo‘lishi shart: [ {...}, {...} ]');
    process.exit(1);
  }
  if (list.length === 0) {
    console.log('Massiv bo‘sh — qo‘shiladigan akkaunt yo‘q.');
    return;
  }

  const roles = await db.query('SELECT id, name FROM roles');
  const roleByName = {};
  for (const r of roles.rows) roleByName[r.name] = r.id;
  const store = await db.query('SELECT id FROM stores ORDER BY id LIMIT 1');
  const defaultStoreId = store.rows[0] ? store.rows[0].id : null;

  const created = [];
  for (const entry of list) {
    const name = String(entry.name || '').trim();
    const password = String(entry.password || '');
    if (!name) { console.log('SKIP (ism yo‘q):', JSON.stringify(entry)); continue; }
    if (password.length < 6) { console.log('SKIP (parol kamida 6 belgi):', name); continue; }

    let accountId = normalizeAccountId(entry.account_id || '');
    while (!accountId) {
      accountId = 'M-' + Math.floor(100000 + Math.random() * 900000);
      const dup = await db.query('SELECT id FROM users WHERE account_id = $1', [accountId]);
      if (dup.rows.length > 0) accountId = null;
    }

    const roleId = roleByName[entry.role] || roleByName['cashier'];
    const email = accountId.toLowerCase() + '@pos.local';
    const hash = await bcrypt.hash(password, 10);
    const storeId = entry.store_id || defaultStoreId;

    // ID band bo'lsa — yangilash (parol/ism/rol almashtiriladi).
    // Shunda parolni unutgan akkauntga shu fayl orqali yangi parol berish mumkin.
    const existing = await db.query('SELECT id FROM users WHERE account_id = $1', [accountId]);
    if (existing.rows.length > 0) {
      await db.query(
        'UPDATE users SET name = $1, password = $2, role_id = $3 WHERE account_id = $4',
        [name, hash, roleId, accountId]
      );
      created.push({ name: name, account_id: accountId, password: password, role: entry.role || 'cashier', updated: true });
      console.log('🔄 Yangilandi (parol almashtirildi):', name, '→', accountId);
      continue;
    }

    await db.query(
      'INSERT INTO users (name, email, password, role_id, store_id, account_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, email, hash, roleId, storeId, accountId]
    );
    created.push({ name: name, account_id: accountId, password: password, role: entry.role || 'cashier' });
    console.log('✅ Qo‘shildi:', name, '→', accountId);
  }

  console.log('\n=== YARATILGAN AKKAUNTLAR (array) ===');
  console.log(JSON.stringify(created, null, 2));
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
