const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// Get all users (admin only)
// — admin BUTUN tizimdagi foydalanuvchilarni ko'radi (do'konlarni boshqarish uchun),
//   admin bo'lmaganlar faqat o'z do'konidagilarni.
router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.is_active, u.avatar_url, u.pin, u.created_at, u.store_id,
        u.account_id, r.name as role_name, r.id as role_id, st.name as store_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN stores st ON u.store_id = st.id
       ORDER BY u.created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get single user
router.get('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.is_active, u.avatar_url, u.pin, u.created_at, u.role_id, u.store_id, u.account_id,
        r.name as role_name, st.name as store_name
       FROM users u LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN stores st ON u.store_id = st.id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (
      result.rows.length === 0 ||
      (req.user.role !== 'admin' && result.rows[0].store_id !== req.user.store_id)
    ) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update user (admin or self)
router.put('/:id', async (req, res, next) => {
  try {
    // Only admin can edit other users, user can edit themselves
    if (req.user.role !== 'admin' && parseInt(req.user.id) !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Faqat admin boshqa foydalanuvchilarni tahrirlay oladi' });
    }

    const { name, email, password, role_id, is_active, pin, store_id } = req.body;

    // Check if user exists (admin boshqa do'konlarda ham ko'ra oladi)
    const existing = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (
      existing.rows.length === 0 ||
      (req.user.role !== 'admin' && existing.rows[0].store_id !== req.user.store_id)
    ) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Do'konni ko'chirish — faqat admin
    if (store_id !== undefined && store_id !== null && req.user.role === 'admin') {
      const targetStore = await db.query('SELECT id FROM stores WHERE id = $1', [parseInt(store_id, 10)]);
      if (targetStore.rows.length === 0) {
        return res.status(400).json({ error: 'Bunday do\'kon mavjud emas' });
      }
    }

    // Check unique email
    if (email && email !== existing.rows[0].email) {
      const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.params.id]);
      if (emailCheck.rows.length > 0) return res.status(400).json({ error: 'Bu email allaqachon mavjud' });
    }

    // PIN uniqueness check
    if (pin && pin !== existing.rows[0].pin) {
      const pinCheck = await db.query('SELECT id FROM users WHERE pin = $1 AND id != $2', [String(pin), req.params.id]);
      if (pinCheck.rows.length > 0) return res.status(400).json({ error: 'Bu PIN allaqachon boshqa foydalanuvchida' });
    }

    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    let query = `UPDATE users SET
      name = COALESCE($1, name),
      email = COALESCE($2, email),
      updated_at = ${nowExpr}`;
    let params = [name || null, email || null];
    let paramCount = 2;

    // Password update
    if (password) {
      paramCount++;
      const hashed = await bcrypt.hash(password, 10);
      query += `, password = $${paramCount}`;
      params.push(hashed);
    }

    // PIN update
    if (pin !== undefined && pin !== null) {
      paramCount++;
      query += `, pin = $${paramCount}`;
      params.push(String(pin) || null);
    }

    // Role update (only admin)
    if (role_id !== undefined && req.user.role === 'admin') {
      paramCount++;
      query += `, role_id = $${paramCount}`;
      params.push(role_id);
    }

    // is_active update (only admin)
    if (is_active !== undefined && req.user.role === 'admin') {
      paramCount++;
      query += `, is_active = $${paramCount}`;
      params.push(is_active ? true : false);
    }

    // Do'konga ko'chirish (faqat admin)
    if (store_id !== undefined && store_id !== null && req.user.role === 'admin') {
      paramCount++;
      query += `, store_id = $${paramCount}`;
      params.push(parseInt(store_id, 10));
    }

    paramCount++;
    query += ` WHERE id = $${paramCount} RETURNING id, name, email, is_active`;
    params.push(req.params.id);

    const result = await db.query(query, params);

    res.json({
      user: result.rows[0],
      message: "Foydalanuvchi ma'lumotlari yangilandi"
    });
  } catch (error) {
    next(error);
  }
});

// Get all roles
router.get('/roles/list', authorize('admin'), async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM roles ORDER BY id');
    res.json({ roles: result.rows });
  } catch (error) {
    next(error);
  }
});

// Create new user — default: admin o'z do'koniga qo'shadi,
// store_id berilsa (faqat admin) shu do'konga qo'shiladi
router.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role_id, pin, store_id } = req.body;
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });
    if (pin) {
      const pinCheck = await db.query('SELECT id FROM users WHERE pin = $1', [String(pin)]);
      if (pinCheck.rows.length > 0) return res.status(400).json({ error: 'Bu PIN allaqachon boshqa foydalanuvchida' });
    }

    let targetStoreId = req.user.store_id;
    if (store_id !== undefined && store_id !== null) {
      const s = await db.query('SELECT id FROM stores WHERE id = $1', [parseInt(store_id, 10)]);
      if (s.rows.length === 0) return res.status(400).json({ error: "Bunday do'kon mavjud emas" });
      targetStoreId = parseInt(store_id, 10);
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password, role_id, pin, store_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email`,
      [name, email, hashed, role_id || 2, pin ? String(pin) : null, targetStoreId]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === parseInt(req.user.id)) {
      return res.status(400).json({ error: "O'zingizni o'chira olmaysiz" });
    }
    const existing = await db.query('SELECT id, store_id FROM users WHERE id = $1', [req.params.id]);
    if (
      existing.rows.length === 0 ||
      (req.user.role !== 'admin' && existing.rows[0].store_id !== req.user.store_id)
    ) {
      return res.status(404).json({ error: 'User not found' });
    }
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'Foydalanuvchi ochirildi' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
