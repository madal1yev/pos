// Akkauntlar Telegram boti — backend bilan birga ishlaydi (alohida yoqish shart emas).
// Buyruqlar (o'zbekcha, oddiy matn ham bo'ladi):
//   hisobot    → umumiy hisobot: nechta akkaunt + array + bugungi savdo
//   akkountlar  → akkauntlar ro'yxati (array ko'rinishida)
//   sotuvlar   → savdo tahlili (tushum, o'rtacha chek, to'lov turlari, TOP-5)
//   ombor      → ombor tahlili (jami, kam qolganlar, tugaganlar)
//   tahlil     → kunlik tahlil + xavfsizlik (xato loginlar)
// Login faqat ruxsat etilgan chatdan (ACCOUNTS_CHAT_ID) qabul qilinadi.
require('dotenv').config();

const BOT_TOKEN = process.env.ACCOUNTS_BOT_TOKEN || '';
const ALLOWED_CHAT = String(
  process.env.ACCOUNTS_CHAT_ID || process.env.ADMIN_CHAT_ID || process.env.OWNER_CHAT_ID || '7882709730'
);
const ENABLED = process.env.ACCOUNTS_BOT_ENABLED !== 'false';

let offset = 0;
let running = false;
let reportTimer = null;

// Avtomatik soatlik hisobot — har soatda foydalanuvchi so'ramasdan ham yuboriladi
// Zakaz bot hisobiga akkauntlar arrayini yuboradi (savdo emas!)
async function autoHourlyReport() {
  if (!running || !BOT_TOKEN || !ALLOWED_CHAT) return;
  try {
    await cmdArray(ALLOWED_CHAT);
    console.log('📊 Akkaunt-bot: avtomatik akkauntlar arrayi yuborildi');
  } catch (e) {
    console.log('⚠️ Akkaunt-bot avtomatik hisobot xatosi:', e.message);
  }
}

function startAutoReport() {
  if (reportTimer) return;
  // Har soatda (60 daqiqada) bir marta
  reportTimer = setInterval(autoHourlyReport, 60 * 60 * 1000);
  // Birinchi hisobot 30 soniyadan keyin (backend hisobotidan keyin)
  setTimeout(autoHourlyReport, 30000);
  console.log('📊 Akkaunt-bot: avtomatik soatlik hisobot yoqildi');
}

async function api(method, params = {}) {
  const url = 'https://api.telegram.org/bot' + BOT_TOKEN + '/' + method;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(30000),
  });
  return res.json();
}

async function send(chatId, text) {
  try {
    await api('sendMessage', { chat_id: chatId, text: text, parse_mode: 'HTML' });
  } catch (e) {
    try {
      await api('sendMessage', { chat_id: chatId, text: text.replace(/<\/?[^>]+>/g, '') });
    } catch (e2) {
      console.log('⚠️ Akkaunt-bot yuborilmadi:', e2.message);
    }
  }
}

const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');

async function getAccounts() {
  const db = require('../config/db');
  const r = await db.query(
    'SELECT u.account_id, u.name, u.email, u.is_active, u.store_id, u.created_at, ' +
    "CASE WHEN u.pin IS NULL OR u.pin = '' THEN 0 ELSE 1 END as has_pin, " +
    'r.name as role, s.name as store_name, ' +
    "(SELECT MAX(created_at) FROM login_audit_logs l WHERE l.user_id = u.id AND l.status = 'success') as last_login, " +
    "(SELECT COUNT(*) FROM login_audit_logs l WHERE l.user_id = u.id AND l.status = 'success') as logins, " +
    "(SELECT COUNT(*) FROM login_audit_logs l WHERE l.user_id = u.id AND l.status = 'failed') as failed " +
    'FROM users u LEFT JOIN roles r ON u.role_id = r.id LEFT JOIN stores s ON s.id = u.store_id ORDER BY u.id'
  );
  return { db: db, rows: r.rows };
}

// users-import.json dagi parollar (ega o'zi yozgan — faqat shularni ko'rsatish mumkin,
// bazadagi parollar hashda saqlanadi va ularni qayta o'qib bo'lmaydi)
function loadKnownPasswords() {
  try {
    const fs = require('fs');
    const path = require('path');
    const p = path.join(__dirname, '..', '..', 'users-import.json');
    if (!fs.existsSync(p)) return {};
    const list = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!Array.isArray(list)) return {};
    const map = {};
    for (const e of list) {
      const digits = String(e.account_id || '').trim().toUpperCase().replace(/^M-?/, '').replace(/\D/g, '');
      if (digits && e.password) map['M-' + digits] = String(e.password);
    }
    return map;
  } catch (e) {
    return {};
  }
}

// 'YYYY-MM-DD HH:MM:SS' → 'DD.MM HH:MM'
function shortDate(s) {
  if (!s) return '—';
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return m ? m[3] + '.' + m[2] + ' ' + m[4] + ':' + m[5] : String(s).slice(0, 16);
}

// Telefonda o'qishga qulay ro'yxat: har bir akkaunt to'liq ma'lumoti bilan (kod formatisiz)
function accountsListText(rows) {
  return rows
    .map((u, i) => {
      const status = u.is_active ? '✅ faol' : '❌ o‘chiq';
      return (i + 1) + '. ' + (u.account_id || '—') + ' — ' + (u.name || '—') +
        '\n    └ ' + (u.role || '?') + ' | ' + status +
        '\n    └ 🏪 ' + (u.store_name || ('Do‘kon #' + (u.store_id || '—'))) +
        ' | 📌 PIN: ' + (u.has_pin ? 'bor' : 'yo‘q') +
        '\n    └ 🕐 oxirgi: ' + shortDate(u.last_login) + ' | kirishlar: ' + (u.logins || 0) + ' | xato: ' + (u.failed || 0);
    })
    .join('\n');
}

async function cmdAccounts(chatId) {
  const { rows } = await getAccounts();
  const active = rows.filter((u) => u.is_active).length;
  await send(
    chatId,
    '👥 <b>Akkountlar — jami: ' + rows.length + ' ta (faol: ' + active + ' ta)</b>\n━━━━━━━━━━━━━━━\n' +
    accountsListText(rows) +
    '\n\n💡 Xom array kerak bo‘lsa: <i>array</i> deb yozing.'
  );
}

// Batafsil ro'yxat: har bir akkaunt alohida kartochka (parol bilan, kod formatisiz)
async function cmdArray(chatId) {
  const { rows } = await getAccounts();
  const known = loadKnownPasswords();
  const cards = rows.map((u, i) => {
    const status = u.is_active ? '✅ faol' : '❌ o‘chiq';
    return (i + 1) + '. ID: ' + (u.account_id || '—') +
      '\n   Ism: ' + (u.name || '—') +
      '\n   Parol: ' + (known[u.account_id] || '—') +
      '\n   Rol: ' + (u.role || '?') + ' | ' + status +
      '\n   Do‘kon: ' + (u.store_name || '—') + ' | PIN: ' + (u.has_pin ? 'bor' : 'yo‘q') +
      '\n   Yaratilgan: ' + shortDate(u.created_at) + ' | Oxirgi: ' + shortDate(u.last_login) +
      '\n   Kirishlar: ' + (u.logins || 0) + ' | Xato: ' + (u.failed || 0);
  });
  const head = '👥 <b>Akkountlar batafsil (' + rows.length + ' ta):</b>\n' +
    '🔑 <i>Parol faqat import faylda yozilganlarda ko‘rinadi.</i>\n━━━━━━━━━━━━━━━\n';
  const full = head + cards.join('\n━━━━━━━━━━━━━━━\n');
  // Telegram limiti 4096 belgi — katta bo'lsa 2 ga bo'lib yuboramiz
  if (full.length <= 3900) {
    await send(chatId, full);
  } else {
    const half = Math.ceil(cards.length / 2);
    await send(chatId, head + cards.slice(0, half).join('\n━━━━━━━━━━━━━━━\n'));
    await send(chatId, cards.slice(half).join('\n━━━━━━━━━━━━━━━\n'));
  }
}

async function cmdHisobot(chatId) {
  const db = require('../config/db');
  const todayCond = db.isSqlite ? "DATE(created_at) = DATE('now')" : 'DATE(created_at) = CURRENT_DATE';
  const hourCond = db.isSqlite
    ? "datetime(created_at) >= datetime('now', '-60 minutes')"
    : "created_at >= NOW() - INTERVAL '60 minutes'";
  const prevHourCond = db.isSqlite
    ? "datetime(created_at) >= datetime('now', '-120 minutes') AND datetime(created_at) < datetime('now', '-60 minutes')"
    : "created_at >= NOW() - INTERVAL '120 minutes' AND created_at < NOW() - INTERVAL '60 minutes'";

  const users = await db.query('SELECT COUNT(*) as cnt FROM users');
  const day = await db.query(
    'SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE ' + todayCond
  );
  const hour = await db.query(
    'SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE ' + hourCond
  );
  const prevHour = await db.query(
    'SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE ' + prevHourCond
  );
  const avgCheck = await db.query(
    'SELECT COALESCE(AVG(total_amount), 0) as avg FROM sales WHERE ' + todayCond
  );

  let lowStock = { rows: [] };
  try {
    lowStock = await db.query(
      "SELECT name, stock_quantity FROM products WHERE status = 'active' AND stock_quantity <= minimum_stock AND stock_quantity > 0 ORDER BY stock_quantity ASC LIMIT 5"
    );
  } catch (e) {}

  const d = day.rows[0] || {};
  const h = hour.rows[0] || {};
  const ph = prevHour.rows[0] || {};
  const avg = avgCheck.rows[0] || {};

  const revenueTrend = ph.revenue
    ? Math.round(((h.revenue - ph.revenue) / ph.revenue) * 100)
    : 0;
  const orderTrend = ph.cnt
    ? Math.round(((h.cnt - ph.cnt) / ph.cnt) * 100)
    : 0;
  const trendIcon = (p) => p > 0 ? `🟢 +${p}%` : p < 0 ? `🔴 ${p}%` : '⚪ 0%';

  const lowTxt = (lowStock.rows || []).map(p => `   • ${p.name} — ${p.stock_quantity} ta`).join('\n') || '   Hammasi yetarli ✅';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' });

  let report = `📊 <b>SOATLIK HISOBOT</b>\n`;
  report += `🗓 ${dateStr} | ⏰ ${timeStr}\n`;
  report += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  report += `💰 <b>Tushum:</b> ${fmt(d.revenue)} so'm  ${trendIcon(revenueTrend)}\n`;
  report += `🧾 <b>Savdolar:</b> ${d.cnt || 0} ta  ${trendIcon(orderTrend)}\n`;
  report += `💳 <b>O'rtacha chek:</b> ${fmt(avg.avg)} so'm\n`;
  report += `👥 <b>Akkountlar:</b> ${users.rows[0].cnt || 0} ta\n\n`;
  report += `⏱ <b>Oxirgi 1 soat:</b> ${fmt(h.revenue)} so'm (${h.cnt || 0} ta)\n\n`;
  report += `⚠️ <b>Zaxira kam qolgan:</b>\n${lowTxt}\n\n`;
  report += `━━━━━━━━━━━━━━━━━━━━\n`;
  report += `🤖 Avtomatik generatsiya qilindi`;

  await send(chatId, report);
}

async function cmdSotuvlar(chatId) {
  const db = require('../config/db');
  const todayCond = db.isSqlite ? "DATE(created_at) = DATE('now')" : 'DATE(created_at) = CURRENT_DATE';
  const todayAlias = db.isSqlite ? "DATE(s.created_at) = DATE('now')" : 'DATE(s.created_at) = CURRENT_DATE';
  const day = await db.query(
    'SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue, COALESCE(AVG(total_amount), 0) as avg FROM sales WHERE ' + todayCond
  );
  let byPay = { rows: [] };
  let top = { rows: [] };
  try {
    byPay = await db.query(
      'SELECT payment_method, COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE ' +
      todayCond + ' GROUP BY payment_method'
    );
  } catch (e) {}
  try {
    top = await db.query(
      'SELECT p.name, SUM(si.quantity) as sold FROM sale_items si ' +
      'JOIN products p ON si.product_id = p.id JOIN sales s ON s.id = si.sale_id ' +
      'WHERE ' + todayAlias + ' GROUP BY p.id, p.name ORDER BY sold DESC LIMIT 5'
    );
  } catch (e) {}
  const d = day.rows[0] || {};
  const payTxt = (byPay.rows || [])
    .map((p) => '  • ' + (p.payment_method || '?') + ': ' + p.cnt + ' ta — ' + fmt(p.revenue))
    .join('\n') || '  —';
  const topTxt = (top.rows || [])
    .map((p) => '  • ' + p.name + ' — ' + p.sold + ' ta')
    .join('\n') || '  Hozircha savdo yo‘q';
  await send(
    chatId,
    '💰 <b>Savdo tahlili — bugun</b>\n━━━━━━━━━━━━━━━\n' +
    '💵 Tushum: <b>' + fmt(d.revenue) + " so'm</b>\n" +
    '🧾 Savdolar: <b>' + (d.cnt || 0) + ' ta</b>\n' +
    '🧮 O‘rtacha chek: <b>' + fmt(d.avg) + " so'm</b>\n\n" +
    '💳 <b>To‘lov turlari:</b>\n' + payTxt + '\n\n🔥 <b>TOP-5:</b>\n' + topTxt
  );
}

async function cmdOmbor(chatId) {
  const db = require('../config/db');
  const total = await db.query(
    "SELECT COUNT(*) as cnt, COALESCE(SUM(stock_quantity), 0) as stock FROM products WHERE status = 'active'"
  );
  let low = { rows: [] };
  let out = { rows: [] };
  try {
    low = await db.query(
      'SELECT name, stock_quantity, minimum_stock FROM products ' +
      "WHERE status = 'active' AND stock_quantity > 0 AND stock_quantity <= minimum_stock ORDER BY stock_quantity ASC LIMIT 10"
    );
  } catch (e) {}
  try {
    out = await db.query(
      "SELECT name FROM products WHERE status = 'active' AND stock_quantity <= 0 LIMIT 10"
    );
  } catch (e) {}
  const t = total.rows[0] || {};
  const lowTxt = (low.rows || []).map((p) => '  • ' + p.name + ' — ' + p.stock_quantity + ' ta').join('\n') || '  Yo‘q ✅';
  const outTxt = (out.rows || []).map((p) => '  • ' + p.name).join('\n') || '  Yo‘q ✅';
  await send(
    chatId,
    '📦 <b>Ombor tahlili</b>\n━━━━━━━━━━━━━━━\n' +
    '📋 Faol mahsulotlar: <b>' + (t.cnt || 0) + ' ta</b>\n' +
    '📦 Jami zaxira: <b>' + fmt(t.stock) + ' dona</b>\n\n' +
    '⚠️ <b>Kam qolganlar:</b>\n' + lowTxt + '\n\n🔴 <b>Tugaganlar:</b>\n' + outTxt
  );
}

async function cmdTahlil(chatId) {
  const db = require('../config/db');
  const todayCond = db.isSqlite ? "DATE(created_at) = DATE('now')" : 'DATE(created_at) = CURRENT_DATE';
  const day = await db.query(
    'SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE ' + todayCond
  );
  let failed = { rows: [] };
  try {
    failed = await db.query(
      "SELECT COUNT(*) as cnt FROM login_audit_logs WHERE status = 'failed' AND " +
      (db.isSqlite ? "DATE(created_at) = DATE('now')" : 'DATE(created_at) = CURRENT_DATE')
    );
  } catch (e) {}
  let hours = { rows: [] };
  try {
    const hourExpr = db.isSqlite
      ? "strftime('%H', created_at)"
      : "EXTRACT(HOUR FROM created_at)";
    hours = await db.query(
      'SELECT ' + hourExpr + ' as h, COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE ' +
      todayCond + ' GROUP BY h ORDER BY h'
    );
  } catch (e) {}
  const d = day.rows[0] || {};
  const hourTxt = (hours.rows || []).map((h) => '  • ' + h.h + ':00 — ' + h.cnt + ' ta (' + fmt(h.revenue) + ')').join('\n') || '  —';
  await send(
    chatId,
    '📈 <b>Kunlik tahlil</b>\n━━━━━━━━━━━━━━━\n' +
    '💰 Tushum: <b>' + fmt(d.revenue) + " so'm</b> (" + (d.cnt || 0) + ' ta savdo)\n' +
    '🛡 Bugungi xato kirishlar: <b>' + ((failed.rows[0] || {}).cnt || 0) + ' ta</b>\n\n' +
    '⏰ <b>Soatlar kesimida:</b>\n' + hourTxt
  );
}

function helpText() {
  return '🤖 <b>MaxPOS Akkaunt-boti</b>\n━━━━━━━━━━━━━━━\n' +
    '📊 <b>hisobot</b> — umumiy hisobot\n' +
    '👥 <b>akkountlar</b> — qisqa ro‘yxat\n' +
    '🧾 <b>array</b> — batafsil ro‘yxat (parol bilan)\n' +
    '💰 <b>sotuvlar</b> — savdo tahlili\n' +
    '📦 <b>ombor</b> — ombor tahlili\n' +
    '📈 <b>tahlil</b> — kunlik tahlil + xavfsizlik\n\n' +
    'Buyruq yoki oddiy so‘z yuboring (masalan: <i>akkountlar</i>).';
}

async function handleText(chatId, rawText) {
  const text = String(rawText || '').toLowerCase().replace(/@\w+/g, '').trim();
  if (!text) return;
  try {
    if (/(hisobot|otchet|otchot|report)/.test(text)) return await cmdHisobot(chatId);
    if (/(array|json|massiv)/.test(text)) return await cmdArray(chatId);
    if (/(akkount|account|akkaunt|idlar|foydalanuvchi|polzovatel|users)/.test(text)) return await cmdAccounts(chatId);
    if (/(sotuv|savdo|tushum|pul|продаж|выруч)/.test(text)) return await cmdSotuvlar(chatId);
    if (/(ombor|sklad|mahsulot|tovar|stock|qoldiq)/.test(text)) return await cmdOmbor(chatId);
    if (/(tahlil|analiz|tahlil|kunlik|xavfsiz|login|urinish)/.test(text)) return await cmdTahlil(chatId);
    if (/(start|salom|hello|help|yordam|menyu|menu)/.test(text)) return await send(chatId, helpText());
    await send(chatId, '❓ Tushunmadim. ' + helpText());
  } catch (e) {
    console.log('⚠️ Akkaunt-bot handler:', e.message);
    await send(chatId, '⚠️ Xatolik: ' + e.message);
  }
}

async function poll() {
  if (!running) return;
  try {
    const data = await api('getUpdates', { offset: offset, timeout: 25 });
    if (data && data.ok && Array.isArray(data.result)) {
      for (const u of data.result) {
        offset = u.update_id + 1;
        const msg = u.message || u.edited_message;
        if (!msg || !msg.text) continue;
        const chatId = String(msg.chat.id);
        if (chatId !== ALLOWED_CHAT) {
          await send(chatId, '⛔ Ruxsat yo‘q. Bu bot faqat tizim egasiga xizmat qiladi.');
          continue;
        }
        await handleText(chatId, msg.text);
      }
    }
  } catch (e) {
    console.log('⚠️ Akkaunt-bot polling:', e.message);
    await new Promise((r) => setTimeout(r, 5000));
  }
  if (running) setTimeout(poll, 100);
}

async function startAccountsBot() {
  if (!ENABLED) {
    console.log('⏸ Akkaunt-boti o‘chiq (ACCOUNTS_BOT_ENABLED=false)');
    return;
  }
  if (!BOT_TOKEN) {
    console.log('⚠️ Akkaunt-boti: ACCOUNTS_BOT_TOKEN topilmadi (backend/.env).');
    return;
  }
  try {
    const me = await api('getMe');
    if (!me.ok) {
      console.log('⚠️ Akkaunt-boti token xato:', JSON.stringify(me).slice(0, 120));
      return;
    }
    console.log('🤖 Akkaunt-boti yoqildi: @' + me.result.username + ' (chat ' + ALLOWED_CHAT + ')');
    running = true;
    poll();
    startAutoReport();
  } catch (e) {
    console.log('⚠️ Akkaunt-boti ishga tushmadi:', e.message);
  }
}

function stopAccountsBot() {
  running = false;
  if (reportTimer) clearInterval(reportTimer);
  reportTimer = null;
}

module.exports = { startAccountsBot, stopAccountsBot, handleText };
