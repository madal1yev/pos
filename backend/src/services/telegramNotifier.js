const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8805705606:AAG5TRIJjU-kMR9F0GkFlh4JcIJK95euYiE';
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_ID ? Number(process.env.ADMIN_TELEGRAM_ID) : null;

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

function httpPost(method, params = {}) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/${method}`;
    const postData = new URLSearchParams(params).toString();
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.ok) {
            reject(new Error(`Telegram ${method} xatosi: ${json.description}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error('Telegram javobni tahlil qishda xato'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function sendNotification(message) {
  if (!ADMIN_CHAT_ID) return;
  try {
    await httpPost('sendMessage', {
      chat_id: String(ADMIN_CHAT_ID),
      text: message,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('⚠️ Telegram notification xatosi:', err.message);
  }
}

function formatNotification(type, product) {
  const emoji = type === 'create' ? '✅' : type === 'update' ? '🔄' : '🗑️';
  const action = type === 'create' ? 'qo\'shildi' : type === 'update' ? 'yangilandi' : 'o\'chirildi';
  const stock = product.stock_quantity != null ? `${product.stock_quantity} ${product.unit || 'pcs'}` : 'n/a';
  const categoryId = product.category_id || '-';
  return `${emoji} <b>Mahsulot ${action}</b>\n\n<b>${(product.name || '-').replace(/</g, '&lt;')}</b>\nKod: <code>${product.product_code || '-'}</code>\nNarxi: ${product.selling_price || 0} so\'m\nZaxira: ${stock}\nKategoriya ID: ${categoryId}`;
}

module.exports = { sendNotification, formatNotification };
