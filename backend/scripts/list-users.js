// ID lar ro'yxatini oddiy ko'rinishda chiqaradi + users-list.csv fayliga yozadi.
// Ishlatish:  cd backend  →  npm run list-users
// Shundan keyin accounts ni bloknot/Excel da ochish mumkin: backend/users-list.csv
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function main() {
  const r = await db.query(
    'SELECT u.id, u.name, u.email, u.account_id, u.is_active, u.store_id, r.name as role ' +
    'FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.id'
  );
  if (r.rows.length === 0) {
    console.log('Hozircha birorta ham foydalanuvchi yo‘q.');
    return;
  }
  console.log('=== AKKAUNT ID LAR RO‘YXATI ===');
  console.table(r.rows);

  const csvPath = path.join(__dirname, '..', 'users-list.csv');
  const esc = (v) => '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"';
  const lines = ['id,name,email,account_id,role,is_active,store_id'];
  for (const u of r.rows) {
    lines.push([u.id, esc(u.name), esc(u.email), esc(u.account_id), esc(u.role), u.is_active, u.store_id].join(','));
  }
  fs.writeFileSync(csvPath, '\ufeff' + lines.join('\n'), 'utf8'); // BOM — Excel o‘zbekchani to‘g‘ri ochishi uchun
  console.log('CSV yozildi: ' + csvPath + '  (bloknot/Excel da ochiladi)');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
