// Soatlik hisobot — BACKEND ichida ishlaydi, har soatda Telegramga professional hisobot yuboradi.
// Token qayerdan olinadi (birinchi topilgani):
//   1. backend .env → TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
//   2. backend .env → ADMIN_BOT_TOKEN + ADMIN_CHAT_ID
//   3. "POS agent"/.env → BOT_TOKEN + OWNER_CHAT_ID (avtomatik fallback)
const fs = require('fs');
const path = require('path');
const { generateHourlyReport } = require('./reportGenerator');

function loadPosAgentEnvFallback() {
  if (process.env.TELEGRAM_BOT_TOKEN || process.env.ADMIN_BOT_TOKEN) return;
  try {
    const p = path.join(__dirname, '..', '..', '..', 'POS agent', '.env');
    if (!fs.existsSync(p)) return;
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const k = m[1];
      const v = m[2];
      if ((k === 'BOT_TOKEN' || k === 'OWNER_CHAT_ID') && !process.env[k]) {
        process.env[k] = v;
      }
    }
    if (process.env.BOT_TOKEN) console.log('📦 Telegram token POS agent/.env dan olindi (fallback)');
  } catch (e) {
    console.log('⚠️ POS agent .env fallback:', e.message);
  }
}

loadPosAgentEnvFallback();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.ADMIN_BOT_TOKEN || process.env.BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.ADMIN_CHAT_ID || process.env.OWNER_CHAT_ID || '';
const ENABLED = process.env.HOURLY_REPORT_ENABLED !== 'false';
const INTERVAL_MS = parseInt(process.env.HOURLY_REPORT_INTERVAL_MS || String(60 * 60 * 1000), 10);

async function sendTelegram(text) {
  if (!BOT_TOKEN || !CHAT_ID) return false;
  try {
    const url = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      // Fallback: HTML tagsiz
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: text.replace(/<\/?[^>]+>/g, '') }),
        signal: AbortSignal.timeout(10000),
      });
    }
    return true;
  } catch (e) {
    console.log('⚠️ Soatlik hisobot yuborilmadi:', e.message);
    return false;
  }
}

async function buildReport() {
  const db = require('../config/db');

  const todayCond = db.isSqlite ? "DATE(created_at) = DATE('now')" : 'DATE(created_at) = CURRENT_DATE';
  const hourCond = db.isSqlite
    ? "datetime(created_at) >= datetime('now', '-60 minutes')"
    : "created_at >= NOW() - INTERVAL '60 minutes'";
  const prevHourCond = db.isSqlite
    ? "datetime(created_at) >= datetime('now', '-120 minutes') AND datetime(created_at) < datetime('now', '-60 minutes')"
    : "created_at >= NOW() - INTERVAL '120 minutes' AND created_at < NOW() - INTERVAL '60 minutes'";

  // Asosiy statistikalar
  const day = await db.query(
    'SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE ' + todayCond
  );
  const hour = await db.query(
    'SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE ' + hourCond
  );
  const prevHour = await db.query(
    'SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE ' + prevHourCond
  );

  // O'rtacha chek
  const avgCheck = await db.query(
    'SELECT COALESCE(AVG(total_amount), 0) as avg FROM sales WHERE ' + todayCond
  );

  // Bekor qilinganlar
  let cancelled = { rows: [] };
  try {
    cancelled = await db.query(
      "SELECT COUNT(*) as cnt FROM sales WHERE status = 'cancelled' AND " + todayCond
    );
  } catch (e) { /* status yo'q bo'lsa */ }

  // Yangi mijozlar
  let newCustomers = { rows: [] };
  try {
    newCustomers = await db.query(
      'SELECT COUNT(*) as cnt FROM customers WHERE ' + todayCond
    );
  } catch (e) { /* customers jadvali bo'lmasa */ }

  // To'lov usullari
  let paymentMethods = { rows: [] };
  try {
    paymentMethods = await db.query(
      'SELECT payment_method, SUM(total_amount) as revenue FROM sales WHERE ' +
      todayCond + ' GROUP BY payment_method'
    );
  } catch (e) {}

  // TOP-5 mahsulotlar
  let topProducts = { rows: [] };
  try {
    const joinCond = db.isSqlite ? "DATE(s.created_at) = DATE('now')" : 'DATE(s.created_at) = CURRENT_DATE';
    topProducts = await db.query(
      'SELECT p.name, SUM(si.quantity) as qty, SUM(si.quantity * si.price) as sum FROM sale_items si ' +
      'JOIN products p ON si.product_id = p.id JOIN sales s ON s.id = si.sale_id ' +
      'WHERE ' + joinCond + ' GROUP BY p.id, p.name ORDER BY sum DESC LIMIT 5'
    );
  } catch (e) {}

  // Xodimlar samaradorligi
  let staffPerformance = { rows: [] };
  try {
    staffPerformance = await db.query(
      'SELECT u.name, COUNT(s.id) as orders, SUM(s.total_amount) as sales FROM sales s ' +
      'JOIN users u ON s.user_id = u.id WHERE ' + todayCond + ' GROUP BY u.id, u.name ORDER BY sales DESC LIMIT 5'
    );
  } catch (e) {}

  // Kam qolgan mahsulotlar
  let lowStock = { rows: [] };
  try {
    lowStock = await db.query(
      "SELECT name, stock_quantity as left, 'dona' as unit FROM products " +
      "WHERE status = 'active' AND stock_quantity <= minimum_stock AND stock_quantity > 0 " +
      "ORDER BY stock_quantity ASC LIMIT 5"
    );
  } catch (e) {}

  // Tugagan mahsulotlar
  let outOfStock = { rows: [] };
  try {
    outOfStock = await db.query(
      "SELECT name FROM products WHERE status = 'active' AND stock_quantity <= 0 LIMIT 5"
    );
  } catch (e) {}

  const d = day.rows[0] || {};
  const h = hour.rows[0] || {};
  const ph = prevHour.rows[0] || {};
  const avg = avgCheck.rows[0] || {};

  // To'lov usullarini formatlash
  const payMethods = {};
  (paymentMethods.rows || []).forEach(p => {
    payMethods[p.payment_method || 'other'] = Number(p.revenue || 0);
  });

  // Kunlik maqsad (taxminiy — backend dan olish yoki default)
  let dailyTarget = 0;
  let dailyTotalSoFar = Number(d.revenue || 0);
  try {
    const settings = await db.query("SELECT value FROM settings WHERE key = 'daily_target'");
    if (settings.rows[0]) dailyTarget = Number(settings.rows[0].value) || 0;
  } catch (e) {}

  const now = new Date();
  const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const startStr = hourAgo.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const stats = {
    periodStart: startStr,
    periodEnd: timeStr,
    date: dateStr,
    revenue: Number(h.revenue || 0),
    revenuePrevHour: Number(ph.revenue || 0),
    orderCount: Number(h.cnt || 0),
    orderPrevHour: Number(ph.cnt || 0),
    avgCheck: Number(avg.avg || 0),
    newCustomers: Number((newCustomers.rows[0] || {}).cnt || 0),
    cancelledOrders: Number((cancelled.rows[0] || {}).cnt || 0),
    topProducts: (topProducts.rows || []).map(p => ({
      name: p.name, qty: Number(p.qty || 0), sum: Number(p.sum || 0)
    })),
    paymentMethods: {
      cash: payMethods['cash'] || payMethods['naqd'] || 0,
      card: payMethods['card'] || payMethods['karta'] || 0,
      other: payMethods['other'] || payMethods['boshqa'] || 0,
    },
    staffPerformance: (staffPerformance.rows || []).map(s => ({
      name: s.name, orders: Number(s.orders || 0), sales: Number(s.sales || 0)
    })),
    lowStock: [
      ...(lowStock.rows || []).map(p => ({ name: p.name, left: Number(p.left || 0), unit: p.unit || 'dona' })),
      ...(outOfStock.rows || []).map(p => ({ name: p.name, left: 0, unit: 'TUGADI' })),
    ],
    dailyTotalSoFar,
    dailyTarget,
  };

  return generateHourlyReport(stats);
}

let timer = null;

async function tick() {
  try {
    const text = await buildReport();
    const ok = await sendTelegram(text);
    if (ok) console.log('📊 Soatlik hisobot Telegramga yuborildi');
  } catch (e) {
    console.log('⚠️ Soatlik hisobot xatosi:', e.message);
  }
}

function startHourlyReports() {
  if (!ENABLED) {
    console.log('⏸ Soatlik hisobot o\'chiq (HOURLY_REPORT_ENABLED=false)');
    return;
  }
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log('⚠️ Soatlik hisobot: Telegram token/chat topilmadi.');
    console.log('   backend/.env ga TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID yozing');
    console.log('   (yoki POS agent/.env dagi BOT_TOKEN + OWNER_CHAT_ID avtomatik olinadi).');
    return;
  }
  if (timer) return;
  console.log('📊 Soatlik hisobot yoqildi (har ' + Math.round(INTERVAL_MS / 60000) + ' daq, chat ' + CHAT_ID + ')');
  timer = setInterval(tick, INTERVAL_MS);
  // Birinchi hisobot 10 soniyadan keyin
  setTimeout(tick, 10000);
}

function stopHourlyReports() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { startHourlyReports, stopHourlyReports, buildReport };
