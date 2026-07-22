/**
 * Standalone Bot Launcher
 * 
 * Bu script botlarni Express serverdan alohida ishga tushiradi.
 * Render.com yoki boshqa 24/7 xostingda ishlatish uchun.
 * 
 * Ishga tushirish: DATABASE_URL=... node standalone-bot.js
 */

require('dotenv').config();
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL env var kerak!');
  console.error('Bu bot Neon PostgreSQL ga ulanishi kerak.');
  process.exit(1);
}

console.log('🤖 Standalone bot ishga tushmoqda...');
console.log(`🕐 ${new Date().toISOString()}`);

// Ma'lumotlar bazasiga ulanish
const db = require('./src/config/db');
console.log('✅ PostgreSQL ga ulandı');

// @foodsPOS_bot ni ishga tushirish (bot.js ichida polling avtomatik boshlanadi)
console.log('🤖 @foodsPOS_bot ishga tushirilmoqda...');
try {
  require('./src/bot');
  console.log('✅ @foodsPOS_bot ishga tushdi');
} catch (err) {
  console.error('❌ @foodsPOS_bot ishga tushmadi:', err.message);
  process.exit(1);
}

// @klentlarchek_bot ni ishga tushirish
console.log('🤖 @klentlarchek_bot ishga tushirilmoqda...');
const klentBot = require('./src/klentBot');
klentBot.startPolling().then(() => {
  console.log('✅ @klentlarchek_bot ishga tushdi');
}).catch(err => {
  console.error('❌ @klentlarchek_bot xatosi:', err.message);
});

console.log('');
console.log('═══════════════════════════════');
console.log('✅ IKKALA BOT 24/7 ISHLAMOQDA!');
console.log('🤖 @foodsPOS_bot - Asosiy bot');
console.log('🤖 @klentlarchek_bot - Admin xabarnoma boti');
console.log(`📅 ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`);
console.log('═══════════════════════════════');
console.log('');
console.log('⚠️ Bu terminalni yopsangiz botlar to\'xtaydi.');
console.log('   Render.com da deploy qilinsa, 24/7 ishlaydi.');
console.log('');

// Protsessni aktiv ushlab turish (keep-alive)
process.on('SIGINT', () => {
  console.log('👋 Botlar to\'xtatilmoqda...');
  klentBot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Botlar to\'xtatilmoqda...');
  klentBot.stopPolling();
  process.exit(0);
});

// Uyqusiz keep-alive interval (Render spin-down oldini oladi)
setInterval(() => {
  const uptime = Math.floor(process.uptime());
  console.log(`💓 Botlar ishlamoqda... (uptime: ${Math.floor(uptime / 60)}m ${uptime % 60}s)`);
}, 300000); // 5 daqiqada bir marta log yozish
