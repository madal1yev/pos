const db = require('../src/config/db');

const migrationSQL = `
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  product_code TEXT UNIQUE NOT NULL,
  barcode TEXT,
  qr_code TEXT,
  brand TEXT,
  purchase_price REAL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  image_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT,
  total_amount REAL NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  received_amount REAL DEFAULT 0,
  change_amount REAL DEFAULT 0,
  invoice_number TEXT UNIQUE,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price REAL NOT NULL,
  discount REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

CREATE TABLE IF NOT EXISTS inventory_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER DEFAULT 0,
  new_stock INTEGER DEFAULT 0,
  note TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created ON inventory_logs(created_at);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_name TEXT DEFAULT 'My Store',
  store_address TEXT,
  store_phone TEXT,
  store_email TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'USD',
  currency_symbol TEXT DEFAULT '$',
  tax_percentage REAL DEFAULT 0,
  receipt_header TEXT,
  receipt_footer TEXT,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

const seedData = `
INSERT OR IGNORE INTO roles (name) VALUES ('admin'), ('cashier');

INSERT OR IGNORE INTO settings (store_name, store_address, store_phone, currency, currency_symbol, tax_percentage, receipt_footer)
VALUES ('Oziq-ovqat Do''koni', 'Toshkent shahri, Bunyodkor ko''chasi 15', '+998 90 123 45 67', 'UZS', 'so''m', 0, 'Xaridingiz uchun rahmat! Yana kutamiz!');

INSERT OR IGNORE INTO users (name, email, password, role_id)
VALUES ('Admin', 'admin@pos.uz', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

UPDATE users SET email = 'admin@pos.uz' WHERE email = 'admin@pos.com';

INSERT OR IGNORE INTO categories (name, description) VALUES
('Sut mahsulotlari', 'Sut, qatiq, pishloq va boshqa sut mahsulotlari'),
('Non mahsulotlari', 'Non, bulochka, keks va boshqa non mahsulotlari'),
('Go''sht mahsulotlari', 'Qo''y, mol, tovuq go''shtlari va yarim tayyor mahsulotlar'),
('Mevalar', 'Yangi mevalar va rezavorlar'),
('Sabzavotlar', 'Yangi sabzavotlar va ko''katlar'),
('Ichimliklar', 'Suv, sharbat, gazak va boshqa ichimliklar'),
('Gazaklar', 'Chipslar, pechenye, konfet va boshqa gazaklar'),
('Don va quruq mahsulotlar', 'Guruch, makaron, un va boshqa quruq mahsulotlar'),
('Ziravorlar', 'Tuz, qalampir, sos va boshqa ziravorlar'),
('Muzlatilgan mahsulotlar', 'Muzlatilgan go''sht, baliq va tayyor ovqatlar');

INSERT OR IGNORE INTO products (category_id, name, product_code, barcode, brand, purchase_price, selling_price, stock_quantity, minimum_stock, unit, image_url, status) VALUES
(1, 'Sut 1L', 'PRD-0001', '4780001001001', 'Kominale', 8000, 12000, 50, 10, 'pcs', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop', 'active'),
(1, 'Qatiq 500g', 'PRD-0002', '4780001001002', 'Chig''atoysut', 6000, 9500, 40, 8, 'pcs', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop', 'active'),
(1, 'Pishloq 400g', 'PRD-0003', '4780001001003', 'Kominale', 18000, 28000, 25, 5, 'pcs', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop', 'active'),
(2, 'Non (qora)', 'PRD-0004', '4780002001001', 'Non mahsulotlari', 3000, 5000, 100, 20, 'pcs', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop', 'active'),
(2, 'Lavash', 'PRD-0005', '4780002001002', 'Non mahsulotlari', 4000, 6500, 60, 10, 'pcs', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop', 'active'),
(3, 'Tovuq go''shti 1kg', 'PRD-0006', '4780003001001', 'O''zdon mahsulot', 28000, 42000, 30, 5, 'kg', 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=400&h=400&fit=crop', 'active'),
(3, 'Qiyma go''sht 500g', 'PRD-0007', '4780003001002', 'O''zdon mahsulot', 22000, 35000, 20, 5, 'pcs', 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop', 'active'),
(4, 'Olma 1kg', 'PRD-0008', '4780004001001', 'Mahalliy', 8000, 14000, 80, 15, 'kg', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop', 'active'),
(4, 'Banana 1kg', 'PRD-0009', '4780004001002', 'Import', 12000, 22000, 40, 8, 'kg', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop', 'active'),
(5, 'Pomidor 1kg', 'PRD-0010', '4780005001001', 'Mahalliy', 6000, 10000, 70, 15, 'kg', 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=400&fit=crop', 'active'),
(5, 'Bodring 1kg', 'PRD-0011', '4780005001002', 'Mahalliy', 5000, 9000, 60, 10, 'kg', 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=400&fit=crop', 'active'),
(6, 'Suv 1.5L', 'PRD-0012', '4780006001001', 'Eco Suv', 2000, 4000, 120, 30, 'bottle', 'https://images.unsplash.com/photo-1523362628745-0c100fc988a6?w=400&h=400&fit=crop', 'active'),
(6, 'Sharbat 1L', 'PRD-0013', '4780006001002', 'Nectar', 7000, 12000, 35, 8, 'bottle', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop', 'active'),
(7, 'Chips 100g', 'PRD-0014', '4780007001001', 'Lays', 5000, 8500, 45, 10, 'pcs', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop', 'active'),
(7, 'Pechenye 200g', 'PRD-0015', '4780007001002', 'Yashma', 4000, 7000, 50, 10, 'pcs', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop', 'active'),
(8, 'Guruch 1kg', 'PRD-0016', '4780008001001', 'Devizara', 10000, 16000, 90, 20, 'kg', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop', 'active'),
(8, 'Makaron 500g', 'PRD-0017', '4780008001002', 'Barilla', 5000, 8500, 65, 10, 'pcs', 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=400&fit=crop', 'active'),
(9, 'Tuz 1kg', 'PRD-0018', '4780009001001', 'Mahalliy', 2000, 3500, 100, 20, 'kg', 'https://images.unsplash.com/photo-1518110925495-5fe2c8a9f124?w=400&h=400&fit=crop', 'active'),
(9, 'Qalampir 100g', 'PRD-0019', '4780009001002', 'Mahalliy', 3000, 5500, 40, 8, 'pcs', 'https://images.unsplash.com/photo-1583119022894-919a385295e0?w=400&h=400&fit=crop', 'active'),
(10, 'Muzlatilgan baliq 500g', 'PRD-0020', '4780010001001', 'O''zbekiston Baliq', 25000, 40000, 15, 3, 'pcs', 'https://images.unsplash.com/photo-1510130113356-d4c9f0e5d6af?w=400&h=400&fit=crop', 'active');
`;

async function migrate() {
  try {
    console.log('Running migration...');
    const statements = migrationSQL.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        db.sqlite.exec(stmt + ';');
      }
    }

    console.log('Seeding data...');
    db.sqlite.exec(seedData);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
