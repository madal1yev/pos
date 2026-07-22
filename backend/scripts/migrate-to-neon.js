// SQLite dan Neon PostgreSQL ga ma'lumotlarni ko'chirish scripti
// Ishga tushirish: DATABASE_URL=postgresql://... node scripts/migrate-to-neon.js
require('dotenv').config();
const path = require('path');
const Database = require('better-sqlite3');

const SQLITE_PATH = path.join(__dirname, '../pos_database.db');
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL) {
  console.error('❌ DATABASE_URL env var kerak!');
  console.error('Ishga tushirish: DATABASE_URL=postgresql://... node scripts/migrate-to-neon.js');
  process.exit(1);
}

async function migrate() {
  console.log('🔌 SQLite dan o\'qish...');
  const sqlite = new Database(SQLITE_PATH);

  console.log('🔌 PostgreSQL ga ulanish...');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: PG_URL,
    ssl: { rejectUnauthorized: false },
  });
  const pg = {
    query: (sql, params) => pool.query(sql, params),
  };

  let totalMigrated = 0;

  // 1. Kategoriyalarni ko'chirish
  try {
    const categories = sqlite.prepare('SELECT * FROM categories ORDER BY id').all();
    console.log(`📦 Kategoriyalar: ${categories.length} ta`);
    for (const cat of categories) {
      try {
        // Check if already exists by name
        const exists = await pg.query('SELECT id FROM categories WHERE name = $1', [cat.name]);
        if (exists.rows.length === 0) {
          await pg.query(
            `INSERT INTO categories (id, name, description, parent_id, sort_order, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [cat.id, cat.name, cat.description || null, cat.parent_id || null, cat.sort_order || 0, cat.created_at || new Date(), cat.updated_at || cat.created_at || new Date()]
          );
          totalMigrated++;
        }
      } catch (e) {
        // If ID conflict, try without ID
        try {
          const exists = await pg.query('SELECT id FROM categories WHERE name = $1', [cat.name]);
          if (exists.rows.length === 0) {
            await pg.query(
              `INSERT INTO categories (name, description, parent_id, sort_order)
               VALUES ($1, $2, $3, $4)`,
              [cat.name, cat.description || null, cat.parent_id || null, cat.sort_order || 0]
            );
            totalMigrated++;
          }
        } catch (e2) {
          console.log(`  ⚠️ Kategoriya "${cat.name}" o'tkazib yuborildi: ${e2.message}`);
        }
      }
    }
    // Reset sequences
    await pg.query("SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))");
  } catch (e) {
    console.error('❌ Kategoriyalarni ko\'chirishda xato:', e.message);
  }

  // 2. Mahsulotlarni ko'chirish
  try {
    const products = sqlite.prepare('SELECT * FROM products ORDER BY id').all();
    console.log(`📦 Mahsulotlar: ${products.length} ta`);
    for (const prod of products) {
      try {
        const exists = await pg.query('SELECT id FROM products WHERE product_code = $1', [prod.product_code]);
        if (exists.rows.length === 0) {
          await pg.query(
            `INSERT INTO products (id, category_id, name, product_code, barcode, qr_code, brand, purchase_price, selling_price, stock_quantity, minimum_stock, unit, image_url, description, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [prod.id, prod.category_id || null, prod.name, prod.product_code, prod.barcode || null, prod.qr_code || null, prod.brand || null,
             prod.purchase_price || 0, prod.selling_price || 0, prod.stock_quantity || 0, prod.minimum_stock || 0, prod.unit || 'pcs',
             prod.image_url || null, prod.description || null, prod.status || 'active', prod.created_at || new Date(), prod.updated_at || prod.created_at || new Date()]
          );
          totalMigrated++;
        }
      } catch (e) {
        try {
          const exists = await pg.query('SELECT id FROM products WHERE product_code = $1', [prod.product_code]);
          if (exists.rows.length === 0) {
            await pg.query(
              `INSERT INTO products (category_id, name, product_code, barcode, brand, purchase_price, selling_price, stock_quantity, minimum_stock, unit, description, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [prod.category_id || null, prod.name, prod.product_code, prod.barcode || null, prod.brand || null,
               prod.purchase_price || 0, prod.selling_price || 0, prod.stock_quantity || 0, prod.minimum_stock || 0, prod.unit || 'pcs',
               prod.description || null, prod.status || 'active']
            );
            totalMigrated++;
          }
        } catch (e2) {
          console.log(`  ⚠️ Mahsulot "${prod.name}" o'tkazib yuborildi: ${e2.message}`);
        }
      }
    }
    await pg.query("SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))");
  } catch (e) {
    console.error('❌ Mahsulotlarni ko\'chirishda xato:', e.message);
  }

  // 3. Mijozlarni ko'chirish
  try {
    const customers = sqlite.prepare('SELECT * FROM customers ORDER BY id').all();
    console.log(`📦 Mijozlar: ${customers.length} ta`);
    for (const c of customers) {
      try {
        const exists = await pg.query('SELECT id FROM customers WHERE id = $1', [c.id]);
        if (exists.rows.length === 0) {
          await pg.query(
            `INSERT INTO customers (id, name, phone, email, address, type, tax_id, notes, total_purchases, total_paid, debt, bonus_points, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [c.id, c.name, c.phone || null, c.email || null, c.address || null, c.type || 'regular', c.tax_id || null, c.notes || null,
             c.total_purchases || 0, c.total_paid || 0, c.debt || 0, c.bonus_points || 0, c.created_at || new Date(), c.updated_at || c.created_at || new Date()]
          );
          totalMigrated++;
        }
      } catch (e) {
        console.log(`  ⚠️ Mijoz "${c.name}" o'tkazib yuborildi: ${e.message}`);
      }
    }
  } catch (e) {
    console.error('❌ Mijozlarni ko\'chirishda xato:', e.message);
  }

  // 4. Yetkazib beruvchilarni ko'chirish
  try {
    const suppliers = sqlite.prepare('SELECT * FROM suppliers ORDER BY id').all();
    console.log(`📦 Yetkazib beruvchilar: ${suppliers.length} ta`);
    for (const s of suppliers) {
      try {
        const exists = await pg.query('SELECT id FROM suppliers WHERE id = $1', [s.id]);
        if (exists.rows.length === 0) {
          await pg.query(
            `INSERT INTO suppliers (id, name, phone, email, address, contact_person, tax_id, notes, total_purchases, total_paid, debt, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [s.id, s.name, s.phone || null, s.email || null, s.address || null, s.contact_person || null, s.tax_id || null, s.notes || null,
             s.total_purchases || 0, s.total_paid || 0, s.debt || 0, s.created_at || new Date(), s.updated_at || s.created_at || new Date()]
          );
          totalMigrated++;
        }
      } catch (e) {
        console.log(`  ⚠️ Yetkazib beruvchi "${s.name}" o'tkazib yuborildi: ${e.message}`);
      }
    }
  } catch (e) {
    console.error('❌ Yetkazib beruvchilarni ko\'chirishda xato:', e.message);
  }

  // 5. Savdolarni ko'chirish (sales + sale_items)
  try {
    const sales = sqlite.prepare('SELECT * FROM sales ORDER BY id').all();
    console.log(`📦 Savdolar: ${sales.length} ta`);
    for (const sale of sales) {
      try {
        const exists = await pg.query('SELECT id FROM sales WHERE id = $1', [sale.id]);
        if (exists.rows.length === 0) {
          // Debug: saqlanayotgan malumot
          if (!sale.total_amount || isNaN(sale.total_amount)) {
            console.log(`  ⚠️ Savdo #${sale.invoice_number}: total_amount=${JSON.stringify(sale.total_amount)}, notes=${JSON.stringify((sale.notes || '').slice(0,50))}`);
            // Skip this sale if total_amount is invalid
            continue;
          }
          await pg.query(
            `INSERT INTO sales (id, user_id, customer_name, total_amount, payment_method, received_amount, change_amount, invoice_number, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [sale.id, sale.user_id || null, sale.customer_name || null, parseFloat(sale.total_amount) || 0, sale.payment_method || 'cash',
             parseFloat(sale.received_amount) || 0, parseFloat(sale.change_amount) || 0, sale.invoice_number || null, sale.notes || null, sale.created_at || new Date()]
          );

          // Sale items
          const items = sqlite.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(sale.id);
          for (const item of items) {
            await pg.query(
              `INSERT INTO sale_items (id, sale_id, product_id, quantity, price, discount, tax, subtotal)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [item.id, item.sale_id, item.product_id || null, parseInt(item.quantity) || 1, parseFloat(item.price) || 0,
               parseFloat(item.discount) || 0, parseFloat(item.tax) || 0, parseFloat(item.subtotal) || 0]
            );
          }
          totalMigrated++;
        }
      } catch (e) {
        console.log(`  ⚠️ Savdo #${sale.invoice_number} o'tkazib yuborildi: ${e.message}`);
      }
    }
    await pg.query("SELECT setval('sales_id_seq', (SELECT MAX(id) FROM sales))");
    await pg.query("SELECT setval('sale_items_id_seq', (SELECT MAX(id) FROM sale_items))");
  } catch (e) {
    console.error('❌ Savdolarni ko\'chirishda xato:', e.message);
  }

  console.log(`\n✅ Migratsiya tugadi! ${totalMigrated} ta yozuv ko'chirildi.`);
  
  await pool.end();
  sqlite.close();
}

migrate().catch(err => {
  console.error('❌ Migratsiya xatosi:', err);
  process.exit(1);
});
