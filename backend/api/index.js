// Vercel serverless entry point for POS Backend
// PostgreSQL orqali ulanish (DATABASE_URL env var)

async function runMigration() {
  try {
    const db = require('../src/config/db');
    console.log('🔧 Running inline PostgreSQL migration...');

    // Schema
    await db.query(`CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
      avatar_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await db.query(`CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id)`);
    await db.query(`CREATE TABLE IF NOT EXISTS products (
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
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`);
    await db.query(`CREATE TABLE IF NOT EXISTS sales (
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
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number)`);
    await db.query(`CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      price DECIMAL(12,2) NOT NULL,
      discount DECIMAL(12,2) DEFAULT 0,
      tax DECIMAL(12,2) DEFAULT 0,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)`);
    await db.query(`CREATE TABLE IF NOT EXISTS inventory_logs (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      change_type VARCHAR(30) NOT NULL,
      quantity INTEGER NOT NULL,
      previous_stock INTEGER DEFAULT 0,
      new_stock INTEGER DEFAULT 0,
      note TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id)`);
    await db.query(`CREATE TABLE IF NOT EXISTS customers (
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
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)`);
    await db.query(`CREATE TABLE IF NOT EXISTS suppliers (
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
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name)`);
    await db.query(`CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      store_name VARCHAR(100) DEFAULT 'My Store',
      store_address TEXT,
      store_phone VARCHAR(30),
      store_email VARCHAR(100),
      logo_url TEXT,
      admin_telegram TEXT DEFAULT '',
      currency VARCHAR(10) DEFAULT 'UZS',
      currency_symbol VARCHAR(10) DEFAULT 'so\'m',
      tax_percentage DECIMAL(5,2) DEFAULT 0,
      receipt_header TEXT,
      receipt_footer TEXT,
      low_stock_threshold INTEGER DEFAULT 10,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);

    // Seed data
    try { await db.query(`INSERT INTO roles (name) VALUES ('admin'), ('cashier') ON CONFLICT (name) DO NOTHING`); } catch (e) { console.log('Seed roles:', e.message); }
    try {
      const settingsExists = await db.query(`SELECT id FROM settings LIMIT 1`);
      if (settingsExists.rows.length === 0) {
        await db.query(`INSERT INTO settings (store_name, store_phone, currency, currency_symbol, tax_percentage, receipt_footer)
          VALUES ('Oziq-ovqat Do\'koni', '+998 90 123 45 67', 'UZS', 'so\'m', 0, 'Xaridingiz uchun rahmat! Yana kutamiz!')`);
      }
    } catch (e) { console.log('Seed settings:', e.message); }
    try {
      const adminExists = await db.query(`SELECT id FROM users WHERE email = 'admin@pos.uz' LIMIT 1`);
      if (adminExists.rows.length === 0) {
        await db.query(`INSERT INTO users (name, email, password, role_id)
          VALUES ('Admin', 'admin@pos.uz', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1)`);
      }
    } catch (e) { console.log('Seed admin:', e.message); }

    console.log('✅ Inline migration completed!');
  } catch (err) {
    console.error('⚠️ Migration xatosi:', err.message);
  }
}

// Migrationni ishga tushiramiz (Promise ni saqlaymiz, keyin request handler kutadi)
const migrationPromise = process.env.DATABASE_URL ? runMigration() : Promise.resolve();

let app;

try {
  app = require('../src/server');
} catch (err) {
  console.error('❌ Server yuklanmadi:', err.message);
  const express = require('express');
  app = express();
  app.get('/api/health', (req, res) => {
    res.json({ status: 'error', message: err.message });
  });
  app.all('*', (req, res) => {
    res.status(503).json({ error: 'Backend not available', message: err.message });
  });
}

// Har bir requestda migration tugaganligini tekshiramiz
const originalHandler = app;
module.exports = async (req, res) => {
  try {
    await migrationPromise;
  } catch (e) {
    // migration failed, continue anyway
  }
  return originalHandler(req, res);
};
