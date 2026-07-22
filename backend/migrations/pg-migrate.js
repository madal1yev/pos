const db = require('../src/config/db');

const pgSchema = `
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  product_code VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(50),
  qr_code TEXT,
  brand VARCHAR(100),
  purchase_price DECIMAL(12,2) DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'pcs',
  image_url TEXT,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(100),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) DEFAULT 'cash',
  received_amount DECIMAL(12,2) DEFAULT 0,
  change_amount DECIMAL(12,2) DEFAULT 0,
  invoice_number VARCHAR(50) UNIQUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);

CREATE TABLE IF NOT EXISTS inventory_logs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  change_type VARCHAR(30) NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER DEFAULT 0,
  new_stock INTEGER DEFAULT 0,
  note TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(100),
  address TEXT,
  type VARCHAR(20) DEFAULT 'regular',
  tax_id VARCHAR(50),
  notes TEXT,
  total_purchases DECIMAL(14,2) DEFAULT 0,
  total_paid DECIMAL(14,2) DEFAULT 0,
  debt DECIMAL(14,2) DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(100),
  address TEXT,
  contact_person VARCHAR(200),
  tax_id VARCHAR(50),
  notes TEXT,
  total_purchases DECIMAL(14,2) DEFAULT 0,
  total_paid DECIMAL(14,2) DEFAULT 0,
  debt DECIMAL(14,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  store_name VARCHAR(100) DEFAULT 'My Store',
  store_address TEXT,
  store_phone VARCHAR(30),
  store_email VARCHAR(100),
  logo_url TEXT,
  currency VARCHAR(10) DEFAULT 'USD',
  currency_symbol VARCHAR(10) DEFAULT '$',
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  receipt_header TEXT,
  receipt_footer TEXT,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

const seedData = `
INSERT INTO roles (name) VALUES ('admin'), ('cashier') ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (store_name, store_address, store_phone, currency, currency_symbol, tax_percentage, receipt_footer)
SELECT 'Oziq-ovqat Do''koni', 'Toshkent shahri, Bunyodkor ko''chasi 15', '+998 90 123 45 67', 'UZS', 'so''m', 0, 'Xaridingiz uchun rahmat! Yana kutamiz!'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

INSERT INTO users (name, email, password, role_id)
SELECT 'Admin', 'admin@pos.uz', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@pos.uz');

UPDATE users SET email = 'admin@pos.uz' WHERE email = 'admin@pos.com' AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@pos.uz');

INSERT INTO categories (name, description) VALUES
('Sut mahsulotlari', 'Sut, qatiq, pishloq va boshqa sut mahsulotlari'),
('Non mahsulotlari', 'Non, bulochka, keks va boshqa non mahsulotlari'),
('Go''sht mahsulotlari', 'Qo''y, mol, tovuq go''shtlari va yarim tayyor mahsulotlar'),
('Mevalar', 'Yangi mevalar va rezavorlar'),
('Sabzavotlar', 'Yangi sabzavotlar va ko''katlar'),
('Ichimliklar', 'Suv, sharbat, gazak va boshqa ichimliklar'),
('Gazaklar', 'Chipslar, pechenye, konfet va boshqa gazaklar'),
('Don va quruq mahsulotlar', 'Guruch, makaron, un va boshqa quruq mahsulotlar'),
('Ziravorlar', 'Tuz, qalampir, sos va boshqa ziravorlar'),
('Muzlatilgan mahsulotlar', 'Muzlatilgan go''sht, baliq va tayyor ovqatlar')
ON CONFLICT DO NOTHING;

-- Products are not auto-seeded in production to prevent data loss on restart.
-- Run `node migrations/seed.js` manually to seed sample products.
`;

async function migrate() {
  const isPG = !!process.env.DATABASE_URL;
  console.log(`Running migration (${isPG ? 'PostgreSQL' : 'SQLite'})...`);

  try {
    if (isPG) {
      const statements = pgSchema.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          await db.query(stmt + ';');
        }
      }
      console.log('Schema created. Seeding data...');
      const seedStatements = seedData.split(';').filter(s => s.trim());
      for (const stmt of seedStatements) {
        if (stmt.trim()) {
          try { await db.query(stmt + ';'); } catch (e) {
            if (e.code === '23505') continue;
            console.error('Seed warning:', e.message);
          }
        }
      }
    } else {
      const sqliteDb = require('../src/config/db');
      const statements = require('fs').readFileSync(require('path').join(__dirname, 'run.js'), 'utf8');
      const migrationMatch = statements.match(/const migrationSQL = `([\s\S]*?)`;/);
      const seedMatch = statements.match(/const seedData = `([\s\S]*?)`;/);
      if (migrationMatch) {
        const stmts = migrationMatch[1].split(';').filter(s => s.trim());
        for (const s of stmts) { if (s.trim()) sqliteDb.sqlite.exec(s + ';'); }
      }
      if (seedMatch) {
        sqliteDb.sqlite.exec(seedMatch[1]);
      }
    }
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
