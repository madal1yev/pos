require('dotenv').config();
const { TelegramBot } = require('node-telegram-bot-api');
const db = require('./config/db');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8805705606:AAG5TRIJjU-kMR9F0GkFlh4JcIJK95euYiE';
const ADMIN_USERNAME = 'azizvc_m';
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_ID || null;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const userSessions = new Map();

function getSession(chatId) {
  if (!userSessions.has(chatId)) {
    userSessions.set(chatId, { step: 'idle', cart: [], currentProduct: null });
  }
  return userSessions.get(chatId);
}

function clearSession(chatId) {
  userSessions.set(chatId, { step: 'idle', cart: [], currentProduct: null });
}

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString('uz-UZ') + " so'm";
}

async function getProducts(categoryId = null) {
  let sql = `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active'`;
  const params = [];
  if (categoryId) {
    sql += ` AND p.category_id = ?`;
    params.push(categoryId);
  }
  sql += ` ORDER BY p.name`;
  return await db.query(sql, params);
}

async function getCategories() {
  return await db.query(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count FROM categories c ORDER BY c.name`);
}

async function getProduct(id) {
  const result = await db.query(`SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`, [id]);
  return result.rows[0] || null;
}

async function searchProducts(query) {
  return await db.query(
    `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active' AND (p.name LIKE ? OR p.brand LIKE ? OR p.barcode LIKE ?) ORDER BY p.name LIMIT 10`,
    [`%${query}%`, `%${query}%`, `%${query}%`]
  );
}

async function createOrder(chatId, username, firstName, items, totalAmount) {
  try {
    const invoiceNumber = `TG-${Date.now().toString().slice(-8)}`;

    const saleResult = await db.query(
      `INSERT INTO sales (invoice_number, customer_name, total_amount, payment_method, status, cashier_id, notes) VALUES (?, ?, ?, 'telegram', 'completed', 1, ?) RETURNING *`,
      [invoiceNumber, username ? `@${username}` : firstName || 'Telegram foydalanuvchi', totalAmount, `Telegram bot orqali zakaz. Chat: ${chatId}`]
    );

    const sale = saleResult.rows[0];

    for (const item of items) {
      await db.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [sale.id, item.product_id, item.quantity, item.price, item.subtotal]
      );

      const product = await getProduct(item.product_id);
      if (product) {
        const newStock = Math.max(0, product.stock_quantity - item.quantity);
        await db.query(`UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?`, [newStock, item.product_id]);

        await db.query(
          `INSERT INTO inventory_logs (product_id, change_type, quantity, previous_stock, new_stock, note, created_by) VALUES (?, 'sale', ?, ?, ?, ?, 1)`,
          [item.product_id, item.quantity, product.stock_quantity, newStock, `Telegram zakaz: ${invoiceNumber}`]
        );
      }
    }

    return { sale, invoiceNumber };
  } catch (error) {
    console.error('Order creation error:', error);
    throw error;
  }
}

function buildOrderSummaryText(items) {
  let text = '🧾 *Zakaz xulosasi:*\n\n';
  let total = 0;
  items.forEach((item, i) => {
    const subtotal = item.quantity * item.price;
    total += subtotal;
    text += `${i + 1}. ${item.name}\n`;
    text += `   ${item.quantity} x ${formatCurrency(item.price)} = *${formatCurrency(subtotal)}*\n\n`;
  });
  text += `💰 *Jami: ${formatCurrency(total)}*\n`;
  return { text, total };
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || '';
  const username = msg.from?.username;
  clearSession(chatId);

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛍️ Mahsulotlar ro\'yxati', callback_data: 'products_all' }],
        [{ text: '🔍 Mahsulot qidirish', callback_data: 'search' }],
        [{ text: '🛒 Savatimni ko\'rish', callback_data: 'view_cart' }],
      ],
    },
  };

  bot.sendMessage(chatId,
    `Assalomu alaykum, *${firstName}*! 👋\n\n` +
    `🍽️ *Oziq-ovqat do'koniga xush kelibsiz!*\n\n` +
    `Men sizga mahsulotlar haqida ma'lumot berishim va zakaz qilishda yordam bera olaman.\n\n` +
    `📌 Nima qilmoqchisiz?`,
    { parse_mode: 'Markdown', ...keyboard }
  );
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const session = getSession(chatId);
  const firstName = query.from?.first_name || '';
  const username = query.from?.username;

  bot.answerCallbackQuery(query.id);

  if (data === 'start' || data === 'back_main') {
    clearSession(chatId);
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Mahsulotlar ro\'yxati', callback_data: 'products_all' }],
          [{ text: '🔍 Mahsulot qidirish', callback_data: 'search' }],
          [{ text: '🛒 Savatimni ko\'rish', callback_data: 'view_cart' }],
        ],
      },
    };
    bot.editMessageText(
      `Assalomu alaykum, *${firstName}*! 👋\n\n` +
      `🍽️ *Oziq-ovqat do'koniga xush kelibsiz!*\n\n` +
      `Men sizga mahsulotlar haqida ma'lumot berishim va zakaz qilishda yordam bera olaman.\n\n` +
      `📌 Nima qilmoqchisiz?`,
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...keyboard }
    );
  }

  if (data === 'products_all') {
    const { rows: categories } = await getCategories();
    const buttons = [];
    const activeCategories = categories.filter(c => c.product_count > 0);

    if (activeCategories.length === 0) {
      bot.editMessageText('Hozircha mahsulotlar mavjud emas. 😔', {
        chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '⬅️ Orqaga', callback_data: 'back_main' }]] }
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
    buttons.push([{ text: '📋 Barcha mahsulotlar', callback_data: 'all_products_list' }]);
    buttons.push([{ text: '⬅️ Orqaga', callback_data: 'back_main' }]);

    bot.editMessageText('📂 *Kategoriyalar:*\n\nQaysi kategoriyadan mahsulot ko\'rmoqchisiz?', {
      chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons }
    });
  }

  if (data.startsWith('cat_')) {
    const catId = parseInt(data.replace('cat_', ''));
    const { rows: products } = await getProducts(catId);
    showProductsList(chatId, query.message.message_id, products, 'Kategoriya mahsulotlari');
  }

  if (data === 'all_products_list') {
    const { rows: products } = await getProducts();
    showProductsList(chatId, query.message.message_id, products, 'Barcha mahsulotlar');
  }

  if (data.startsWith('prod_')) {
    const productId = parseInt(data.replace('prod_', ''));
    const product = await getProduct(productId);
    if (!product) {
      bot.answerCallbackQuery(query.id, { text: 'Mahsulot topilmadi', show_alert: true });
      return;
    }

    const stockStatus = product.stock_quantity === 0 ? '❌ Tugagan' :
      product.stock_quantity <= product.minimum_stock ? '⚠️ Kam qoldi' : '✅ Mavjud';

    const imageText = product.image_url ? `🖼️ Rasm: [Ko\'rish](${product.image_url})\n` : '';

    const keyboard = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          product.stock_quantity > 0 ? [
            { text: '🛒 Savatga qo\'shish', callback_data: `add_${product.id}` }
          ] : [],
          [{ text: '📋 Savatimni ko\'rish', callback_data: 'view_cart' }],
          [{ text: '⬅️ Orqaga', callback_data: 'products_all' }],
        ].filter(row => row.length > 0),
      },
    };

    const text = `📦 *${product.name}*\n\n` +
      `${product.brand ? `🏷️ Brend: ${product.brand}\n` : ''}` +
      `${product.category_name ? `📂 Kategoriya: ${product.category_name}\n` : ''}` +
      `${imageText}` +
      `💰 Narxi: *${formatCurrency(product.selling_price)}*\n` +
      `${product.unit ? `📏 O'lchov: ${product.unit}\n` : ''}` +
      `📦 Zaxira: *${product.stock_quantity} dona* ${stockStatus}\n` +
      `${product.description ? `\n📝 ${product.description}\n` : ''}`;

    bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, ...keyboard });
  }

  if (data.startsWith('add_')) {
    const productId = parseInt(data.replace('add_', ''));
    const product = await getProduct(productId);
    if (!product) {
      bot.answerCallbackQuery(query.id, { text: 'Mahsulot topilmadi', show_alert: true });
      return;
    }

    if (product.stock_quantity <= 0) {
      bot.answerCallbackQuery(query.id, { text: '❌ Bu mahsulot tugagan!', show_alert: true });
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
    inlineButtons.push([{ text: '❌ Bekor qilish', callback_data: `prod_${product.id}` }]);

    bot.editMessageText(
      `🛒 *${product.name}* savatga qo'shilmoqda\n\n` +
      `💰 Narxi: *${formatCurrency(product.selling_price)}*\n` +
      `📦 Mavjud: *${product.stock_quantity} dona*\n\n` +
      `Necha dona kerak?`,
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineButtons } }
    );
  }

  if (data.startsWith('qty_')) {
    const qty = parseInt(data.replace('qty_', ''));
    const product = session.currentProduct;

    if (!product) {
      bot.answerCallbackQuery(query.id, { text: 'Xatolik yuz berdi', show_alert: true });
      return;
    }

    if (qty > product.stock_quantity) {
      bot.answerCallbackQuery(query.id, { text: `❌ Faqat ${product.stock_quantity} dona qoldi!`, show_alert: true });
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

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Davom etish', callback_data: 'products_all' }],
          [{ text: '📋 Savatni ko\'rish', callback_data: 'view_cart' }],
          [{ text: '✅ Zakazni tasdiqlash', callback_data: 'confirm_order' }],
          [{ text: '⬅️ Bosh sahifa', callback_data: 'start' }],
        ],
      },
    };

    bot.editMessageText(
      `✅ *${product.name}* savatga qo'shildi!\n\n` +
      `🛒 Savatdagi mahsulotlar: *${session.cart.length} ta*\n` +
      `💰 Jami: *${formatCurrency(cartTotal)}*\n\n` +
      `Yana mahsulot qo'shmoqchimisiz yoki zakazni tasdiqlaysizmi?`,
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...keyboard }
    );
  }

  if (data === 'view_cart') {
    showCart(chatId, query.message.message_id);
  }

  if (data === 'confirm_order') {
    if (session.cart.length === 0) {
      bot.answerCallbackQuery(query.id, { text: 'Savat bo\'sh!', show_alert: true });
      return;
    }

    const { text, total } = buildOrderSummaryText(session.cart);

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Zakazni tasdiqlash', callback_data: 'final_confirm' }],
          [{ text: '🗑️ Savatni tozalash', callback_data: 'clear_cart' }],
          [{ text: '⬅️ Orqaga', callback_data: 'view_cart' }],
        ],
      },
    };

    bot.editMessageText(
      text + `\n\n` +
      `👤 Buyurtmachi: *${username ? `@${username}` : firstName || 'Noma\'lum'}*\n\n` +
      `✅ Tasdiqlaysizmi?`,
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...keyboard }
    );
  }

  if (data === 'final_confirm') {
    if (session.cart.length === 0) {
      bot.answerCallbackQuery(query.id, { text: 'Savat bo\'sh!', show_alert: true });
      return;
    }

    try {
      const { text, total } = buildOrderSummaryText(session.cart);
      const { sale, invoiceNumber } = await createOrder(chatId, username, firstName, session.cart, total);

      const adminText =
        `🔔 *YANGI ZAKAZ!*\n\n` +
        `${text}\n` +
        `👤 Buyurtmachi: *${username ? `@${username}` : firstName || 'Noma\'lum'}*\n` +
        `🆔 Chat ID: \`${chatId}\`\n` +
        `📋 Invoice: \`${invoiceNumber}\`\n` +
        `⏰ Vaqt: ${new Date().toLocaleString('uz-UZ')}\n`;

      if (ADMIN_CHAT_ID) {
        bot.sendMessage(ADMIN_CHAT_ID, adminText, { parse_mode: 'Markdown' }).catch(() => {});
      }

      clearSession(chatId);

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛍️ Yangi zakaz', callback_data: 'start' }],
          ],
        },
      };

      bot.editMessageText(
        `✅ *Zakaz muvaffaqiyatli qabul qilindi!*\n\n` +
        `${text}\n` +
        `📋 Invoice: \`${invoiceNumber}\`\n\n` +
        `📞 Bog'lanish: @${ADMIN_USERNAME}\n\n` +
        `Rahmat! Yana xizmatingizdamiz! 🙏`,
        { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...keyboard }
      );
    } catch (error) {
      console.error('Order error:', error);
      bot.editMessageText('❌ Zakaz berishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.', {
        chat_id: chatId, message_id: query.message.message_id,
        reply_markup: { inline_keyboard: [[{ text: '⬅️ Bosh sahifa', callback_data: 'start' }]] }
      });
    }
  }

  if (data === 'clear_cart') {
    session.cart = [];
    session.step = 'idle';
    bot.editMessageText('🗑️ Savat tozalandi.', {
      chat_id: chatId, message_id: query.message.message_id,
      reply_markup: { inline_keyboard: [[{ text: '⬅️ Bosh sahifa', callback_data: 'start' }]] }
    });
  }

  if (data === 'search') {
    session.step = 'awaiting_search';
    bot.editMessageText(
      '🔍 *Mahsulot qidirish*\n\n' +
      'Mahsulot nomini yozing:',
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '⬅️ Orqaga', callback_data: 'back_main' }]] }
      }
    );
  }

  if (data.startsWith('remove_')) {
    const productId = parseInt(data.replace('remove_', ''));
    session.cart = session.cart.filter(i => i.product_id !== productId);
    showCart(chatId, query.message.message_id);
  }

  if (data === 'order_minus_') {
    if (session.cart.length > 0) {
      const last = session.cart[session.cart.length - 1];
      if (last.quantity > 1) {
        last.quantity--;
        last.subtotal = last.quantity * last.price;
      } else {
        session.cart.pop();
      }
    }
    showCart(chatId, query.message.message_id);
  }

  if (data === 'check_stock') {
    const { rows: products } = await getProducts();
    const lowStock = products.filter(p => p.stock_quantity <= p.minimum_stock && p.stock_quantity > 0);
    const outOfStock = products.filter(p => p.stock_quantity === 0);

    let text = '📊 *Zaxira holati:*\n\n';
    text += `✅ Mavjud: *${products.length - lowStock.length - outOfStock.length}* ta\n`;
    text += `⚠️ Kam qoldi: *${lowStock.length}* ta\n`;
    text += `❌ Tugagan: *${outOfStock.length}* ta\n\n`;

    if (outOfStock.length > 0) {
      text += `❌ *Tugagan mahsulotlar:*\n`;
      outOfStock.forEach(p => { text += `  • ${p.name}\n`; });
      text += '\n';
    }
    if (lowStock.length > 0) {
      text += `⚠️ *Kam qolgan mahsulotlar:*\n`;
      lowStock.forEach(p => { text += `  • ${p.name} (${p.stock_quantity} qoldi)\n`; });
    }

    bot.editMessageText(text, {
      chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '⬅️ Orqaga', callback_data: 'back_main' }]] }
    });
  }
});

function showProductsList(chatId, messageId, products, title) {
  if (products.length === 0) {
    bot.editMessageText('Bu kategoriyada mahsulotlar yo\'q. 😔', {
      chat_id: chatId, message_id: messageId,
      reply_markup: { inline_keyboard: [[{ text: '⬅️ Orqaga', callback_data: 'products_all' }]] }
    });
    return;
  }

  const buttons = [];
  for (let i = 0; i < products.length; i += 2) {
    const row = [];
    const p1 = products[i];
    const stock1 = p1.stock_quantity > 0 ? '✅' : '❌';
    row.push({ text: `${stock1} ${p1.name} - ${formatCurrency(p1.selling_price)}`, callback_data: `prod_${p1.id}` });
    if (products[i + 1]) {
      const p2 = products[i + 1];
      const stock2 = p2.stock_quantity > 0 ? '✅' : '❌';
      row.push({ text: `${stock2} ${p2.name} - ${formatCurrency(p2.selling_price)}`, callback_data: `prod_${p2.id}` });
    }
    buttons.push(row);
  }
  buttons.push([{ text: '⬅️ Orqaga', callback_data: 'products_all' }]);

  const listText = products.map((p, i) => {
    const stock = p.stock_quantity > 0 ? `📦 ${p.stock_quantity}` : '❌ Tugagan';
    return `${i + 1}. ${p.name} - ${formatCurrency(p.selling_price)} (${stock})`;
  }).join('\n');

  bot.editMessageText(
    `📋 *${title}* (${products.length} ta)\n\n` +
    `${listText}\n\n` +
    `Mahsulotni tanlang:`,
    { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } }
  );
}

function showCart(chatId, messageId) {
  const session = getSession(chatId);

  if (session.cart.length === 0) {
    bot.editMessageText('🛒 *Savatingiz bo\'sh*\n\nMahsulot tanlash uchun "Mahsulotlar ro\'yxati" tugmasini bosing.', {
      chat_id: chatId, message_id: messageId, parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Mahsulotlar', callback_data: 'products_all' }],
          [{ text: '⬅️ Bosh sahifa', callback_data: 'start' }],
        ],
      },
    });
    return;
  }

  const buttons = session.cart.map(item => [
    { text: `🗑️ ${item.name} (${item.quantity} dona)`, callback_data: `remove_${item.product_id}` }
  ]);

  const total = session.cart.reduce((sum, i) => sum + i.subtotal, 0);

  let cartText = '🛒 *Savatingiz:*\n\n';
  session.cart.forEach((item, i) => {
    cartText += `${i + 1}. *${item.name}*\n`;
    cartText += `   ${item.quantity} x ${formatCurrency(item.price)} = *${formatCurrency(item.subtotal)}*\n\n`;
  });
  cartText += `💰 *Jami: ${formatCurrency(total)}*\n`;
  cartText += `📦 *Mahsulotlar: ${session.cart.length} ta*\n`;

  buttons.push([{ text: '✅ Zakazni tasdiqlash', callback_data: 'confirm_order' }]);
  buttons.push([{ text: '🗑️ Savatni tozalash', callback_data: 'clear_cart' }]);
  buttons.push([{ text: '⬅️ Orqaga', callback_data: 'start' }]);

  bot.editMessageText(cartText, {
    chat_id: chatId, message_id: messageId, parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: buttons },
  });
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const session = getSession(chatId);

  if (text && text.startsWith('/')) return;

  if (session.step === 'awaiting_search' && text) {
    const { rows: products } = await searchProducts(text);
    session.step = 'idle';

    if (products.length === 0) {
      bot.sendMessage(chatId, `🔍 "${text}" bo'yicha hech narsa topilmadi.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛍️ Barcha mahsulotlar', callback_data: 'products_all' }],
            [{ text: '⬅️ Bosh sahifa', callback_data: 'start' }],
          ],
        },
      });
      return;
    }

    const buttons = products.map(p => {
      const stock = p.stock_quantity > 0 ? '✅' : '❌';
      return [{ text: `${stock} ${p.name} - ${formatCurrency(p.selling_price)}`, callback_data: `prod_${p.id}` }];
    });
    buttons.push([{ text: '⬅️ Orqaga', callback_data: 'back_main' }]);

    bot.sendMessage(chatId, `🔍 "${text}" bo'yicha *${products.length}* ta mahsulot topildi:`, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons },
    });
  }

  if (session.step === 'awaiting_quantity' && text) {
    const qty = parseInt(text);
    const product = session.currentProduct;

    if (!product || isNaN(qty) || qty <= 0) {
      bot.sendMessage(chatId, '❌ Iltimos, son kiriting (masalan: 3)');
      return;
    }

    if (qty > product.stock_quantity) {
      bot.sendMessage(chatId, `❌ Kechirasiz, faqat *${product.stock_quantity}* dona qoldi.`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: `${product.stock_quantity} dona`, callback_data: `qty_${product.stock_quantity}` }],
            [{ text: '⬅️ Orqaga', callback_data: `prod_${product.id}` }],
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

    bot.sendMessage(chatId,
      `✅ *${product.name}* (${qty} dona) savatga qo'shildi!\n\n` +
      `🛒 Savatdagi mahsulotlar: *${session.cart.length} ta*\n` +
      `💰 Jami: *${formatCurrency(cartTotal)}*\n`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛍️ Yana mahsulot', callback_data: 'products_all' }],
            [{ text: '📋 Savatni ko\'rish', callback_data: 'view_cart' }],
            [{ text: '✅ Zakazni tasdiqlash', callback_data: 'confirm_order' }],
            [{ text: '⬅️ Bosh sahifa', callback_data: 'start' }],
          ],
        },
      }
    );
  }
});

bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from?.username;

  if (username !== ADMIN_USERNAME) {
    bot.sendMessage(chatId, '❌ Sizda bu buyruqni bajarish huquqi yo\'q.');
    return;
  }

  try {
    const { rows: recentSales } = await db.query(
      `SELECT s.*, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count 
       FROM sales s WHERE s.status = 'completed' ORDER BY s.created_at DESC LIMIT 10`
    );

    if (recentSales.length === 0) {
      bot.sendMessage(chatId, '📋 Hozircha zakazlar yo\'q.');
      return;
    }

    let text = '📋 *Oxirgi 10 ta zakaz:*\n\n';
    recentSales.forEach((sale, i) => {
      text += `${i + 1}. \`${sale.invoice_number}\`\n`;
      text += `   👤 ${sale.customer_name || 'Noma\'lum'}\n`;
      text += `   💰 ${formatCurrency(sale.total_amount)}\n`;
      text += `   📅 ${new Date(sale.created_at).toLocaleString('uz-UZ')}\n\n`;
    });

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Xatolik yuz berdi.');
  }
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `📚 *Yordam*\n\n` +
    `/start - Botni ishga tushirish\n` +
    `/orders - Oxirgi zakazlar (faqat admin)\n` +
    `/help - Bu yordam\n\n` +
    `🛒 Bot orqali mahsulotlarni ko'rishingiz va zakaz qilishingiz mumkin.\n\n` +
    `📞 Admin: @${ADMIN_USERNAME}`,
    { parse_mode: 'Markdown' }
  );
});

console.log('🤖 Telegram bot ishga tushdi!');
console.log(`👤 Admin: @${ADMIN_USERNAME}`);
console.log(`🔗 Bot: https://t.me/foodsPOS_bot`);
