// Soatlik hisobot — BACKEND ichida ishlaydi, shuning uchun POS-agent
// alohida ishga tushirilmagan bo'lsa ham har soatda Telegramga hisobot keladi.
// Backend PM2/Task Scheduler orqali doimiy ishlasa, hisobot ham doimiy keladi.
//
// Token qayerdan olinadi (birinchi topilgani):
//   1. backend .env → TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
//   2. backend .env → ADMIN_BOT_TOKEN + ADMIN_CHAT_ID
//   3. "POS agent"/.env → BOT_TOKEN + OWNER_CHAT_ID (avtomatik fallback)
const fs = require('fs');
const path = require('path');

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

  const day = await db.query(
    'SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE ' + todayCond
  );
  const hour = await db.query(
    'SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE ' + hourCond
  );
  let low = { rows: [] };
  let top = { rows: [] };
  try {
    low = await db.query(
      "SELECT name, stock_quantity FROM products WHERE status = 'active' ORDER BY stock_quantity ASC LIMIT 5"
    );
  } catch (e) { /* jadval bo'lmasa bo'sh */ }
  try {
    const joinCond = db.isSqlite ? "DATE(s.created_at) = DATE('now')" : 'DATE(s.created_at) = CURRENT_DATE';
    top = await db.query(
      'SELECT p.name, SUM(si.quantity) as sold FROM sale_items si ' +
      'JOIN products p ON si.product_id = p.id ' +
      'JOIN sales s ON s.id = si.sale_id ' +
      'WHERE ' + joinCond + ' ' +
      'GROUP BY p.id, p.name ORDER BY sold DESC LIMIT 5'
    );
  } catch (e) { /* sale_items bo'lmasa bo'sh */ }

  const d = day.rows[0] || {};
  const h = hour.rows[0] || {};
  const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');
  const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
  const lowTxt = (low.rows || []).map((p) => '  • ' + p.name + ' — ' + p.stock_quantity + ' ta').join('\n') || '  Hammasi yetarli ✅';
  const topTxt = (top.rows || []).map((p) => '  • ' + p.name + ' — ' + p.sold + ' ta').join('\n') || "  Hozircha savdo yo'q";

  return '📊 <b>Soatlik hisobot — ' + time + '</b>\n━━━━━━━━━━━━━━━\n' +
    '💰 Bugungi tushum: <b>' + fmt(d.revenue) + " so'm</b>\n" +
    '🧾 Bugungi savdolar: <b>' + (d.cnt || 0) + ' ta</b>\n' +
    '⏱ Oxirgi 1 soat: <b>' + fmt(h.revenue) + " so'm</b> (" + (h.cnt || 0) + ' ta)\n\n' +
    '🔥 <b>TOP-5 bugun:</b>\n' + topTxt + '\n\n' +
    '⚠️ <b>Kam qolganlar:</b>\n' + lowTxt;
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
    console.log('⏸ Soatlik hisobot o‘chiq (HOURLY_REPORT_ENABLED=false)');
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
  setTimeout(tick, 10000);
}

function stopHourlyReports() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { startHourlyReports, stopHourlyReports, buildReport };
