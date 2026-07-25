/**
 * @klentlarchek_bot - Admin notification bot
 *
 * This bot sends order notifications to the admin when customers place orders.
 * Orders are stored in the database so they survive server restarts.
 */

const KLENT_BOT_TOKEN = process.env.KLENT_BOT_TOKEN || '8803269723:AAGrBjoCF8PENRZS5TNsm4iZNbmvx0aEZhI';
const MAIN_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8805705606:AAG5TRIJjU-kMR9F0GkFlh4JcIJK95euYiE';
const API_BASE = `https://api.telegram.org/bot${KLENT_BOT_TOKEN}`;
const ADMIN_USERNAME = process.env.KLENT_ADMIN_USERNAME || 'azizvc_m';
const db = require('./config/db');

// In-memory cache for fast callback handling (also stored in DB)
const pendingOrders = new Map();

// Admin chat ID
let ADMIN_CHAT_ID = process.env.KLENT_ADMIN_CHAT_ID
  ? parseInt(process.env.KLENT_ADMIN_CHAT_ID)
  : null;

// Polling state
let pollingActive = false;
const POLL_TIMEOUT = 30;

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// ========== Database helpers ==========

async function saveOrderToDB(invoiceNumber, orderData) {
  try {
    const saleResult = await db.query('SELECT id, notes FROM sales WHERE invoice_number = $1', [invoiceNumber]);
    if (saleResult.rows.length > 0) {
      const sale = saleResult.rows[0];
      const metaData = {
        customerChatId: orderData.customerChatId,
        customerUsername: orderData.customerUsername,
        customerFirstName: orderData.customerFirstName,
        customerName: orderData.customerName,
        phone: orderData.phone,
        deliveryAddress: orderData.deliveryAddress,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        order_status: 'yangi',
      };
      const notesWithMeta = (sale.notes || '') + '\n__ORDER_META__:' + JSON.stringify(metaData);
      await db.query(`UPDATE sales SET notes = $1 WHERE id = $2`, [notesWithMeta, sale.id]);
      console.log(`✅ Buyurtma #${invoiceNumber} DB ga saqlandi`);
    }
  } catch (err) {
    console.error('⚠️ DB ga buyurtma saqlash xatosi:', err.message);
  }
}

async function getOrderFromDB(invoiceNumber) {
  try {
    const result = await db.query(
      'SELECT id, invoice_number, customer_name, total_amount, notes, delivery_address, created_at FROM sales WHERE invoice_number = $1',
      [invoiceNumber]
    );
    if (result.rows.length === 0) return null;

    const sale = result.rows[0];
    let orderData = null;

    // Try to parse metadata from notes
    if (sale.notes) {
      const metaMatch = sale.notes.match(/__ORDER_META__:(.+)/);
      if (metaMatch) {
        try {
          orderData = JSON.parse(metaMatch[1]);
        } catch (e) {}
      }
    }

    // Fallback: construct from sale data
    if (!orderData) {
      // Try to extract phone and delivery from notes
      const phoneMatch = sale.notes?.match(/📞 Telefon: ([^\n]+)/);
      const deliveryMatch = sale.notes?.match(/🚚 Yetkazib berish: ([^\n]+)/);

      orderData = {
        customerChatId: null,
        customerUsername: '',
        customerFirstName: '',
        customerName: sale.customer_name || "Noma'lum",
        phone: phoneMatch ? phoneMatch[1] : '',
        deliveryAddress: deliveryMatch ? deliveryMatch[1] : sale.delivery_address || '',
        items: [],
        totalAmount: sale.total_amount,
      };
    }

    // Get sale items
    const itemsResult = await db.query(
      `SELECT si.*, p.name as product_name
       FROM sale_items si LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1`,
      [sale.id]
    );

    orderData.items = itemsResult.rows.map(item => ({
      name: item.product_name || 'Mahsulot',
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      product_id: item.product_id,
    }));

    return {
      ...orderData,
      invoiceNumber: sale.invoice_number,
      totalAmount: sale.total_amount,
      createdAt: sale.created_at,
    };
  } catch (err) {
    console.error('⚠️ DB dan buyurtma olish xatosi:', err.message);
    return null;
  }
}

async function updateOrderStatus(invoiceNumber, status) {
  try {
    const saleResult = await db.query('SELECT id, notes FROM sales WHERE invoice_number = $1', [invoiceNumber]);
    if (saleResult.rows.length > 0) {
      const sale = saleResult.rows[0];
      if (sale.notes && sale.notes.includes('__ORDER_META__')) {
        const metaMatch = sale.notes.match(/__ORDER_META__:(.+)/);
        if (metaMatch) {
          const metaData = JSON.parse(metaMatch[1]);
          metaData.order_status = status;
          const updatedNotes = sale.notes.replace(/__ORDER_META__:.+/, '__ORDER_META__:' + JSON.stringify(metaData));
          await db.query('UPDATE sales SET notes = $1 WHERE id = $2', [updatedNotes, sale.id]);
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Buyurtma holatini yangilash xatosi:', err.message);
  }
}

// ========== Telegram API helpers ==========

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
    if (data.description && !data.description.includes('message is not modified') && !data.description.includes('no text in the message to edit') && !data.description.includes('not a text message')) {
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

// ========== Order notification ==========

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
    console.log('⚠️ @klentlarchek_bot: Admin chat ID topilmadi.');
    return null;
  }

  // Store in memory cache
  const orderData = {
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
  };
  pendingOrders.set(invoiceNumber, orderData);

  // Also save to database (survives restart)
  await saveOrderToDB(invoiceNumber, orderData);

  // Build items list
  let itemsText = '';
  items.forEach((item, i) => {
    const qty = item.quantity || item.qty;
    const price = item.price || item.selling_price;
    const subtotal = item.subtotal || (qty * price);
    itemsText += `${i + 1}. *${escMd(item.name)}*\n`;
    itemsText += `   ${qty} x ${formatCurrency(price)} = *${formatCurrency(subtotal)}*\n\n`;
  });

  const customerInfo = `👤 *${escMd(customerName || "Noma'lum")}*`;
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

  let sentMessage = null;
  let retries = 3;
  while (retries > 0 && !sentMessage) {
    sentMessage = await sendMessage(adminChatId, notificationText, { reply_markup: keyboard });
    if (!sentMessage) {
      retries--;
      if (retries > 0) {
        console.log(`⚠️ @klentlarchek_bot: Qayta urinilmoqda (${retries} ta qoldi)...`);
        await sleep(2000);
      }
    }
  }

  if (sentMessage) {
    const order = pendingOrders.get(invoiceNumber);
    if (order) order.adminMessageId = sentMessage.message_id;
    console.log(`✅ @klentlarchek_bot: Buyurtma #${invoiceNumber} admin ga yuborildi`);
  } else {
    console.error(`❌ @klentlarchek_bot: Buyurtma #${invoiceNumber} yuborilmadi!`);
  }

  return sentMessage;
}

// ========== Get order (memory + DB fallback) ==========

async function getOrder(invoiceNumber) {
  // Try memory first (fast)
  let order = pendingOrders.get(invoiceNumber);
  if (order) return order;

  // Try database (survives restart)
  order = await getOrderFromDB(invoiceNumber);
  if (order) {
    // Restore to memory cache
    pendingOrders.set(invoiceNumber, {
      ...order,
      adminMessageId: null,
      status: order.order_status || 'yangi',
      createdAt: Date.now(),
    });
    return pendingOrders.get(invoiceNumber);
  }

  return null;
}

// ========== Handle admin button clicks ==========

async function handleCallback(callbackQuery) {
  try {
    const data = callbackQuery.data || '';
    const chatId = callbackQuery.message?.chat?.id;
    const messageId = callbackQuery.message?.message_id;
    const from = callbackQuery.from;

    if (!data.startsWith('klent_')) return;

    // Capture admin chat ID
    ADMIN_CHAT_ID = chatId;
    const adminName = from?.username ? `@${from.username}` : from?.first_name || 'Admin';

    // Persist admin chat ID
    try {
      const existing = await db.query('SELECT id FROM settings LIMIT 1');
      if (existing.rows.length > 0) {
        await db.query(`UPDATE settings SET admin_telegram = $1, updated_at = ${db.isSqlite ? "datetime('now')" : 'NOW()'} WHERE id = $2`, [String(chatId), existing.rows[0].id]);
      } else {
        await db.query(`INSERT INTO settings (store_name, admin_telegram) VALUES ('My Store', $1)`, [String(chatId)]);
      }
    } catch (dbErr) {}

    await answerCallbackQuery(callbackQuery.id);

    const parts = data.split('_');
    const action = parts[1];
    const invoiceNumber = parts.slice(2).join('_');

    // Get order from memory or database
    const order = await getOrder(invoiceNumber);

    if (!order) {
      console.log(`⚠️ @klentlarchek_bot: Buyurtma topilmadi - #${invoiceNumber}`);
      await editMessageText(chatId, messageId,
        `❌ *Buyurtma topilmadi!*\n\n#${invoiceNumber} raqamli buyurtma topilmadi.\n\nEhtimol, server qayta ishga tushgan bo'lishi mumkin.\n\nAdmin: @${ADMIN_USERNAME}`,
        { reply_markup: { inline_keyboard: [[{ text: '⬅️ Bosh sahifa', callback_data: 'klent_home' }]] } }
      );
      return;
    }

    console.log(`✅ @klentlarchek_bot: ${action} #${invoiceNumber} - ${adminName}`);

    const customerChatLink = order.customerChatId ? `tg://user?id=${order.customerChatId}` : null;

    switch (action) {
      case 'accept': {
        order.status = 'qabul_qilindi';
        await updateOrderStatus(invoiceNumber, 'qabul_qilindi');
        await editMessageText(chatId, messageId,
          `✅ *BUYURTMA QABUL QILINDI!*  #${invoiceNumber}\n\n` +
          `${adminName} buyurtmani qabul qildi ✅\n\n` +
          `📦 *Mahsulotlar:*\n${buildItemsText(order.items)}\n` +
          `💰 *Jami:* ${formatCurrency(order.totalAmount)}\n` +
          `👤 *Mijoz:* ${escMd(order.customerName)}\n` +
          `${order.phone ? `📞 ${escMd(order.phone)}\n` : ''}` +
          `${order.deliveryAddress ? `🚚 ${escMd(order.deliveryAddress)}` : '🏪 Olib ketish'}\n\n` +
          `⏰ ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`,
          { reply_markup: { inline_keyboard: customerChatLink ? [[{ text: '📞 Mijozga yozish', url: customerChatLink }]] : [] } }
        );
        // Notify customer
        if (order.customerChatId) {
          await notifyCustomerViaMainBot(order.customerChatId,
            `✅ *Buyurtmangiz qabul qilindi!* 🎉\n\n` +
            `📋 Chek: \`${invoiceNumber}\`\n` +
            `💰 Jami: *${formatCurrency(order.totalAmount)}*\n\n` +
            `Tez orada siz bilan bog'lanamiz. Rahmat! 🙏`
          );
        }
        break;
      }

      case 'reject': {
        order.status = 'rad_etildi';
        await updateOrderStatus(invoiceNumber, 'rad_etildi');
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
        if (order.customerChatId) {
          await notifyCustomerViaMainBot(order.customerChatId,
            `❌ *Buyurtmangiz admin tomonidan rad etildi!*\n\n` +
            `📋 Chek: \`${invoiceNumber}\`\n` +
            `💰 Jami: *${formatCurrency(order.totalAmount)}*\n\n` +
            `Agar boshqa savolingiz bo'lsa, admin bilan bog'lanishingiz mumkin.\n` +
            `📞 Admin: @${escMd(ADMIN_USERNAME)}`
          );
        }
        break;
      }

      case 'contact': {
        if (!customerChatLink) {
          await editMessageText(chatId, messageId,
            `📞 *MIJOZ BILAN BOG'LANISH*  #${invoiceNumber}\n\n` +
            `❌ Mijoz chat ID topilmadi.\n\n` +
            `👤 *Mijoz:* ${escMd(order.customerName)}\n` +
            `${order.phone ? `📞 *Telefon:* ${escMd(order.phone)}\n` : ''}`,
            { reply_markup: { inline_keyboard: [[{ text: '⬅️ Orqaga', callback_data: `klent_back_${invoiceNumber}` }]] } }
          );
          return;
        }
        await editMessageText(chatId, messageId,
          `📞 *MIJOZ BILAN BOG'LANISH*  #${invoiceNumber}\n\n` +
          `👤 *Mijoz:* ${escMd(order.customerName)}\n` +
          `${order.phone ? `📞 *Telefon:* ${escMd(order.phone)}\n` : '📞 *Telefon:* —\n'}` +
          `🆔 *Chat ID:* \`${order.customerChatId}\`\n` +
          `${order.deliveryAddress ? `📍 *Manzil:* ${escMd(order.deliveryAddress)}\n` : '🏪 *Olib ketish*\n'}` +
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
          `${order.customerChatId ? `🆔 *Chat ID:* \`${order.customerChatId}\`\n` : ''}` +
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
          `${order.customerChatId ? `🆔 Chat ID: \`${order.customerChatId}\`\n\n` : '\n'}` +
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

// ========== Handle messages ==========

async function handleMessage(msg) {
  const chatId = msg.chat?.id;
  const username = msg.from?.username;
  const text = msg.text || '';

  if (!chatId) return;

  // Capture admin chat ID
  if (username === ADMIN_USERNAME) {
    ADMIN_CHAT_ID = chatId;
    console.log(`✅ @klentlarchek_bot: Admin aniqlandi: @${username}, Chat ID: ${chatId}`);

    try {
      const existing = await db.query('SELECT id FROM settings LIMIT 1');
      if (existing.rows.length > 0) {
        await db.query(`UPDATE settings SET admin_telegram = $1, updated_at = ${db.isSqlite ? "datetime('now')" : 'NOW()'} WHERE id = $2`, [String(chatId), existing.rows[0].id]);
      } else {
        await db.query(`INSERT INTO settings (store_name, admin_telegram) VALUES ('My Store', $1)`, [String(chatId)]);
      }
    } catch (dbErr) {}

    if (text.startsWith('/start')) {
      await sendMessage(chatId,
        `✅ *Xush kelibsiz, Admin!* 👋\n\n` +
        `🔔 @klentlarchek_bot orqali buyurtma xabarnomalarini olasiz.\n\n` +
        `Buyurtma kelganda sizga:\n` +
        `• 👤 Mijoz ismi\n` +
        `• 📞 Telefon raqami\n` +
        `• 📍 Manzil\n` +
        `• 🛍️ Mahsulotlar\n` +
        `• 💰 Summa\n\n` +
        `Siz buyurtmani ✅ qabul qilishingiz yoki ❌ rad etishingiz mumkin.`
      );
    }
  }
}

// ========== Notify customer via main bot ==========

async function notifyCustomerViaMainBot(chatId, text) {
  if (!chatId) {
    console.log('⚠️ notifyCustomer: chat ID yo\'q');
    return;
  }
  try {
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

// ========== Polling ==========

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
    console.error('⚠️ @klentlarchek_bot webhook error:', err.message);
    return false;
  }
}

async function startPolling() {
  if (pollingActive) return;
  pollingActive = true;

  await deleteWebhook();
  console.log('🤖 @klentlarchek_bot long polling started');

  let offset = 0;
  let consecutiveErrors = 0;

  // Load admin chat ID from DB
  if (!ADMIN_CHAT_ID) {
    try {
      const settingsResult = await db.query(`SELECT admin_telegram FROM settings LIMIT 1`);
      if (settingsResult.rows.length > 0 && settingsResult.rows[0].admin_telegram) {
        const savedId = settingsResult.rows[0].admin_telegram;
        if (savedId && !isNaN(Number(savedId))) {
          ADMIN_CHAT_ID = Number(savedId);
          console.log(`✅ @klentlarchek_bot: Admin chat ID DB dan yuklandi: ${ADMIN_CHAT_ID}`);
        }
      }
    } catch (dbErr) {}
  }

  // Try to find admin from existing updates
  if (!ADMIN_CHAT_ID) {
    try {
      const findRes = await fetch(`${API_BASE}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: 0, timeout: 2, allowed_updates: ['message'], limit: 200 }),
      });
      const findData = await findRes.json();
      if (findData.ok && findData.result) {
        for (const update of findData.result) {
          const msg = update.message;
          if (msg && msg.from?.username === ADMIN_USERNAME) {
            ADMIN_CHAT_ID = msg.chat.id;
            offset = Math.max(offset, update.update_id + 1);
            console.log(`✅ @klentlarchek_bot: Admin topildi: ${ADMIN_CHAT_ID}`);
            break;
          }
          offset = Math.max(offset, update.update_id + 1);
        }
      }
    } catch (findErr) {}
  }

  while (pollingActive) {
    try {
      const res = await fetch(`${API_BASE}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset, timeout: POLL_TIMEOUT, allowed_updates: ['message', 'callback_query'] }),
      });
      const data = await res.json();

      if (!data.ok) {
        console.error('🤖 @klentlarchek_bot getUpdates xatosi:', data.description);
        consecutiveErrors++;
        if (consecutiveErrors > 5) {
          console.error('🤖 @klentlarchek_bot: 5 ta ketma-ket xatolik. To\'xtatilmoqda...');
          pollingActive = false;
          return;
        }
        await sleep(5000);
        continue;
      }

      consecutiveErrors = 0;

      if (data.result && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          try {
            if (update.message) await handleMessage(update.message);
            if (update.callback_query) await handleCallback(update.callback_query);
          } catch (handlerErr) {
            console.error('🤖 @klentlarchek_bot handler xatosi:', handlerErr.message);
          }
        }
      }
    } catch (err) {
      if (pollingActive) {
        console.error('🤖 @klentlarchek_bot polling error:', err.message);
        consecutiveErrors++;
        const delay = Math.min(consecutiveErrors * 2000, 30000);
        await sleep(delay);
      }
    }
  }
}

function stopPolling() { pollingActive = false; }
function getAdminChatId() { return ADMIN_CHAT_ID; }

// ========== Helpers ==========

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
