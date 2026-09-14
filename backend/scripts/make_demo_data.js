// Demo ma'lumotlar — reklama video ekranlari uchun (real API orqali yaratiladi)
const BASE = 'http://127.0.0.1:5000/api';
let TOKEN = '';

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 400)}`);
  return data;
}

async function main() {
  // Login
  const login = await api('POST', '/auth/login', { email: 'admin@pos.uz', password: 'admin123' });
  TOKEN = login.token;
  console.log('Login OK:', login.user.email);

  // 1. Categories
  const cats = [
    'Sut mahsulotlari', 'Non mahsulotlari', "Go'sht mahsulotlari",
    'Mevalar', 'Sabzavotlar', 'Ichimliklar', 'Gazaklar', 'Don va quruq mahsulotlar',
  ];
  const catIds = {};
  for (const c of cats) {
    try {
      const r = await api('POST', '/categories', { name: c });
      catIds[c] = r.category?.id;
      console.log('Category:', c, '-> id', catIds[c]);
    } catch (e) {
      // kategoriya bor bo'lsa, izlab olib qo'yamiz
      const list = await api('GET', '/categories');
      const found = (list.categories || list).find((x) => x.name === c);
      if (found) { catIds[c] = found.id; console.log('Category (existing):', c, '-> id', found.id); }
      else throw e;
    }
  }

  // 2. Products: [name, category, price, stock, min, unit]
  const products = [
    ['Sut 1L', 'Sut mahsulotlari', 12000, 50, 10, 'pcs'],
    ['Qatiq 500g', 'Sut mahsulotlari', 9500, 40, 8, 'pcs'],
    ['Pishloq 400g', 'Sut mahsulotlari', 28000, 3, 5, 'pcs'],
    ['Non (qora)', 'Non mahsulotlari', 5000, 100, 20, 'pcs'],
    ['Lavash', 'Non mahsulotlari', 6500, 60, 10, 'pcs'],
    ["Tovuq go'shti 1kg", "Go'sht mahsulotlari", 42000, 8, 5, 'kg'],
    ['Olma 1kg', 'Mevalar', 14000, 80, 15, 'kg'],
    ['Banana 1kg', 'Mevalar', 22000, 3, 8, 'kg'],
    ['Pomidor 1kg', 'Sabzavotlar', 10000, 70, 15, 'kg'],
    ['Bodring 1kg', 'Sabzavotlar', 9000, 60, 10, 'kg'],
    ['Suv 1.5L', 'Ichimliklar', 4000, 120, 30, 'bottle'],
    ['Sharbat 1L', 'Ichimliklar', 12000, 35, 8, 'bottle'],
    ['Chips 100g', 'Gazaklar', 8500, 45, 10, 'pcs'],
    ['Pechenye 200g', 'Gazaklar', 7000, 0, 10, 'pcs'],
    ['Guruch 1kg', 'Don va quruq mahsulotlar', 16000, 90, 20, 'kg'],
    ['Makaron 500g', 'Don va quruq mahsulotlar', 8500, 65, 10, 'pcs'],
  ];
  const productIds = [];
  let codeNum = 100;
  for (const [name, cat, price, stock, min, unit] of products) {
    const code = `PRD-${codeNum++}`;
    const barcode = `478000${String(100000 + codeNum)}`;
    const r = await api('POST', '/products', {
      name, category_id: catIds[cat], product_code: code, barcode,
      selling_price: price, purchase_price: Math.round(price * 0.7),
      stock_quantity: stock, minimum_stock: min, unit,
    });
    productIds.push(r.product?.id);
    console.log('Product:', name, '-> id', r.product?.id);
  }

  // 3. Customers (qarzdorlar)
  const customers = [
    ['Aziz Karimov', '+998 90 123 45 67', 340000],
    ['Dilnoza Rahimova', '+998 91 234 56 78', 120000],
    ['Botir Toshmatov', '+998 93 345 67 89', 85000],
  ];
  for (const [name, phone, debt] of customers) {
    await api('POST', '/customers', { name, phone, debt });
    console.log('Customer:', name, 'qarz', debt);
  }

  // 4. Bugungi sotuvlar (real API orqali — zaxira ham kamayadi)
  const todaySales = [
    { items: [[0, 2], [3, 3]], payment: 'cash', received: 39000 },   // Sut x2 + Non x3
    { items: [[10, 2], [12, 1]], payment: 'card' },                    // Suv x2 + Chips
    { items: [[5, 1], [6, 2], [7, 1]], payment: 'cash', received: 100000 }, // Tovuq + Olma x2 + Banana
    { items: [[1, 2], [14, 1]], payment: 'card' },                     // Qatiq x2 + Guruch
    { items: [[2, 1], [15, 2]], payment: 'cash', received: 45000 },    // Pishloq + Makaron x2
    { items: [[8, 3], [9, 2]], payment: 'card' },                      // Pomidor x3 + Bodring x2
  ];
  for (let i = 0; i < todaySales.length; i++) {
    const s = todaySales[i];
    const itemList = s.items.map(([idx, qty]) => {
      const p = products[idx];
      return { product_id: productIds[idx], quantity: qty, price: p[2] };
    });
    const total = itemList.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const received = s.payment === 'cash' ? (s.received || total) : total;
    const r = await api('POST', '/sales', {
      payment_method: s.payment, received_amount: received, items: itemList,
    });
    console.log('Sale #' + (i + 1), r.sale?.invoice_number, 'total', total);
  }

  // 5. O'tgan haftadagi sotuvlar (chart uchun — to'g'ridan-to'g'ri SQL)
  const db = require('../src/config/db');
  const storeRes = await db.query('SELECT id FROM stores ORDER BY id LIMIT 1', []);
  const storeId = storeRes.rows[0]?.id;
  console.log('Store id:', storeId);

  // Mavjud product id'larini va narxlarini olamiz
  const prodRes = await db.query('SELECT id, selling_price FROM products ORDER BY id', []);
  const prods = prodRes.rows;

  let inv = 1;
  const dayAgo = (days, hour) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, Math.floor(Math.random() * 50), 0, 0);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  };

  const paymentPool = ['cash', 'cash', 'cash', 'card', 'card'];
  const salesPerDay = [4, 3, 5, 3, 4, 2]; // 1..6 kun oldin
  for (let d = 1; d <= 6; d++) {
    const count = salesPerDay[d - 1];
    for (let k = 0; k < count; k++) {
      const nItems = 1 + Math.floor(Math.random() * 3);
      const chosen = [];
      for (let j = 0; j < nItems; j++) {
        const p = prods[Math.floor(Math.random() * prods.length)];
        const qty = 1 + Math.floor(Math.random() * 3);
        const existing = chosen.find((c) => c.pid === p.id);
        if (existing) existing.qty += qty;
        else chosen.push({ pid: p.id, price: p.selling_price, qty });
      }
      const total = chosen.reduce((sum, c) => sum + c.price * c.qty, 0);
      const payment = paymentPool[Math.floor(Math.random() * paymentPool.length)];
      const received = payment === 'cash' ? total : total;
      const created = dayAgo(d, 9 + Math.floor(Math.random() * 10));
      const dateStr = created.slice(0, 10).replace(/-/g, '');
      const invoice = `INV-DEMO-${dateStr}-${String(inv++).padStart(4, '0')}`;
      const saleIns = await db.query(
        `INSERT INTO sales (user_id, customer_name, total_amount, payment_method, received_amount, change_amount, invoice_number, store_id, created_at)
         VALUES (1, $1, $2, $3, $4, 0, $5, $6, $7) RETURNING id`,
        [payment === 'cash' ? null : 'Karta bilan', total, payment, received, invoice, storeId, created]
      );
      const saleId = saleIns.rows[0].id;
      for (const c of chosen) {
        await db.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, price, discount, tax, subtotal)
           VALUES ($1, $2, $3, $4, 0, 0, $5)`,
          [saleId, c.pid, c.qty, c.price, c.price * c.qty]
        );
      }
      console.log('Backdated sale', invoice, created, total);
    }
  }

  console.log('✅ Demo data tayyor!');
  process.exit(0);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
