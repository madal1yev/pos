const db = require('./src/config/db');

async function check() {
  console.log('=== SOTUVLAR (Sales) ===');
  const sales = await db.query('SELECT id, invoice_number, customer_name, total_amount, payment_method, delivery_address, created_at FROM sales ORDER BY created_at DESC LIMIT 15');
  console.log('Jami sotuvlar: ' + sales.rows.length);
  sales.rows.forEach(function(s) {
    console.log('  #' + s.id + ' | ' + s.invoice_number + ' | ' + s.customer_name + ' | ' + s.total_amount + " so'm | " + s.payment_method + ' | ' + s.created_at);
  });
  
  console.log('\n=== SOTUV ITEM LARI ===');
  const items = await db.query('SELECT si.id, si.sale_id, si.product_id, si.quantity, si.price, si.subtotal, p.name as product_name FROM sale_items si LEFT JOIN products p ON si.product_id = p.id ORDER BY si.id DESC LIMIT 15');
  console.log('Jami itemlar: ' + items.rows.length);
  items.rows.forEach(function(i) {
    console.log('  sale#' + i.sale_id + ' | ' + (i.product_name || 'N/A') + ' | qty=' + i.quantity + ' | narx=' + i.price + ' | jami=' + i.subtotal);
  });

  console.log('\n=== MAHSULOTLAR ===');
  const products = await db.query('SELECT id, name, selling_price, stock_quantity, minimum_stock, status FROM products ORDER BY name');
  console.log('Jami mahsulotlar: ' + products.rows.length);
  products.rows.forEach(function(p) {
    console.log('  #' + p.id + ' | ' + p.name + ' | narx=' + p.selling_price + ' | zaxira=' + p.stock_quantity + ' | min=' + p.minimum_stock + ' | ' + p.status);
  });
}

check().catch(function(e) { console.error('ERROR:', e.message); });
