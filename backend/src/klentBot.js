/**
 * @klentlarchek_bot - Admin notification bot
 *
 * This bot sends order notifications to the admin when customers place orders.
 * It uses long polling (fetch-based) so it works without needing a webhook URL.
 */

const KLENT_BOT_TOKEN = process.env.KLENT_BOT_TOKEN || '8803269723:AAGrBjoCF8PENRZS5TNsm4iZNbmvx0aEZhI';
const MAIN_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8805705606:AAG5TRIJjU-kMR9F0GkFlh4JcIJK95euYiE';
const API_BASE = `https://api.telegram.org/bot${KLENT_BOT_TOKEN}`;
const ADMIN_USERNAME = process.env.KLENT_ADMIN_USERNAME || 'azizvc_m';

// Store order data keyed by invoice number for callback handling
const pendingOrders = new Map();

// Admin chat ID - first from .env, then captured via polling
let ADMIN_CHAT_ID = process.env.KLENT_ADMIN_CHAT_ID 
  ? parseInt(process.env.KLENT_ADMIN_CHAT_ID) 
  : null;

if (ADMIN_CHAT_ID) {
  console.log(`✅ @klentlarchek_bot: Admin chat ID .env dan yuklandi: ${ADMIN_CHAT_ID}`);
}

// Polling state
let pollingActive = false;
const POLL_TIMEOUT = 30; // long poll timeout in seconds

// Helper sleep
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

/**
 * Send a message via @klentlarchek_bot (fetch-based Telegram API)
 */
async function sendMessage(chatId, text, extra = {}) {
  try {
    const body = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...extra,
    };
    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('🤖 klentBot sendMessage error:', data.description);
      return null;
    }
    return data.result;
  } catch (err) {
    console.error('🤖 klentBot sendMessage error:', err.message);
    return null;
  }
}

/**
 * Edit a message sent by @klentlarchek_bot
 */
async function editMessageText(chatId, messageId, text, extra = {}) {
  try {
    const body = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...extra,
    };
    const res = await fetch(`${API_BASE}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      if (data.description && !data.description.includes('message is not modified')) {
        console.error('🤖 klentBot editMessageText error:', data.description.slice(0, 200));
      }
      return null;
    }
    return data.result;
  } catch (err) {
    console.error('🤖 klentBot editMessageText error:', err.message);
    return null;
  }
}

/**
 * Answer a callback query
 */
async function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
  try {
    const res = await fetch(`${API_BASE}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert }),
    });
    const data = await res.json();
    if (!data.ok) console.error('🤖 klentBot answerCallbackQuery error:', data.description);
  } catch (err) {
    console.error('🤖 klentBot answerCallbackQuery error:', err.message);
  }
}

/**
 * Handle a regular message sent to @klentlarchek_bot
 * Captures admin chat ID so notifications can be sent
 */
async function handleMessage(msg) {
  const chatId = msg.chat?.id;
  const username = msg.from?.username;
  const text = msg.text || '';

  if (!chatId) return;

  // Capture admin chat ID
  if (username === ADMIN_USERNAME) {
    ADMIN_CHAT_ID = chatId;
    console.log(`✅ @klentlarchek_bot: Admin aniqlandi: @${username}, Chat ID: ${chatId}`);

    if (text.startsWith('/start')) {
      await sendMessage(chatId,
        `✅ *Xush kelibsiz, Admin!* 👋\n\n` +
        `🔔 @klentlarchek_bot orqali buyurtma xabarnomalarini olasiz.\n\n` +
        `Buyurtma kelganda sizga quyidagi ma'lumotlar bilan xabar keladi:\n` +
        `• 👤 Mijoz ismi / Username\n` +
        `• 📞 Telefon raqami\n` +
        `• 📍 Yetkazib berish manzili\n` +
        `• 🛍️ Buyurtma qilingan mahsulotlar\n` +
        `• 💰 Umumiy summa\n\n` +
        `Siz buyurtmani ✅ qabul qilishingiz yoki ❌ rad etishingiz mumkin.`
      );
    }
  }
}

/**
 * Send admin notification about a new order via @klentlarchek_bot
 */
async function sendOrderNotification({
  adminChatId,
  invoiceNumber,
  customerName,
  customerUsername,
  customerFirstName,
  customerChatId,
  phone,
  deliveryAddress,
  items,
  totalAmount,
}) {
  if (!adminChatId) {
    console.log('⚠️ @klentlarchek_bot: Admin chat ID topilmadi. Admin @klentlarchek_bot ga /start yozishi kerak.');
    return null;
  }

  // Store order data for callback handling
  pendingOrders.set(invoiceNumber, {
    customerChatId,
    customerUsername,
    customerFirstName,
    customerName,
    items,
    totalAmount,
    deliveryAddress,
    phone,
    adminMessageId: null,
    status: 'yangi',
    createdAt: Date.now(),
  });

  // Auto-cleanup after 24h (prevents memory leak)
  cleanupOrder(invoiceNumber, 24 * 60 * 60 * 1000);

  // Build items list
  let itemsText = '';
  items.forEach((item, i) => {
    const qty = item.quantity || item.qty;
    const price = item.price || item.selling_price;
    const subtotal = item.subtotal || (qty * price);
    itemsText += `${i + 1}. *${escMd(item.name)}*\n`;
    itemsText += `   ${qty} x ${formatCurrency(price)} = *${formatCurrency(subtotal)}*\n\n`;
  });

  const customerInfo = `👤 *${escMd(customerName)}*`;
  const phoneLine = phone ? `📞 *${escMd(phone)}*` : '📞 *—*';
  const deliveryLine = deliveryAddress
    ? `🚚 *Yetkazib berish:* ${escMd(deliveryAddress)}`
    : '🏪 *Olib ketish*';
  const timeStr = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

  const notificationText =
    `🔔 *YANGI BUYURTMA!*  #${invoiceNumber}\n\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `🧾 *MAHSULOTLAR:*\n\n${itemsText}` +
    `💰 *Jami: ${formatCurrency(totalAmount)}*\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `👤 *MIJOZ:*\n${customerInfo}\n${phoneLine}\n` +
    `🆔 Chat ID: \`${customerChatId}\`\n\n` +
    `📍 *YETKAZIB BERISH:*\n${deliveryLine}\n\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `📅 *Vaqt:* ${timeStr}\n` +
    `📋 *Chek:* \`${invoiceNumber}\`\n` +
    `━━━━━━━━━━━━━━━━\n\n` +
    `👇 *Buyurtma holatini tanlang:*`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Qabul qilish', callback_data: `klent_accept_${invoiceNumber}` },
        { text: '❌ Rad etish', callback_data: `klent_reject_${invoiceNumber}` },
      ],
      [{ text: '📞 Mijozga yozish', callback_data: `klent_contact_${invoiceNumber}` }],
      [{ text: 'ℹ️ Batafsil', callback_data: `klent_detail_${invoiceNumber}` }],
    ],
  };

  const sentMessage = await sendMessage(adminChatId, notificationText, { reply_markup: keyboard });

  if (sentMessage) {
    const order = pendingOrders.get(invoiceNumber);
    if (order) order.adminMessageId = sentMessage.message_id;
  }

  return sentMessage;
}

/**
 * Clean up a pending order after a delay
 */
function cleanupOrder(invoiceNumber, delayMs = 60000) {
  setTimeout(() => { pendingOrders.delete(invoiceNumber); }, delayMs);
}

/**
 * Handle callback query from @klentlarchek_bot (admin button clicks)
 */
async function handleCallback(callbackQuery) {
  try {
    const data = callbackQuery.data || '';
    const chatId = callbackQuery.message?.chat?.id;
    const messageId = callbackQuery.message?.message_id;
    const from = callbackQuery.from;

    if (!data.startsWith('klent_')) return;

    // Capture admin chat ID on any interaction
    ADMIN_CHAT_ID = chatId;
    const adminName = from?.username ? `@${from.username}` : from?.first_name || 'Admin';

    await answerCallbackQuery(callbackQuery.id);

    const parts = data.split('_');
    const action = parts[1];
    const invoiceNumber = parts.slice(2).join('_');

    const order = pendingOrders.get(invoiceNumber);

    if (!order) {
      console.log(`⚠️ @klentlarchek_bot: Buyurtma topilmadi - #${invoiceNumber} (muddati o'tgan yoki server qayta ishga tushgan)`);
      await editMessageText(chatId, messageId,
        `❌ *Buyurtma topilmadi!*\n\n#${invoiceNumber} raqamli buyurtma topilmadi.\n\nEhtimol, server qayta ishga tushgan bo'lishi mumkin.`,
        { reply_markup: { inline_keyboard: [] } }
      );
      return;
    }

  console.log(`✅ @klentlarchek_bot: ${action} #${invoiceNumber} - ${adminName}`);

  switch (action) {
    case 'accept': {
      order.status = 'qabul_qilindi';
      await editMessageText(chatId, messageId,
        `✅ *BUYURTMA QABUL QILINDI!*  #${invoiceNumber}\n\n` +
        `${adminName} buyurtmani qabul qildi ✅\n\n` +
        `📦 *Mahsulotlar:*\n${buildItemsText(order.items)}\n` +
        `💰 *Jami:* ${formatCurrency(order.totalAmount)}\n` +
        `👤 *Mijoz:* ${escMd(order.customerName)}\n` +
        `${order.phone ? `📞 ${escMd(order.phone)}\n` : ''}` +
        `${order.deliveryAddress ? `🚚 ${escMd(order.deliveryAddress)}` : '🏪 Olib ketish'}\n\n` +
        `⏰ ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`,
        { reply_markup: { inline_keyboard: [[{ text: '📞 Mijozga yozish', callback_data: `klent_contact_${invoiceNumber}` }]] } }
      );
      // Notify customer
      await notifyCustomerViaMainBot(order.customerChatId,
        `✅ *Buyurtmangiz qabul qilindi!* 🎉\n\n` +
        `📋 Chek: \`${invoiceNumber}\`\n` +
        `💰 Jami: *${formatCurrency(order.totalAmount)}*\n\n` +
        `Tez orada siz bilan bog'lanamiz. Rahmat! 🙏`
      );
      cleanupOrder(invoiceNumber, 3600000);
      break;
    }

    case 'reject': {
      order.status = 'rad_etildi';
      await editMessageText(chatId, messageId,
        `❌ *BUYURTMA RAD ETILDI*  #${invoiceNumber}\n\n` +
        `${adminName} buyurtmani rad etdi ❌\n\n` +
        `📦 *Mahsulotlar:*\n${buildItemsText(order.items)}\n` +
        `💰 *Jami:* ${formatCurrency(order.totalAmount)}\n` +
        `👤 *Mijoz:* ${escMd(order.customerName)}\n` +
        `${order.phone ? `📞 ${escMd(order.phone)}\n` : ''}\n` +
        `⏰ ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`,
        { reply_markup: { inline_keyboard: [] } }
      );
      // Notify customer about rejection
      await notifyCustomerViaMainBot(order.customerChatId,
        `❌ *Buyurtmangiz admin tomonidan rad etildi!*\n\n` +
        `📋 Chek: \`${invoiceNumber}\`\n` +
        `💰 Jami: *${formatCurrency(order.totalAmount)}*\n\n` +
        `Agar boshqa savolingiz bo'lsa, admin bilan bog'lanishingiz mumkin.\n` +
        `📞 Admin: @${escMd(ADMIN_USERNAME)}`
      );
      cleanupOrder(invoiceNumber, 3600000);
      break;
    }

    case 'contact': {
      const customerChatLink = `tg://user?id=${order.customerChatId}`;
      await editMessageText(chatId, messageId,
        `📞 *MIJOZ BILAN BOG'LANISH*  #${invoiceNumber}\n\n` +
        `👤 *Mijoz:* ${escMd(order.customerName)}\n` +
        `${order.phone ? `📞 *Telefon:* ${escMd(order.phone)}\n` : '📞 *Telefon:* —\n'}` +
        `🆔 *Chat ID:* \`${order.customerChatId}\`\n` +
        `${order.deliveryAddress ? `📍 *Manzil:* ${escMd(order.deliveryAddress)}\n` : '🏪 *Olib ketish*\n'}` +
        `📝 Mijoz bilan bog'lanib, buyurtma tafsilotlarini aniqlashtiring.\n\n` +
        `👇 Quyidagi tugma orqali mijoz bilan suhbatni oching:`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✉️ Mijozga xabar yozish', url: customerChatLink }],
              [{ text: '⬅️ Orqaga', callback_data: `klent_back_${invoiceNumber}` }],
            ],
          },
        }
      );
      break;
    }

    case 'detail': {
      const itemsDetail = order.items.map((item, i) => {
        const qty = item.quantity || item.qty;
        const price = item.price || item.selling_price;
        const subtotal = item.subtotal || (qty * price);
        return `${i + 1}. *${escMd(item.name)}* — ${qty} x ${formatCurrency(price)} = *${formatCurrency(subtotal)}*`;
      }).join('\n');
      const detailText =
        `ℹ️ *BUYURTMA TAFSILOTLARI*  #${invoiceNumber}\n\n` +
        `📦 *Mahsulotlar:*\n${itemsDetail}\n\n` +
        `💰 *Jami:* ${formatCurrency(order.totalAmount)}\n` +
        `👤 *Mijoz:* ${escMd(order.customerName)}\n` +
        `${order.phone ? `📞 *Telefon:* ${escMd(order.phone)}\n` : ''}` +
        `🆔 *Chat ID:* \`${order.customerChatId}\`\n` +
        `${order.deliveryAddress ? `📍 *Manzil:* ${escMd(order.deliveryAddress)}\n` : '🏪 *Olib ketish*\n'}` +
        `📋 *Chek:* \`${invoiceNumber}\`\n` +
        `📅 *Vaqt:* ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}\n` +
        `📊 *Holat:* ${order.status === 'qabul_qilindi' ? '✅ Qabul qilingan' : order.status === 'rad_etildi' ? '❌ Rad etilgan' : '⏳ Yangi'}`;
      await editMessageText(chatId, messageId, detailText, {
        reply_markup: { inline_keyboard: [[{ text: '⬅️ Orqaga', callback_data: `klent_back_${invoiceNumber}` }]] }
      });
      break;
    }

    case 'back': {
      const itemsText = buildItemsText(order.items);
      const deliveryLine = order.deliveryAddress
        ? `🚚 *Yetkazib berish:* ${escMd(order.deliveryAddress)}`
        : '🏪 *Olib ketish*';
      const timeStr = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });
      const text =
        `🔔 *BUYURTMA*  #${invoiceNumber}\n\n` +
        `━━━━━━━━━━━━━━━━\n🧾 *MAHSULOTLAR:*\n\n${itemsText}` +
        `💰 *Jami: ${formatCurrency(order.totalAmount)}*\n` +
        `━━━━━━━━━━━━━━━━\n👤 *MIJOZ:*\n` +
        `👤 ${escMd(order.customerName)}\n` +
        `${order.phone ? `📞 ${escMd(order.phone)}\n` : ''}` +
        `🆔 Chat ID: \`${order.customerChatId}\`\n\n` +
        `📍 *YETKAZIB BERISH:*\n${deliveryLine}\n\n` +
        `📅 *Vaqt:* ${timeStr}\n📋 *Chek:* \`${invoiceNumber}\`\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `📊 *Holat:* ${order.status === 'qabul_qilindi' ? '✅ Qabul qilingan' : order.status === 'rad_etildi' ? '❌ Rad etilgan' : '⏳ Yangi'}\n\n` +
        `👇 *Buyurtma holatini tanlang:*`;
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Qabul qilish', callback_data: `klent_accept_${invoiceNumber}` },
            { text: '❌ Rad etish', callback_data: `klent_reject_${invoiceNumber}` },
          ],
          [{ text: '📞 Mijozga yozish', callback_data: `klent_contact_${invoiceNumber}` }],
          [{ text: 'ℹ️ Batafsil', callback_data: `klent_detail_${invoiceNumber}` }],
        ],
      };
      await editMessageText(chatId, messageId, text, { reply_markup: keyboard });
      break;
    }
  }
  } catch (err) {
    console.error('❌ @klentlarchek_bot handleCallback xatosi:', err.message);
  }
}

/**
 * Notify customer via the MAIN bot (foodsPOS_bot)
 */
async function notifyCustomerViaMainBot(chatId, text) {
  if (!chatId) {
    console.log('⚠️ notifyCustomer: chat ID yo\'q');
    return;
  }
  try {
    console.log(`📤 notifyCustomer: mijozga xabar yuborilmoqda (chatId: ${chatId})`);
    const res = await fetch(`https://api.telegram.org/bot${MAIN_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('📤 notifyCustomer error:', data.description);
    } else {
      console.log('✅ notifyCustomer: xabar yuborildi');
    }
  } catch (err) {
    console.error('📤 notifyCustomer error:', err.message);
  }
}

/**
 * Delete the webhook (so we can use long polling instead)
 * Returns true if successful
 */
async function deleteWebhook() {
  try {
    const res = await fetch(`${API_BASE}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('⚠️ @klentlarchek_bot webhook deletion failed:', data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error('⚠️ @klentlarchek_bot webhook deletion error:', err.message);
    return false;
  }
}

/**
 * Start long polling for @klentlarchek_bot
 * This replaces webhook mode so it works without WEBHOOK_URL env var
 */
async function startPolling() {
  if (pollingActive) return;
  pollingActive = true;

  // Delete any existing webhook first (webhook and polling can't coexist)
  await deleteWebhook();
  console.log('🤖 @klentlarchek_bot long polling started');

  let offset = 0;

  // If admin chat ID not set from .env, try to find it from existing updates
  if (!ADMIN_CHAT_ID) {
    try {
      const findRes = await fetch(`${API_BASE}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset: 0,
          timeout: 2,
          allowed_updates: ['message'],
          limit: 200,
        }),
      });
      const findData = await findRes.json();
      if (findData.ok && findData.result) {
        for (const update of findData.result) {
          const msg = update.message;
          if (msg && msg.from?.username === ADMIN_USERNAME) {
            ADMIN_CHAT_ID = msg.chat.id;
            offset = Math.max(offset, update.update_id + 1);
            console.log(`✅ @klentlarchek_bot: Admin chat ID avtomatik topildi: ${ADMIN_CHAT_ID} (eski xabarlardan)`);
            break;
          }
          offset = Math.max(offset, update.update_id + 1);
        }
      }
    } catch (findErr) {
      console.error('⚠️ @klentlarchek_bot admin chat ID qidirish xatosi:', findErr.message);
    }
  }

  while (pollingActive) {
    try {
      const res = await fetch(`${API_BASE}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset,
          timeout: POLL_TIMEOUT,
          allowed_updates: ['message', 'callback_query'],
        }),
      });
      const data = await res.json();

      if (data.ok && data.result && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          if (update.message) {
            await handleMessage(update.message);
          }
          if (update.callback_query) {
            await handleCallback(update.callback_query);
          }
        }
      }
    } catch (err) {
      if (pollingActive) {
        console.error('🤖 @klentlarchek_bot polling error:', err.message);
        await sleep(5000);
      }
    }
  }
}

/**
 * Stop long polling
 */
function stopPolling() {
  pollingActive = false;
}

/**
 * Get admin's chat ID for @klentlarchek_bot
 */
function getAdminChatId() {
  return ADMIN_CHAT_ID;
}

// ---- Helpers ----

function escMd(text) {
  if (!text) return '';
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString('uz-UZ') + " so'm";
}

function buildItemsText(items) {
  let text = '';
  items.forEach((item, i) => {
    const qty = item.quantity || item.qty;
    const price = item.price || item.selling_price;
    const subtotal = item.subtotal || (qty * price);
    text += `${i + 1}. *${escMd(item.name)}*\n`;
    text += `   ${qty} x ${formatCurrency(price)} = *${formatCurrency(subtotal)}*\n\n`;
  });
  return text;
}

module.exports = {
  sendOrderNotification,
  sendMessage,
  editMessageText,
  getAdminChatId,
  handleCallback,
  handleMessage,
  startPolling,
  stopPolling,
  deleteWebhook,
};
