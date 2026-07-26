const Database = require('better-sqlite3');
const db = new Database('C:/Users/SHAX/Desktop/poss/backend/pos_database.db');
db.pragma('foreign_keys = ON');
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
const prodCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
console.log('Before seed - categories:', catCount, 'products:', prodCount);
if (catCount === 0) {
  db.prepare("INSERT INTO categories (name, description, sort_order) VALUES ('Ichimliklar', 'Ichimliklar', 1)").run();
  db.prepare("INSERT INTO categories (name, description, sort_order) VALUES ('Taomlar', 'Asosiy taomlar', 2)").run();
  db.prepare("INSERT INTO categories (name, description, sort_order) VALUES ('Desert', 'Shirinliklar', 3)").run();
  console.log('Categories seeded: 3');
}
if (prodCount === 0) {
  const cats = db.prepare('SELECT id FROM categories').all();
  db.prepare("INSERT INTO products (name, product_code, category_id, purchase_price, selling_price, stock_quantity, minimum_stock, unit, barcode, status) VALUES ('Coca-Cola 0.5L', 'PRD-001', ?, 5000, 8000, 50, 10, 'dona', 'BC-001', 'active')").run(cats[0].id);
  db.prepare("INSERT INTO products (name, product_code, category_id, purchase_price, selling_price, stock_quantity, minimum_stock, unit, barcode, status) VALUES ('Big Mac', 'PRD-002', ?, 15000, 25000, 100, 20, 'dona', 'BC-002', 'active')").run(cats[1].id);
  db.prepare("INSERT INTO products (name, product_code, category_id, purchase_price, selling_price, stock_quantity, minimum_stock, unit, barcode, status) VALUES ('Cheesecake', 'PRD-003', ?, 8000, 15000, 30, 5, 'dona', 'BC-003', 'active')").run(cats[2].id);
  console.log('Products seeded: 3');
}
const aC = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
const aP = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
console.log('After seed - categories:', aC, 'products:', aP);
db.close();