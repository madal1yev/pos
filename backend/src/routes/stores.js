const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

const countsSelect = `
  (SELECT COUNT(*) FROM users u WHERE u.store_id = s.id) as user_count,
  (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id) as product_count,
  (SELECT COUNT(*) FROM sales sa WHERE sa.store_id = s.id) as sales_count
`;

// Barcha do'konlar (admin) yoki faqat o'z do'koni (admin bo'lmagan)
router.get('/', async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const where = isAdmin ? '' : 'WHERE s.id = $1';
    const params = isAdmin ? [] : [req.user.store_id];

    const storesResult = await db.query(
      `SELECT s.id, s.name, s.created_at, ${countsSelect}
       FROM stores s ${where}
       ORDER BY s.id`,
      params
    );

    // Do'konlarga bog'langan foydalanuvchilar (faqat ko'rish uchun)
    const usersResult = await db.query(
      `SELECT u.id, u.name, u.account_id, u.store_id, r.name as role
       FROM users u LEFT JOIN roles r ON u.role_id = r.id
       ${isAdmin ? '' : 'WHERE u.store_id = $1'}
       ORDER BY u.name`,
      isAdmin ? [] : [req.user.store_id]
    );

    const stores = storesResult.rows.map((s) => ({
      ...s,
      users: usersResult.rows.filter((u) => parseInt(u.store_id, 10) === parseInt(s.id, 10)),
    }));

    res.json({ stores, all: isAdmin });
  } catch (error) {
    next(error);
  }
});

// Yangi do'kon yaratish (admin)
router.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: "Do'kon nomi shart" });
    if (name.length > 100) return res.status(400).json({ error: "Do'kon nomi juda uzun" });

    const dup = await db.query('SELECT id FROM stores WHERE LOWER(name) = LOWER($1)', [name]);
    if (dup.rows.length > 0) {
      return res.status(400).json({ error: "Bunday nomli do'kon allaqachon mavjud" });
    }

    const created = await db.query('INSERT INTO stores (name) VALUES ($1) RETURNING id, name, created_at', [name]);
    const store = created.rows[0];

    // Har bir do'kon uchun alohida sozlamalar qatori (do'kon nomi, valyuta va h.k.)
    try {
      await db.query(
        `INSERT INTO settings (store_name, currency, currency_symbol, tax_percentage, low_stock_threshold, store_id)
         VALUES ($1, 'UZS', $2, 0, 10, $3)`,
        [name, "so'm", store.id]
      );
    } catch (e) { /* sozlamalar qatorisiz ham ishlaydi */ }

    res.status(201).json({ store });
  } catch (error) {
    next(error);
  }
});

// Do'kon nomini o'zgartirish (admin)
router.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: "Do'kon nomi shart" });

    const existing = await db.query('SELECT id FROM stores WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Do'kon topilmadi" });

    const dup = await db.query('SELECT id FROM stores WHERE LOWER(name) = LOWER($1) AND id != $2', [name, req.params.id]);
    if (dup.rows.length > 0) return res.status(400).json({ error: "Bunday nomli do'kon allaqachon mavjud" });

    const updated = await db.query('UPDATE stores SET name = $1 WHERE id = $2 RETURNING id, name', [name, req.params.id]);
    // Sozlamalardagi do'kon nomini ham yangilaymiz
    try {
      await db.query('UPDATE settings SET store_name = $1 WHERE store_id = $2', [name, req.params.id]);
    } catch (e) { /* settings bo'lmasa e'tiborsiz */ }

    res.json({ store: updated.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Do'konni o'chirish (admin) — faqat BO'SH do'kon
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await db.query('SELECT id FROM stores WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Do'kon topilmadi" });

    const users = await db.query('SELECT COUNT(*) as cnt FROM users WHERE store_id = $1', [id]);
    if (parseInt(users.rows[0].cnt, 10) > 0) {
      return res.status(400).json({ error: "Do'konda foydalanuvchilar bor — avval ularni boshqa do'konga ko'chiring" });
    }

    const products = await db.query('SELECT COUNT(*) as cnt FROM products WHERE store_id = $1', [id]);
    const sales = await db.query('SELECT COUNT(*) as cnt FROM sales WHERE store_id = $1', [id]);
    if (parseInt(products.rows[0].cnt, 10) > 0 || parseInt(sales.rows[0].cnt, 10) > 0) {
      return res.status(400).json({ error: "Do'konda mahsulot yoki savdolar bor — o'chirib bo'lmaydi" });
    }

    const total = await db.query('SELECT COUNT(*) as cnt FROM stores');
    if (parseInt(total.rows[0].cnt, 10) <= 1) {
      return res.status(400).json({ error: "Oxirgi do'konni o'chirib bo'lmaydi" });
    }

    await db.query('DELETE FROM settings WHERE store_id = $1', [id]);
    await db.query('DELETE FROM stores WHERE id = $1', [id]);

    res.json({ message: "Do'kon o'chirildi" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
