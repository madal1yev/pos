require('dotenv').config();
const { TelegramBot } = require('node-telegram-bot-api');
const db = require('./config/db');
const { t } = require('./bot-lang');
const klentBot = require('./klentBot');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8805705606:AAG5TRIJjU-kMR9F0GkFlh4JcIJK95euYiE';
const ADMIN_USERNAME = 'azizvc_m';
const ADMIN_DISPLAY = 'azizvc\\_m';
let ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_ID || null;

// Vercel serverless da polling ishlamaydi, webhook ishlatamiz
const usePolling = !process.env.VERCEL;
const bot = new TelegramBot(BOT_TOKEN, usePolling ? { polling: true } : {});

const userSessions = new Map();

if (usePolling) {
  bot.on('polling_error', (err) => console.error('Polling error:', err.message));
}
bot.on('webhook_error', (err) => console.error('Webhook error:', err.message));
bot.on('error', (err) => console.error('Bot error:', err.message));

function getSession(chatId) {
  if (!userSessions.has(chatId)) {
    userSessions.set(chatId, { step: 'idle', cart: [], currentProduct: null, lang: 'uz', langSet: false, phone: '' });
  }
  return userSessions.get(chatId);
}

function getLang(chatId) {
  return getSession(chatId).lang || 'uz';
}

function clearSession(chatId) {
  const old = userSessions.get(chatId);
  const lang = old?.lang || 'uz';
  const langSet = old?.langSet || false;
  userSessions.set(chatId, { step: 'idle', cart: [], currentProduct: null, lang, langSet, phone: '' });
}

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString('uz-UZ') + " so'm";
}

function escMd(text) {
  if (!text) return '';
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

async function safeEdit(chatId, messageId, text, extra = {}) {
  if (!messageId) {
    return await safeSend(chatId, text, extra);
  }
  try {
    return await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', ...extra });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('message is not modified')) {
      return;
    }
    if (msg.includes('message to edit not found') || msg.includes("can't edit")) {
      // Message is a photo or was deleted - send as new message instead
      return await safeSend(chatId, text, extra);
    }
    console.error('✏️ safeEdit error:', msg.slice(0, 200));
    try {
      return await safeSend(chatId, text, extra);
    } catch (e2) {
      console.error('✏️ safeSend fallback error:', (e2.message || '').slice(0, 200));
    }
  }
}

async function safeSend(chatId, text, extra = {}) {
  try {
    return await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...extra });
  } catch (err) {
    console.error('📤 safeSend error:', (err.message || '').slice(0, 200));
    try {
      return await bot.sendMessage(chatId, text, { ...extra });
    } catch (e2) {
      console.error('📤 safeSend (plain):', (e2.message || '').slice(0, 200));
    }
  }
}

async function typing(chatId) {
  try { await bot.sendChatAction(chatId, 'typing'); } catch (e) {}
}

async function getProducts(categoryId = null) {
  if (categoryId) {
    return await db.query(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active' AND p.category_id = $1 ORDER BY p.name`,
      [categoryId]
    );
  }
  return await db.query(
    `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active' ORDER BY p.name`
  );
}

async function getCategories() {
  return await db.query(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count FROM categories c ORDER BY c.name`);
}

async function getProduct(id) {
  const result = await db.query(`SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1`, [id]);
  return result.rows[0] || null;
}

async function searchProducts(query) {
  const likeOp = db.isSqlite ? 'LIKE' : 'ILIKE';
  return await db.query(
    `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active' AND (p.name ${likeOp} $1 OR p.barcode ${likeOp} $1 OR p.product_code ${likeOp} $1 OR p.description ${likeOp} $1) ORDER BY p.name LIMIT 10`,
    [`%${query}%`]
  );
}

async function getUserOrders(identifier) {
  const searchTerm = identifier.startsWith('@') ? identifier : identifier;
  return await db.query(
    `SELECT s.*, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
     FROM sales s WHERE s.customer_name LIKE $1 AND s.payment_method = 'telegram'
     ORDER BY s.created_at DESC LIMIT 10`,
    [`%${searchTerm}%`]
  );
}

async function createOrder(chatId, username, firstName, items, totalAmount, deliveryAddress = null, phoneNumber = '') {
  const invoiceNumber = `TG-${Date.now().toString().slice(-8)}`;
  let notes = `Telegram bot orqali zakaz. Chat: ${chatId}`;
  if (phoneNumber) notes += `\n📞 Telefon: ${phoneNumber}`;
  if (deliveryAddress) {
    notes += `\n🚚 Yetkazib berish: ${deliveryAddress}`;
  }

  const saleResult = await db.query(
    `INSERT INTO sales (invoice_number, customer_name, total_amount, payment_method, received_amount, change_amount, notes, delivery_address) VALUES ($1, $2, $3, 'telegram', $3, 0, $4, $5) RETURNING *`,
    [invoiceNumber, username ? `@${username}` : firstName || 'Telegram foydalanuvchi', totalAmount, notes, deliveryAddress || null]
  );

  if (!saleResult || !saleResult.rows || !saleResult.rows[0]) {
    throw new Error('Sale creation failed - no rows returned');
  }

  const sale = saleResult.rows[0];

  if (!sale.id) {
    throw new Error('Sale created but has no ID');
  }

  for (const item of items) {
    await db.query(
      `INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5)`,
      [sale.id, item.product_id, item.quantity, item.price, item.subtotal]
    );

    const product = await getProduct(item.product_id);
    if (product) {
      const newStock = Math.max(0, product.stock_quantity - item.quantity);
      const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
      await db.query(`UPDATE products SET stock_quantity = $1, updated_at = ${nowExpr} WHERE id = $2`, [newStock, item.product_id]);
      await db.query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity, previous_stock, new_stock, note, created_by) VALUES ($1, 'sale', $2, $3, $4, $5, 1)`,
        [item.product_id, item.quantity, product.stock_quantity, newStock, `Telegram zakaz: ${invoiceNumber}`]
      );
    }
  }

  return { sale, invoiceNumber, deliveryAddress };
}

function buildOrderSummaryText(chatId, items, includeTotal = true) {
  const lang = getLang(chatId);
  let text = '';
  let total = 0;
  items.forEach((item, i) => {
    const subtotal = item.quantity * item.price;
    total += subtotal;
    text += t(lang, 'orderItem', { i: i + 1, name: escMd(item.name), qty: item.quantity, price: formatCurrency(item.price), subtotal: formatCurrency(subtotal) });
  });
  if (includeTotal) {
    text += `💰 *Jami: ${formatCurrency(total)}*\n`;
  }
  return { text, total };
}

async function sendAdminNotification(chatId, username, firstName, session, invoiceNumber, deliveryAddress) {
  const total = session.cart.reduce((s, i) => s + i.subtotal, 0);
  const phone = session.phone || '';
  const customerName = username ? `@${username}` : firstName || 'Telegram foydalanuvchi';

  // Get admin chat ID - try from DB if not in memory (for cold starts)
  let klentAdminChatId = klentBot.getAdminChatId();
  if (!klentAdminChatId) {
    klentAdminChatId = ADMIN_CHAT_ID;
  }
  if (!klentAdminChatId) {
    // Cold start - try loading from database
    try {
      const settingsResult = await db.query(`SELECT admin_telegram FROM settings LIMIT 1`);
      if (settingsResult.rows.length > 0 && settingsResult.rows[0].admin_telegram) {
        const savedId = settingsResult.rows[0].admin_telegram;
        if (savedId && !isNaN(Number(savedId))) {
          klentAdminChatId = Number(savedId);
          ADMIN_CHAT_ID = Number(savedId);
          console.log(`✅ Admin chat ID DB dan yuklandi: ${klentAdminChatId}`);
        }
      }
    } catch (dbErr) {
      console.log('⚠️ Admin chat ID ni DB dan yuklashda xatolik:', dbErr.message);
    }
  }

  if (klentAdminChatId) {
    // Send via @klentlarchek_bot with full details and action buttons
    // This is the PRIMARY notification - admin receives it from @klentlarchek_bot
    await klentBot.sendOrderNotification({
      adminChatId: klentAdminChatId,
      invoiceNumber,
      customerName,
      customerUsername: username || '',
      customerFirstName: firstName || '',
      customerChatId: chatId,
      phone,
      deliveryAddress,
      items: session.cart,
      totalAmount: total,
    });
  } else {
    console.log(`⚠️ @klentlarchek_bot: Admin chat ID topilmadi.`);

    // Fallback: send via main bot if admin has started @foodsPOS_bot
    if (ADMIN_CHAT_ID) {
      const { text } = buildOrderSummaryText(chatId, session.cart, false);
      const deliveryLine = deliveryAddress
        ? `🚚 ${escMd(deliveryAddress)}`
        : '🏪 Olib ketish';
      const phoneText = phone ? `\n📞 ${escMd(phone)}` : '';

      const backupText =
        `🔔 *YANGI BUYURTMA!*  #${invoiceNumber}\n\n` +
        `${text}\n` +
        `💰 *Jami: ${formatCurrency(total)}*\n\n` +
        `👤 ${escMd(customerName)}${phoneText}\n` +
        `🆔 Chat ID: \`${chatId}\`\n` +
        `📋 Chek: \`${invoiceNumber}\`\n` +
        `⏰ ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}\n`;

      await bot.sendMessage(ADMIN_CHAT_ID, backupText, { parse_mode: 'Markdown' }).catch(() => {});
    }
  }
}

async function placeOrder(chatId, messageId, username, firstName, session, deliveryAddress) {
  const lang = getLang(chatId);

  if (!session.cart || session.cart.length === 0) {
    const errMsg = t(lang, 'cartEmpty');
    if (messageId) {
      await safeEdit(chatId, messageId, errMsg, {
        reply_markup: { inline_keyboard: [[{ text: t(lang, 'backMain'), callback_data: 'start' }]] }
      });
    } else {
      await safeSend(chatId, errMsg);
    }
    return;
  }

  const total = session.cart.reduce((s, i) => s + i.subtotal, 0);

  const deliveryLine = deliveryAddress
    ? t(lang, 'deliveryText', { address: escMd(deliveryAddress) })
    : t(lang, 'pickup');

  const phoneNumber = session.phone || '';
  const { invoiceNumber } = await createOrder(chatId, username, firstName, session.cart, total, deliveryAddress, phoneNumber);

  await sendAdminNotification(chatId, username, firstName, session, invoiceNumber, deliveryAddress);

  clearSession(chatId);

  // Customer gets a SIMPLE confirmation (no full itemized receipt)
  const userMsg = t(lang, 'orderSuccess', {
    invoice: invoiceNumber,
    total: formatCurrency(total),
    delivery: deliveryLine,
    admin: ADMIN_DISPLAY
  });

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: t(lang, 'newOrderBtn'), callback_data: 'start' }],
      ],
    },
  };

  if (messageId) {
    await safeEdit(chatId, messageId, userMsg, keyboard);
  } else {
    await safeSend(chatId, userMsg, keyboard);
  }
}

function getMainKeyboard(lang) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: t(lang, 'products'), callback_data: 'products_all' }],
        [{ text: t(lang, 'search'), callback_data: 'search' }, { text: t(lang, 'myCart'), callback_data: 'view_cart' }],
        [{ text: t(lang, 'myOrders'), callback_data: 'show_myorders' }, { text: '🌐 ' + t(lang, 'name'), callback_data: 'change_lang' }],
      ],
    },
  };
}

function getLangKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🇺🇿 O'zbek", callback_data: 'set_lang_uz' }],
        [{ text: '🇷🇺 Русский', callback_data: 'set_lang_ru' }],
      ],
    },
  };
}

async function showProductDetail(chatId, messageId, productId, lang) {
  const product = await getProduct(productId);
  if (!product) {
    await safeEdit(chatId, messageId, t(lang, 'notFound'));
    return;
  }

  const stockStatus = product.stock_quantity === 0 ? '❌ ' + t(lang, 'outOfStock') :
    product.stock_quantity < product.minimum_stock ? '⚠️ ' + t(lang, 'lowStock') : '✅ ' + t(lang, 'inStock');

  const brandText = product.brand ? t(lang, 'brand', { brand: product.brand }) : '';

  const text = t(lang, 'productDetail', {
    name: product.name,
    image: '',
    brand: brandText,
    category: product.category_name || '-',
    price: formatCurrency(product.selling_price),
    unit: product.unit || 'dona',
    stock: product.stock_quantity,
    status: stockStatus,
    description: product.description ? `\n📝 ${product.description}\n` : ''
  });

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        ...(product.stock_quantity > 0 ? [[{ text: t(lang, 'addToCart'), callback_data: `add_${product.id}` }]] : []),
        [{ text: t(lang, 'viewCart'), callback_data: 'view_cart' }],
        [{ text: t(lang, 'back'), callback_data: 'products_all' }],
      ],
    },
  };

  try {
    if (product.image_url) {
      await bot.deleteMessage(chatId, messageId).catch(() => {});
      await bot.sendPhoto(chatId, product.image_url, {
        caption: text,
        parse_mode: 'Markdown',
        ...keyboard,
      });
    } else {
      await safeEdit(chatId, messageId, text, keyboard);
    }
  } catch (err) {
    await safeEdit(chatId, messageId, text, keyboard);
  }
}

async function showProductsList(chatId, messageId, products, title, page = 0) {
  const lang = getLang(chatId);
  const perPage = 8;
  const totalPages = Math.ceil(products.length / perPage);
  const start = page * perPage;
  const pageProducts = products.slice(start, start + perPage);

  if (products.length === 0) {
    await safeEdit(chatId, messageId, t(lang, 'noProductsCat'), {
      reply_markup: { inline_keyboard: [[{ text: t(lang, 'back'), callback_data: 'products_all' }]] }
    });
    return;
  }

  const buttons = [];
  for (let i = 0; i < pageProducts.length; i += 2) {
    const row = [];
    const p1 = pageProducts[i];
    const stock1 = p1.stock_quantity > 0 ? '✅' : '❌';
    row.push({ text: `${stock1} ${p1.name.length > 20 ? p1.name.slice(0, 18) + '..' : p1.name}`, callback_data: `prod_${p1.id}` });
    if (pageProducts[i + 1]) {
      const p2 = pageProducts[i + 1];
      const stock2 = p2.stock_quantity > 0 ? '✅' : '❌';
      row.push({ text: `${stock2} ${p2.name.length > 20 ? p2.name.slice(0, 18) + '..' : p2.name}`, callback_data: `prod_${p2.id}` });
    }
    buttons.push(row);
  }

  if (totalPages > 1) {
    const navRow = [];
    if (page > 0) navRow.push({ text: '⬅️', callback_data: `products_page_${page - 1}` });
    navRow.push({ text: `📄 ${page + 1}/${totalPages}`, callback_data: 'noop' });
    if (page < totalPages - 1) navRow.push({ text: '➡️', callback_data: `products_page_${page + 1}` });
    buttons.push(navRow);
  }

  buttons.push([{ text: t(lang, 'back'), callback_data: 'products_all' }]);

  const listText = pageProducts.map((p, i) => {
    const stock = p.stock_quantity > 0 ? `📦 ${p.stock_quantity}` : '❌';
    return `${i + 1 + start}. ${p.name} • ${formatCurrency(p.selling_price)} (${stock})`;
  }).join('\n');

  await safeEdit(chatId, messageId,
    t(lang, 'productsList', { title, count: products.length, list: listText }),
    { reply_markup: { inline_keyboard: buttons } }
  );
}

async function showCart(chatId, messageId) {
  const session = getSession(chatId);
  const lang = getLang(chatId);

  if (session.cart.length === 0) {
    await safeEdit(chatId, messageId, t(lang, 'cartEmpty'), {
      reply_markup: {
        inline_keyboard: [
          [{ text: t(lang, 'products'), callback_data: 'products_all' }],
          [{ text: t(lang, 'backMain'), callback_data: 'start' }],
        ],
      },
    });
    return;
  }

  const total = session.cart.reduce((sum, i) => sum + i.subtotal, 0);

  let cartText = t(lang, 'cart', {
    items: session.cart.map((item, i) =>
      t(lang, 'cartItem', { i: i + 1, name: item.name, qty: item.quantity, price: formatCurrency(item.price), subtotal: formatCurrency(item.subtotal) })
    ).join(''),
    total: formatCurrency(total),
    count: session.cart.length
  });

  const buttons = [];
  for (const item of session.cart) {
    buttons.push([
      { text: `➖ ${item.name} (${item.quantity}) ➕`, callback_data: `cart_adj_${item.product_id}` },
    ]);
    buttons.push([
      { text: `🗑️ ${t(lang, 'myCart').replace('🛒 ', '').toLowerCase()}dan olib tashlash`, callback_data: `remove_${item.product_id}` },
    ]);
  }

  buttons.push([{ text: t(lang, 'confirmOrder'), callback_data: 'confirm_order' }]);
  buttons.push([{ text: t(lang, 'clearCart'), callback_data: 'clear_cart_ask' }]);
  buttons.push([{ text: t(lang, 'backMain'), callback_data: 'start' }]);

  await safeEdit(chatId, messageId, cartText, {
    reply_markup: { inline_keyboard: buttons },
  });
}

async function showCartAdjust(chatId, messageId, productId) {
  const session = getSession(chatId);
  const lang = getLang(chatId);
  const item = session.cart.find(i => i.product_id === productId);
  if (!item) {
    await showCart(chatId, messageId);
    return;
  }

  const text = `${t(lang, 'myCart')}\n\n📦 *${escMd(item.name)}*\n${t(lang, 'cartItem', { i: 1, name: item.name, qty: item.quantity, price: formatCurrency(item.price), subtotal: formatCurrency(item.subtotal) })}`;
  const maxQty = Math.min(item.stock || item.quantity + 5, item.stock || 99);

  const buttons = [];
  const qtys = [];
  for (let i = 1; i <= maxQty && qtys.length < 9; i++) {
    if (i === 1 || i === item.quantity || i === maxQty || i === Math.ceil(maxQty / 2)) {
      qtys.push(i);
    }
  }
  if (!qtys.includes(item.quantity) && item.quantity <= maxQty) {
    qtys.push(item.quantity);
    qtys.sort((a, b) => a - b);
  }
  const uniq = [...new Set(qtys)];
  for (let i = 0; i < uniq.length; i += 3) {
    buttons.push(uniq.slice(i, i + 3).map(q => ({
      text: q === item.quantity ? `✅ ${q}` : `${q}`,
      callback_data: q === item.quantity ? 'noop' : `cart_setqty_${productId}_${q}`
    })));
  }
  buttons.push([{ text: '🗑️ ' + t(lang, 'myCart').replace('🛒 ', '').toLowerCase() + 'dan olib tashlash', callback_data: `remove_${productId}` }]);
  buttons.push([{ text: t(lang, 'back'), callback_data: 'view_cart' }]);

  await safeEdit(chatId, messageId, text, {
    reply_markup: { inline_keyboard: buttons }
  });
}

async function showLangSelection(chatId, messageId = null) {
  const text = t(getLang(chatId), 'chooseLang');
  if (messageId) {
    await safeEdit(chatId, messageId, text, getLangKeyboard());
  } else {
    await safeSend(chatId, text, getLangKeyboard());
  }
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || '';
  const username = msg.from?.username;

  if (username === ADMIN_USERNAME) {
    ADMIN_CHAT_ID = chatId;
    console.log(`✅ Admin aniqlandi: @${username}, Chat ID: ${chatId}`);

    // Save admin chat ID to database for persistence across server restarts
    try {
      // Check if settings table has any row
      const existing = await db.query('SELECT id FROM settings LIMIT 1');
      if (existing.rows.length > 0) {
        await db.query(`UPDATE settings SET admin_telegram = $1, updated_at = ${db.isSqlite ? "datetime('now')" : 'NOW()'} WHERE id = $2`, [String(chatId), existing.rows[0].id]);
      } else {
        await db.query(`INSERT INTO settings (store_name, admin_telegram) VALUES ('My Store', $1)`, [String(chatId)]);
      }
      console.log('✅ Admin chat ID saqlandi (settings)');
    } catch (dbErr) {
      console.log('⚠️ Admin chat ID ni saqlashda xatolik:', dbErr.message);
    }

    // Send admin a silent welcome (no bot links exposed)
    const adminWelcome =
      `👋 *Xush kelibsiz, Admin!* ✅\n\n` +
      `Bot to'liq ishga tushdi. Buyurtmalar avtomatik tarzda qabul qilinadi.`;
    await safeSend(chatId, adminWelcome);
  }

  const session = getSession(chatId);

  if (!session.langSet) {
    clearSession(chatId);
    const s = getSession(chatId);
    s.lang = 'uz';
    await safeSend(chatId, t('uz', 'chooseLang'), getLangKeyboard());
    return;
  }

  clearSession(chatId);
  const lang = getLang(chatId);
  await safeSend(chatId, t(lang, 'start', { name: firstName }), getMainKeyboard(lang));
});

bot.onText(/\/lang/, async (msg) => {
  await showLangSelection(msg.chat.id);
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = getLang(chatId);
  await safeSend(chatId, t(lang, 'help', { admin: ADMIN_DISPLAY }));
});

bot.onText(/\/cart/, async (msg) => {
  const chatId = msg.chat.id;
  const session = getSession(chatId);
  if (session.cart.length === 0) {
    await safeSend(chatId, t(getLang(chatId), 'cartEmpty'));
    return;
  }
  await showCart(chatId, null);
});

bot.onText(/\/myorders/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = getLang(chatId);
  const username = msg.from?.username;
  const firstName = msg.from?.first_name;

  const identifier = username ? `@${username}` : firstName || '';
  if (!identifier) {
    await safeSend(chatId, t(lang, 'noOrdersUser'));
    return;
  }

  try {
    const { rows: orders } = await getUserOrders(identifier);
    if (orders.length === 0) {
      await safeSend(chatId, t(lang, 'noOrdersUser'));
      return;
    }

    let text = t(lang, 'myOrders_title') + '\n\n';
    orders.forEach((o, i) => {
      const date = new Date(o.created_at).toLocaleString('uz-UZ');
      text += `${i + 1}. \`${o.invoice_number}\`\n`;
      text += `   💰 ${formatCurrency(o.total_amount)}\n`;
      text += `   📅 ${date}\n`;
      const hasDelivery = o.notes?.includes('Yetkazib berish');
      text += `   ${hasDelivery ? '🚚' : '🏪'} ${hasDelivery ? t(lang, 'deliveryYes').replace('✅ ', '') : t(lang, 'pickup').trim()}\n\n`;
    });

    await safeSend(chatId, text);
  } catch (err) {
    await safeSend(chatId, t(lang, 'errorOccurred'));
  }
});

bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from?.username;
  const lang = getLang(chatId);

  if (username !== ADMIN_USERNAME) {
    await safeSend(chatId, t(lang, 'adminOnly'));
    return;
  }

  await typing(chatId);

  try {
    const { rows: recentSales } = await db.query(
      `SELECT s.*, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
       FROM sales s WHERE s.payment_method = 'telegram' ORDER BY s.created_at DESC LIMIT 15`
    );

    if (recentSales.length === 0) {
      await safeSend(chatId, t(lang, 'noOrders'));
      return;
    }

    let text = t(lang, 'ordersList');
    recentSales.forEach((sale, i) => {
      text += t(lang, 'orderItem_short', {
        i: i + 1,
        invoice: sale.invoice_number,
        customer: sale.customer_name || '-',
        amount: formatCurrency(sale.total_amount),
        date: new Date(sale.created_at).toLocaleString('uz-UZ')
      });
    });

    await safeSend(chatId, text);
  } catch (error) {
    await safeSend(chatId, t(lang, 'errorOccurred'));
  }
});

bot.onText(/\/delivery/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from?.username;
  const lang = getLang(chatId);

  if (username !== ADMIN_USERNAME) {
    await safeSend(chatId, t(lang, 'adminOnly'));
    return;
  }

  await typing(chatId);

  try {
    const { rows: deliveries } = await db.query(
      `SELECT s.*, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
       FROM sales s
       WHERE s.notes LIKE '%Yetkazib berish%'
       ORDER BY s.created_at DESC LIMIT 20`
    );

    if (deliveries.length === 0) {
      await safeSend(chatId, t(lang, 'noDeliveries'));
      return;
    }

    let text = t(lang, 'deliveriesList');
    deliveries.forEach((sale, i) => {
      const deliveryMatch = sale.notes?.match(/🚚 Yetkazib berish: ([^\n]+)/);
      const address = deliveryMatch ? deliveryMatch[1] : '-';
      const phoneMatch = sale.notes?.match(/📞 Telefon: ([^\n]+)/);
      const phone = phoneMatch ? phoneMatch[1] : '';
      text += t(lang, 'deliveryItem', {
        i: i + 1,
        invoice: sale.invoice_number,
        customer: sale.customer_name || '-',
        amount: formatCurrency(sale.total_amount),
        address,
        date: new Date(sale.created_at).toLocaleString('uz-UZ')
      });
      if (phone) text += `   📞 ${phone}\n\n`;
      else text += '\n';
    });

    await safeSend(chatId, text);
  } catch (error) {
    console.error('Delivery error:', error);
    await safeSend(chatId, t(lang, 'errorOccurred'));
  }
});

bot.onText(/\/products/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = getLang(chatId);
  await typing(chatId);

  const { rows: categories } = await getCategories();
  const activeCategories = categories.filter(c => c.product_count > 0);

  if (activeCategories.length === 0) {
    await safeSend(chatId, t(lang, 'noProducts'));
    return;
  }

  const buttons = [];
  for (let i = 0; i < activeCategories.length; i += 2) {
    const row = [{ text: `${activeCategories[i].name} (${activeCategories[i].product_count})`, callback_data: `cat_${activeCategories[i].id}` }];
    if (activeCategories[i + 1]) {
      row.push({ text: `${activeCategories[i + 1].name} (${activeCategories[i + 1].product_count})`, callback_data: `cat_${activeCategories[i + 1].id}` });
    }
    buttons.push(row);
  }
  buttons.push([{ text: '📋 ' + t(lang, 'allProducts'), callback_data: 'all_products_list' }]);
  buttons.push([{ text: t(lang, 'backMain'), callback_data: 'start' }]);

  await safeSend(chatId, t(lang, 'selectCategory'), {
    reply_markup: { inline_keyboard: buttons },
  });
});

bot.on('callback_query', async (query) => {
  try {
    const chatId = query.message.chat.id;
    const data = query.data;
    const session = getSession(chatId);
    const lang = getLang(chatId);
    const firstName = query.from?.first_name || '';
    const username = query.from?.username;

    bot.answerCallbackQuery(query.id).catch(() => {});

    if (data === 'noop') return;

    if (data.startsWith('set_lang_')) {
      const newLang = data.replace('set_lang_', '');
      session.lang = newLang;
      session.langSet = true;
      clearSession(chatId);
      const s = getSession(chatId);
      s.lang = newLang;
      s.langSet = true;
      await safeEdit(chatId, query.message.message_id,
        t(newLang, 'langChanged', { lang: t(newLang, 'flag') + ' ' + t(newLang, 'name') })
      );
      setTimeout(() => {
        safeEdit(chatId, query.message.message_id,
          t(newLang, 'start', { name: firstName }),
          getMainKeyboard(newLang)
        );
      }, 800);
      return;
    }

    if (data === 'change_lang') {
      await showLangSelection(chatId, query.message.message_id);
      return;
    }

    if (data === 'start' || data === 'back_main') {
      clearSession(chatId);
      const l = getLang(chatId);
      await safeEdit(chatId, query.message.message_id,
        t(l, 'start', { name: firstName }),
        getMainKeyboard(l)
      );
      return;
    }

    if (data === 'show_myorders') {
      const identifier = username ? `@${username}` : firstName || '';
      if (!identifier) {
        await safeEdit(chatId, query.message.message_id, t(lang, 'noOrdersUser'), {
          reply_markup: { inline_keyboard: [[{ text: t(lang, 'backMain'), callback_data: 'start' }]] }
        });
        return;
      }
      try {
        const { rows: orders } = await getUserOrders(identifier);
        if (orders.length === 0) {
          await safeEdit(chatId, query.message.message_id, t(lang, 'noOrdersUser'), {
            reply_markup: { inline_keyboard: [[{ text: t(lang, 'backMain'), callback_data: 'start' }]] }
          });
          return;
        }
        let text = t(lang, 'myOrders_title') + '\n\n';
        orders.forEach((o, i) => {
          const date = new Date(o.created_at).toLocaleString('uz-UZ');
          text += `${i + 1}. \`${o.invoice_number}\`\n`;
          text += `   💰 ${formatCurrency(o.total_amount)}\n`;
          text += `   📅 ${date}\n`;
          const hasDelivery = o.notes?.includes('Yetkazib berish');
          text += `   ${hasDelivery ? '🚚' : '🏪'} ${hasDelivery ? 'Yetkazib berish' : 'Olib ketish'}\n\n`;
        });
        await safeEdit(chatId, query.message.message_id, text, {
          reply_markup: { inline_keyboard: [[{ text: t(lang, 'backMain'), callback_data: 'start' }]] }
        });
      } catch (err) {
        await safeEdit(chatId, query.message.message_id, t(lang, 'errorOccurred'), {
          reply_markup: { inline_keyboard: [[{ text: t(lang, 'backMain'), callback_data: 'start' }]] }
        });
      }
      return;
    }

    if (data === 'products_all') {
      await typing(chatId);
      const { rows: categories } = await getCategories();
      const buttons = [];
      const activeCategories = categories.filter(c => c.product_count > 0);

      if (activeCategories.length === 0) {
        await safeEdit(chatId, query.message.message_id, t(lang, 'noProducts'), {
          reply_markup: { inline_keyboard: [[{ text: t(lang, 'back'), callback_data: 'back_main' }]] }
        });
        return;
      }

      for (let i = 0; i < activeCategories.length; i += 2) {
        const row = [{ text: `${activeCategories[i].name} (${activeCategories[i].product_count})`, callback_data: `cat_${activeCategories[i].id}` }];
        if (activeCategories[i + 1]) {
          row.push({ text: `${activeCategories[i + 1].name} (${activeCategories[i + 1].product_count})`, callback_data: `cat_${activeCategories[i + 1].id}` });
        }
        buttons.push(row);
      }
      buttons.push([{ text: '📋 ' + t(lang, 'allProducts'), callback_data: 'all_products_list' }]);
      buttons.push([{ text: t(lang, 'back'), callback_data: 'back_main' }]);

      await safeEdit(chatId, query.message.message_id, t(lang, 'selectCategory'), {
        reply_markup: { inline_keyboard: buttons }
      });
      return;
    }

    if (data.startsWith('cat_')) {
      await typing(chatId);
      const catId = parseInt(data.replace('cat_', ''));
      const { rows: products } = await getProducts(catId);
      await showProductsList(chatId, query.message.message_id, products, t(lang, 'categoryProducts'));
      return;
    }

    if (data === 'all_products_list') {
      await typing(chatId);
      const { rows: products } = await getProducts();
      await showProductsList(chatId, query.message.message_id, products, t(lang, 'allProducts'));
      return;
    }

    if (data.startsWith('products_page_')) {
      await typing(chatId);
      const page = parseInt(data.replace('products_page_', ''));
      const { rows: products } = await getProducts();
      await showProductsList(chatId, query.message.message_id, products, t(lang, 'allProducts'), page);
      return;
    }

    if (data.startsWith('prod_')) {
      const productId = parseInt(data.replace('prod_', '').split('_')[0]);
      await showProductDetail(chatId, query.message.message_id, productId, lang);
      return;
    }

    if (data.startsWith('add_')) {
      const productId = parseInt(data.replace('add_', ''));
      const product = await getProduct(productId);
      if (!product) {
        await safeEdit(chatId, query.message.message_id, '❌ ' + t(lang, 'notFound'), {
          reply_markup: { inline_keyboard: [[{ text: t(lang, 'back'), callback_data: 'products_all' }]] }
        });
        return;
      }

      if (product.stock_quantity <= 0) {
        await safeEdit(chatId, query.message.message_id, '❌ ' + t(lang, 'outOfStock'), {
          reply_markup: { inline_keyboard: [[{ text: t(lang, 'back'), callback_data: 'products_all' }]] }
        });
        return;
      }

      session.currentProduct = product;
      session.step = 'awaiting_quantity';

      const buttons = [];
      const maxQty = Math.min(product.stock_quantity, 10);
      for (let i = 1; i <= maxQty; i += (maxQty <= 5 ? 1 : 2)) {
        buttons.push({ text: `${i}`, callback_data: `qty_${i}` });
      }
      const inlineButtons = [];
      for (let i = 0; i < buttons.length; i += 3) {
        inlineButtons.push(buttons.slice(i, i + 3));
      }
      inlineButtons.push([{ text: t(lang, 'cancel'), callback_data: `prod_${product.id}` }]);

      await safeEdit(chatId, query.message.message_id,
        t(lang, 'addToCartQty', { name: product.name, price: formatCurrency(product.selling_price), stock: product.stock_quantity }),
        { reply_markup: { inline_keyboard: inlineButtons } }
      );
      return;
    }

    if (data.startsWith('qty_')) {
      const qty = parseInt(data.replace('qty_', ''));
      const product = session.currentProduct;

      if (!product) {
        await safeEdit(chatId, query.message.message_id, '❌ ' + t(lang, 'error'), {
          reply_markup: { inline_keyboard: [[{ text: t(lang, 'back'), callback_data: 'products_all' }]] }
        });
        return;
      }

      if (qty > product.stock_quantity) {
        await safeEdit(chatId, query.message.message_id, t(lang, 'onlyStock', { stock: product.stock_quantity }), {
          reply_markup: { inline_keyboard: [
            [{ text: t(lang, 'back'), callback_data: 'products_all' }],
          ]}
        });
        return;
      }

      const existing = session.cart.find(i => i.product_id === product.id);
      if (existing) {
        existing.quantity += qty;
        existing.subtotal = existing.quantity * existing.price;
      } else {
        session.cart.push({
          product_id: product.id,
          name: product.name,
          price: product.selling_price,
          quantity: qty,
          subtotal: qty * product.selling_price,
          stock: product.stock_quantity,
        });
      }

      session.step = 'idle';
      session.currentProduct = null;

      const cartTotal = session.cart.reduce((sum, i) => sum + i.subtotal, 0);

      await safeEdit(chatId, query.message.message_id,
        t(lang, 'addedToCart', { name: product.name, qty, count: session.cart.length, total: formatCurrency(cartTotal) }),
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: t(lang, 'continue'), callback_data: 'products_all' }],
              [{ text: t(lang, 'viewCart'), callback_data: 'view_cart' }],
              [{ text: t(lang, 'confirmOrder'), callback_data: 'confirm_order' }],
              [{ text: t(lang, 'backMain'), callback_data: 'start' }],
            ],
          },
        }
      );
      return;
    }

    if (data === 'view_cart') {
      await showCart(chatId, query.message.message_id);
      return;
    }

    if (data.startsWith('cart_adj_')) {
      const productId = parseInt(data.replace('cart_adj_', ''));
      await showCartAdjust(chatId, query.message.message_id, productId);
      return;
    }

    if (data.startsWith('cart_setqty_')) {
      const parts = data.split('_');
      const productId = parseInt(parts[2]);
      const newQty = parseInt(parts[3]);
      const item = session.cart.find(i => i.product_id === productId);
      if (item && newQty > 0 && newQty <= (item.stock || 99)) {
        item.quantity = newQty;
        item.subtotal = item.quantity * item.price;
      }
      await showCart(chatId, query.message.message_id);
      return;
    }

    if (data.startsWith('remove_')) {
      const productId = parseInt(data.replace('remove_', ''));
      session.cart = session.cart.filter(i => i.product_id !== productId);
      await showCart(chatId, query.message.message_id);
      return;
    }

    if (data === 'confirm_order') {
      if (session.cart.length === 0) {
        await safeEdit(chatId, query.message.message_id, t(lang, 'cartEmpty'), {
          reply_markup: { inline_keyboard: [
            [{ text: t(lang, 'products'), callback_data: 'products_all' }],
            [{ text: t(lang, 'backMain'), callback_data: 'start' }],
          ]}
        });
        return;
      }

      const { text } = buildOrderSummaryText(chatId, session.cart, true);

      await safeEdit(chatId, query.message.message_id, text + `\n${t(lang, 'customer', { name: escMd(username ? `@${username}` : firstName || '-') })}\n\n${t(lang, 'confirm')}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: t(lang, 'confirmOrder'), callback_data: 'final_confirm' }],
            [{ text: t(lang, 'clearCart'), callback_data: 'clear_cart_ask' }],
            [{ text: t(lang, 'back'), callback_data: 'view_cart' }],
          ],
        },
      });
      return;
    }

    if (data === 'final_confirm') {
      if (session.cart.length === 0) {
        await safeEdit(chatId, query.message.message_id, t(lang, 'cartEmpty'), {
          reply_markup: { inline_keyboard: [
            [{ text: t(lang, 'products'), callback_data: 'products_all' }],
            [{ text: t(lang, 'backMain'), callback_data: 'start' }],
          ]}
        });
        return;
      }

      await safeEdit(chatId, query.message.message_id, t(lang, 'askDelivery'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: t(lang, 'deliveryYes'), callback_data: 'ask_delivery' }],
            [{ text: t(lang, 'deliveryNo'), callback_data: 'no_delivery' }],
            [{ text: t(lang, 'back'), callback_data: 'confirm_order' }],
          ],
        },
      });
      return;
    }

    if (data === 'ask_delivery') {
      session.step = 'awaiting_phone';
      await safeEdit(chatId, query.message.message_id,
        '📞 *Telefon raqamingizni yozing:*\n\nMisol: +998901234567\n\nYetkazib berishda bog\'lanish uchun kerak.',
        { reply_markup: { inline_keyboard: [[{ text: t(lang, 'back'), callback_data: 'final_confirm' }]] } }
      );
      return;
    }

    if (data === 'send_location') {
      session.step = 'awaiting_location';
      await safeEdit(chatId, query.message.message_id, t(lang, 'locationPrompt'), {
        reply_markup: { inline_keyboard: [[{ text: t(lang, 'back'), callback_data: 'ask_delivery' }]] }
      });
      return;
    }

    if (data === 'no_delivery') {
      if (session.cart.length === 0) {
        await safeEdit(chatId, query.message.message_id, t(lang, 'cartEmpty'), {
          reply_markup: { inline_keyboard: [
            [{ text: t(lang, 'products'), callback_data: 'products_all' }],
            [{ text: t(lang, 'backMain'), callback_data: 'start' }],
          ]}
        });
        return;
      }
      await safeEdit(chatId, query.message.message_id, '⏳ ' + t(lang, 'confirmOrder') + '...');
      await typing(chatId);
      try {
        await placeOrder(chatId, query.message.message_id, username, firstName, session, null);
      } catch (err) {
        console.error('no_delivery error:', err);
        await safeEdit(chatId, query.message.message_id, t(lang, 'orderError'), {
          reply_markup: { inline_keyboard: [[{ text: t(lang, 'backMain'), callback_data: 'start' }]] }
        });
      }
      return;
    }

    if (data === 'clear_cart_ask') {
      await safeEdit(chatId, query.message.message_id, t(lang, 'cartCleared').replace('🗑️ ', '🗑️ *') + '*\n\n' + t(lang, 'confirm'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Ha', callback_data: 'clear_cart_yes' }],
            [{ text: t(lang, 'cancel'), callback_data: 'view_cart' }],
          ],
        },
      });
      return;
    }

    if (data === 'clear_cart_yes') {
      session.cart = [];
      session.step = 'idle';
      await safeEdit(chatId, query.message.message_id, t(lang, 'cartCleared'), {
        reply_markup: { inline_keyboard: [[{ text: t(lang, 'backMain'), callback_data: 'start' }]] }
      });
      return;
    }

    if (data === 'search') {
      session.step = 'awaiting_search';
      await safeEdit(chatId, query.message.message_id, t(lang, 'searchPrompt'), {
        reply_markup: { inline_keyboard: [[{ text: t(lang, 'back'), callback_data: 'back_main' }]] }
      });
      return;
    }

    if (data === 'check_stock') {
      await typing(chatId);
      const { rows: products } = await getProducts();
      const lowStock = products.filter(p => p.stock_quantity < p.minimum_stock && p.stock_quantity > 0);
      const outOfStock = products.filter(p => p.stock_quantity === 0);

      let text = t(lang, 'stockCheck', {
        available: products.length - lowStock.length - outOfStock.length,
        low: lowStock.length,
        out: outOfStock.length
      }) + '\n\n';

      if (outOfStock.length > 0) {
        text += t(lang, 'stockOut');
        outOfStock.forEach(p => { text += t(lang, 'stockOutItem', { name: p.name }); });
        text += '\n';
      }
      if (lowStock.length > 0) {
        text += t(lang, 'stockLow');
        lowStock.forEach(p => { text += t(lang, 'stockItem', { name: p.name, stock: p.stock_quantity }); });
      }

      await safeEdit(chatId, query.message.message_id, text, {
        reply_markup: { inline_keyboard: [[{ text: t(lang, 'back'), callback_data: 'back_main' }]] }
      });
      return;
    }
  } catch (err) {
    console.error('Callback error:', err);
    try {
      const chatId = query.message.chat.id;
      const lang = getLang(chatId);
      await safeEdit(chatId, query.message.message_id, t(lang, 'errorOccurred'), {
        reply_markup: { inline_keyboard: [[{ text: t(lang, 'backMain'), callback_data: 'start' }]] }
      });
    } catch (e) {}
  }
});

bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text;
    const session = getSession(chatId);
    const lang = getLang(chatId);

    if (!text || text.startsWith('/')) return;

    if (session.step === 'awaiting_search') {
      await typing(chatId);
      const { rows: products } = await searchProducts(text);
      session.step = 'idle';

      if (products.length === 0) {
        await safeSend(chatId, t(lang, 'notFoundSearch', { query: text }), {
          reply_markup: {
            inline_keyboard: [
              [{ text: t(lang, 'allProducts'), callback_data: 'products_all' }],
              [{ text: t(lang, 'backMain'), callback_data: 'start' }],
            ],
          },
        });
        return;
      }

      const buttons = products.map(p => {
        const stock = p.stock_quantity > 0 ? '✅' : '❌';
        return [{ text: `${stock} ${p.name.length > 25 ? p.name.slice(0, 23) + '..' : p.name}`, callback_data: `prod_${p.id}` }];
      });
      buttons.push([{ text: t(lang, 'back'), callback_data: 'back_main' }]);

      await safeSend(chatId, t(lang, 'foundSearch', { query: text, count: products.length }), {
        reply_markup: { inline_keyboard: buttons },
      });
      return;
    }

    if (session.step === 'awaiting_quantity') {
      const qty = parseInt(text);
      const product = session.currentProduct;

      if (!product || isNaN(qty) || qty <= 0) {
        await safeSend(chatId, t(lang, 'enterNumber'));
        return;
      }

      if (qty > product.stock_quantity) {
        await safeSend(chatId, t(lang, 'onlyStock', { stock: product.stock_quantity }), {
          reply_markup: {
            inline_keyboard: [
              [{ text: `${product.stock_quantity} dona`, callback_data: `qty_${product.stock_quantity}` }],
              [{ text: t(lang, 'back'), callback_data: `prod_${product.id}` }],
            ],
          },
        });
        return;
      }

      const existing = session.cart.find(i => i.product_id === product.id);
      if (existing) {
        existing.quantity += qty;
        existing.subtotal = existing.quantity * existing.price;
      } else {
        session.cart.push({
          product_id: product.id,
          name: product.name,
          price: product.selling_price,
          quantity: qty,
          subtotal: qty * product.selling_price,
          stock: product.stock_quantity,
        });
      }

      session.step = 'idle';
      session.currentProduct = null;

      const cartTotal = session.cart.reduce((sum, i) => sum + i.subtotal, 0);

      await safeSend(chatId,
        t(lang, 'addedToCart', { name: product.name, qty, count: session.cart.length, total: formatCurrency(cartTotal) }),
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: t(lang, 'continue'), callback_data: 'products_all' }],
              [{ text: t(lang, 'viewCart'), callback_data: 'view_cart' }],
              [{ text: t(lang, 'confirmOrder'), callback_data: 'confirm_order' }],
              [{ text: t(lang, 'backMain'), callback_data: 'start' }],
            ],
          },
        }
      );
      return;
    }

    if (session.step === 'awaiting_phone') {
      session.phone = text.trim();
      session.step = 'awaiting_delivery_address';
      await safeSend(chatId, '✅ Telefon raqam qabul qilindi!');
      await safeSend(chatId, t(lang, 'deliveryAddress'), {
        reply_markup: { inline_keyboard: [
          [{ text: t(lang, 'sendLocation'), callback_data: 'send_location' }],
          [{ text: t(lang, 'back'), callback_data: 'final_confirm' }],
        ]}
      });
      return;
    }

    if ((session.step === 'awaiting_delivery_address' || session.step === 'awaiting_location')) {
      session.step = 'idle';
      await typing(chatId);
      try {
        await placeOrder(chatId, null, msg.from?.username, msg.from?.first_name || '', session, text);
      } catch (err) {
        await safeSend(chatId, t(lang, 'orderError'), {
          reply_markup: { inline_keyboard: [[{ text: t(lang, 'backMain'), callback_data: 'start' }]] }
        });
      }
      return;
    }
  } catch (err) {
    console.error('Message handler error:', err);
  }
});

bot.on('location', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const session = getSession(chatId);
    const lang = getLang(chatId);

    if (session.step === 'awaiting_delivery_address' || session.step === 'awaiting_location') {
      const lat = msg.location.latitude;
      const lon = msg.location.longitude;
      const locationLink = `https://www.google.com/maps?q=${lat},${lon}`;
      session.step = 'idle';
      await typing(chatId);
      try {
        await placeOrder(chatId, null, msg.from?.username, msg.from?.first_name || '', session, locationLink);
      } catch (err) {
        await safeSend(chatId, t(lang, 'orderError'), {
          reply_markup: { inline_keyboard: [[{ text: t(lang, 'backMain'), callback_data: 'start' }]] }
        });
      }
    }
  } catch (err) {
    console.error('Location handler error:', err);
  }
});

if (!process.env.VERCEL) {
  console.log('🤖 Telegram bot ishga tushdi!');
  console.log(`👤 Admin: @${ADMIN_USERNAME}`);
  console.log(`🔗 Asosiy bot: https://t.me/foodsPOS_bot`);
  console.log(`🔔 Xabarnoma boti: https://t.me/klentlarchek_bot`);
}

module.exports = { bot, getSession, getLang, clearSession, safeSend, safeEdit, ADMIN_CHAT_ID, ADMIN_USERNAME, ADMIN_DISPLAY, userSessions };
