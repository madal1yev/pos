const { chromium } = require('playwright');
const http = require('http');

const BASE_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;
const failList = [];
let AUTH_TOKEN = '';

function ok(condition, msg) {
  if (condition) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; failList.push(msg); console.error(`  ❌ FAIL: ${msg}`); }
}

function api(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${path}`);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const data = body ? JSON.stringify(body) : null;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request(url, { method, headers }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(buf) }); }
        catch(e) { resolve({ status: res.statusCode, data: buf }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function login() {
  console.log('\n🔐 Test: Login');
  const res = await api('POST', '/auth/login', { email: 'admin@pos.uz', password: 'password' });
  ok(res.status === 200, `Login returns 200 (got ${res.status}): ${JSON.stringify(res.data).slice(0, 100)}`);
  if (res.data && res.data.token) {
    AUTH_TOKEN = res.data.token;
    ok(true, `Got auth token`);
    return true;
  }
  ok(false, 'No token received');
  return false;
}

async function testHealthEndpoint() {
  console.log('\n📋 Test: Health endpoint');
  const res = await api('GET', '/health');
  ok(res.status === 200, `Health returns 200`);
  ok(res.data.status === 'ok', `Status is ok`);
  ok(res.data.db === 'connected', `DB connected`);
  ok(res.data.bots === 'active', `Bots active`);
}

async function testCategoriesAPI() {
  console.log('\n📂 Test: Categories API');
  const res = await api('GET', '/categories', null, AUTH_TOKEN);
  ok(res.status === 200, `Categories returns 200 (got ${res.status})`);
  const cats = res.data?.categories || res.data;
  if (Array.isArray(cats)) {
    ok(cats.length >= 5, `Found ${cats.length} categories`);
    return cats;
  }
  ok(false, `Categories not array: ${JSON.stringify(res.data).slice(0, 100)}`);
  return [];
}

async function testProductsAPI() {
  console.log('\n📦 Test: Products API');
  const res = await api('GET', '/products', null, AUTH_TOKEN);
  ok(res.status === 200, `Products returns 200 (got ${res.status})`);
  const products = res.data?.products || res.data;
  if (Array.isArray(products)) {
    ok(products.length >= 10, `Found ${products.length} products`);
    const active = products.filter(p => p.status === 'active');
    ok(active.length >= 10, `Active products: ${active.length}`);
    for (const p of active.slice(0, 3)) {
      ok(p.name && p.selling_price > 0, `Product: ${p.name} = ${p.selling_price}`);
    }
    return active;
  }
  ok(false, `Products not array: ${JSON.stringify(res.data).slice(0, 100)}`);
  return [];
}

async function testSalesAPI(products) {
  console.log('\n🧾 Test: Sales API');
  const listRes = await api('GET', '/sales', null, AUTH_TOKEN);
  ok(listRes.status === 200, `Sales list returns 200 (got ${listRes.status})`);

  if (products.length > 0) {
    const p = products[0];
    const createRes = await api('POST', '/sales', {
      customer_name: 'Playwright Test',
      payment_method: 'cash',
      received_amount: p.selling_price * 2,
      notes: 'Playwright test sale',
      items: [{ product_id: p.id, quantity: 2, price: p.selling_price }],
    }, AUTH_TOKEN);
    ok(createRes.status === 201, `Create sale returns 201 (got ${createRes.status})`);
    if (createRes.data?.sale) {
      const saleId = createRes.data.sale.id;
      const detailRes = await api('GET', `/sales/${saleId}`, null, AUTH_TOKEN);
      ok(detailRes.status === 200, `Sale detail returns 200`);
      ok(detailRes.data?.sale?.items?.length >= 1, `Sale has items`);
      return createRes.data.sale;
    }
  }
  return null;
}

async function testSettingsAPI() {
  console.log('\n⚙️  Test: Settings API');
  const res = await api('GET', '/settings', null, AUTH_TOKEN);
  ok(res.status === 200, `Settings returns 200 (got ${res.status})`);
}

async function testDashboardAPI() {
  console.log('\n📊 Test: Dashboard API');
  const res = await api('GET', '/dashboard', null, AUTH_TOKEN);
  ok(res.status === 200, `Dashboard returns 200 (got ${res.status})`);
}

async function testFrontend(page) {
  console.log('\n🌐 Test: Frontend');
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  ok(response.status() === 200, `Frontend loads: ${response.status()}`);
  
  const title = await page.title();
  ok(title.length > 0, `Page title: "${title}"`);
  
  const body = await page.textContent('body');
  ok(body.length > 0, `Page has content (${body.length} chars)`);
}

async function testFrontendLogin(page) {
  console.log('\n🔐 Test: Frontend Login');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  
  const inputs = await page.locator('input').count();
  ok(inputs >= 2, `Login form has ${inputs} input fields`);
  
  const buttons = await page.locator('button').count();
  ok(buttons >= 1, `Login form has ${buttons} button(s)`);
}

async function testBotFlow() {
  console.log('\n🤖 Test: Bot order flow (DB simulation)');
  const db = require('./src/config/db');
  
  const cats = await db.query(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count FROM categories c ORDER BY c.name`);
  ok(cats.rows.length >= 5, `Categories: ${cats.rows.length}`);
  
  const activeCats = cats.rows.filter(c => c.product_count > 0);
  ok(activeCats.length >= 5, `Active categories: ${activeCats.length}`);
  
  const firstCat = activeCats[0];
  const prods = await db.query(`SELECT * FROM products WHERE status = 'active' AND category_id = $1 ORDER BY name`, [firstCat.id]);
  ok(prods.rows.length > 0, `Products in "${firstCat.name}": ${prods.rows.length}`);
  
  const searchRes = await db.query(
    `SELECT p.* FROM products p WHERE p.status = 'active' AND (p.name LIKE $1 OR p.barcode LIKE $1 OR p.product_code LIKE $1 OR p.description LIKE $1) LIMIT 10`,
    ['%guruch%']
  );
  ok(searchRes.rows.length > 0, `Search "guruch": ${searchRes.rows.length}`);
  
  const product = prods.rows[0];
  const invoiceNumber = `PW-${Date.now().toString().slice(-8)}`;
  const total = product.selling_price * 2;
  
  const sale = await db.query(
    `INSERT INTO sales (invoice_number, customer_name, total_amount, payment_method, received_amount, change_amount, notes, delivery_address) VALUES ($1, $2, $3, 'telegram', $3, 0, $4, $5) RETURNING *`,
    [invoiceNumber, '@pw_test', total, 'Telegram zakaz', 'Toshkent']
  );
  ok(sale.rows.length > 0, `Order created: ${invoiceNumber}`);
  ok(sale.rows[0].total_amount === total, `Total correct: ${sale.rows[0].total_amount}`);
  ok(sale.rows[0].received_amount === total, `Received correct: ${sale.rows[0].received_amount}`);
  ok(sale.rows[0].delivery_address === 'Toshkent', `Address saved`);
  
  await db.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5)`, [sale.rows[0].id, product.id, 2, product.selling_price, total]);
  
  const newStock = Math.max(0, product.stock_quantity - 2);
  const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
  await db.query(`UPDATE products SET stock_quantity = $1, updated_at = ${nowExpr} WHERE id = $2`, [newStock, product.id]);
  
  const updated = await db.query(`SELECT stock_quantity FROM products WHERE id = $1`, [product.id]);
  ok(updated.rows[0].stock_quantity === newStock, `Stock: ${product.stock_quantity} -> ${newStock}`);
  
  await db.query(`INSERT INTO inventory_logs (product_id, change_type, quantity, previous_stock, new_stock, note, created_by) VALUES ($1, 'sale', $2, $3, $4, $5, 1)`, [product.id, -2, product.stock_quantity, newStock, `Test: ${invoiceNumber}`]);
  
  await db.query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [product.stock_quantity, product.id]);
  await db.query('DELETE FROM sale_items WHERE sale_id = $1', [sale.rows[0].id]);
  await db.query('DELETE FROM sales WHERE id = $1', [sale.rows[0].id]);
  console.log('  🧹 Cleaned up');
}

async function testKlentBot() {
  console.log('\n🔔 Test: KlentBot');
  const klentBot = require('./src/klentBot');
  const adminId = klentBot.getAdminChatId();
  ok(adminId !== null && adminId > 0, `Admin chat ID: ${adminId}`);
}

async function testMapParamsFix() {
  console.log('\n🔧 Test: mapParams fix');
  const db = require('./src/config/db');
  
  const repeated = await db.query(
    `SELECT p.* FROM products p WHERE p.status = 'active' AND (p.name LIKE $1 OR p.barcode LIKE $1 OR p.product_code LIKE $1 OR p.description LIKE $1) LIMIT 5`,
    ['%a%']
  );
  ok(repeated.rows.length > 0, `Repeated $1 works: ${repeated.rows.length} results`);
  
  const doubled = await db.query(
    `INSERT INTO sales (invoice_number, customer_name, total_amount, payment_method, received_amount, change_amount, notes, delivery_address) VALUES ($1, $2, $3, 'telegram', $3, 0, $4, $5) RETURNING *`,
    ['MP-TEST', 'MapParams Test', 99999, 'test notes', 'test addr']
  );
  ok(doubled.rows.length > 0, `INSERT with $3 twice works`);
  ok(doubled.rows[0].total_amount === 99999, `total_amount = 99999`);
  ok(doubled.rows[0].received_amount === 99999, `received_amount = 99999 (was broken before)`);
  ok(doubled.rows[0].notes === 'test notes', `notes = "test notes" (was getting address before)`);
  ok(doubled.rows[0].delivery_address === 'test addr', `delivery_address = "test addr" (was NULL before)`);
  
  await db.query('DELETE FROM sales WHERE id = $1', [doubled.rows[0].id]);
}

async function runAllTests() {
  console.log('🧪 ==============================');
  console.log('🧪 COMPREHENSIVE TEST SUITE');
  console.log('🧪 ==============================');
  
  let browser;
  try {
    const loggedIn = await login();
    
    if (loggedIn) {
      await testHealthEndpoint();
      const cats = await testCategoriesAPI();
      const products = await testProductsAPI();
      await testSalesAPI(products);
      await testSettingsAPI();
      await testDashboardAPI();
    }
    
    await testMapParamsFix();
    await testBotFlow();
    await testKlentBot();
    
    browser = await chromium.launch({ headless: true });
    const page = await browser.newContext().then(c => c.newPage());
    await testFrontend(page);
    await testFrontendLogin(page);
    await browser.close();
    
  } catch (err) {
    console.error('\n💥 ERROR:', err.message);
    failed++;
    failList.push(err.message);
    if (browser) await browser.close().catch(() => {});
  }
  
  console.log('\n🧪 ==============================');
  console.log(`🧪 RESULTS: ${passed} passed, ${failed} failed`);
  if (failList.length > 0) {
    console.log('❌ FAILURES:');
    failList.forEach(e => console.log(`   - ${e}`));
  }
  console.log('🧪 ==============================');
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
