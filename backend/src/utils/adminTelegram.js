require('dotenv').config();
// Node 18+ ichki fetch ishlatiladi — qo'shimcha paket kerak emas

// Admin bot — login hodisalari va yangi do'kon akkauntlari shu botga keladi.
// Asosiy POS-agent botidan alohida (ADMIN_BOT_TOKEN).
const ADMIN_BOT_TOKEN = process.env.ADMIN_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

async function sendAdminBotMessage(text) {
  if (!ADMIN_BOT_TOKEN || !ADMIN_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`;
  const body = JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: 'HTML' });
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    // HTML parse yoki tarmoq xatosi — oddiy matn sifatida yuborish
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: text.replace(/<[^>]*>/g, '') }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (e) {
      console.log('⚠️ Admin bot xabar yuborilmadi:', e.message);
    }
  }
}

module.exports = { sendAdminBotMessage };
