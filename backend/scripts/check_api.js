const http = require('http');

function api(method, path, body, token) {
  return new Promise(function(resolve, reject) {
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    var data = body ? JSON.stringify(body) : null;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    var req = http.request('http://localhost:5000/api' + path, { method: method, headers: headers }, function(res) {
      var buf = '';
      res.on('data', function(c) { buf += c; });
      res.on('end', function() {
        try { resolve({ status: res.statusCode, data: JSON.parse(buf) }); }
        catch(e) { resolve({ status: res.statusCode, data: buf }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Login
  console.log('=== LOGIN ===');
  var loginRes = await api('POST', '/auth/login', { email: 'admin@pos.uz', password: 'password' });
  var token = loginRes.data.token;
  console.log('Token: ' + (token ? 'OK' : 'FAIL'));
  
  // Get sales
  console.log('\n=== SALES API ===');
  var salesRes = await api('GET', '/sales', null, token);
  console.log('Status:', salesRes.status);
  console.log('Data keys:', Object.keys(salesRes.data));
  if (salesRes.data.sales) {
    console.log('Sales count:', salesRes.data.sales.length);
    salesRes.data.sales.forEach(function(s) {
      console.log('  #' + s.id + ' | ' + s.invoice_number + ' | ' + s.customer_name + ' | ' + s.total_amount + ' so\'m | items: ' + s.item_count);
    });
  } else {
    console.log('Full response:', JSON.stringify(salesRes.data).slice(0, 300));
  }
  
  // Get products
  console.log('\n=== PRODUCTS API ===');
  var prodsRes = await api('GET', '/products', null, token);
  console.log('Status:', prodsRes.status);
  if (prodsRes.data.products) {
    console.log('Products count:', prodsRes.data.products.length);
  } else {
    console.log('Response:', JSON.stringify(prodsRes.data).slice(0, 200));
  }
  
  // Get categories
  console.log('\n=== CATEGORIES API ===');
  var catsRes = await api('GET', '/categories', null, token);
  console.log('Status:', catsRes.status);
  if (catsRes.data.categories) {
    console.log('Categories count:', catsRes.data.categories.length);
    catsRes.data.categories.forEach(function(c) {
      console.log('  ' + c.name + ' (products: ' + (c.product_count || 0) + ')');
    });
  }
  
  // Get dashboard
  console.log('\n=== DASHBOARD API ===');
  var dashRes = await api('GET', '/dashboard', null, token);
  console.log('Status:', dashRes.status);
  console.log('Data:', JSON.stringify(dashRes.data).slice(0, 300));
}

main().catch(function(e) { console.error('ERROR:', e.message); });
