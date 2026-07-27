const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// Get all users (admin only)
router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.is_active, u.avatar_url, u.created_at,
        r.name as role_name, r.id as role_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
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
      `SELECT u.id, u.name, u.email, u.is_active, u.avatar_url, u.created_at, u.role_id,
        r.name as role_name
       FROM users u LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
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

    const { name, email, password, role_id, is_active } = req.body;

    // Check if user exists
    const existing = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    // Check unique email
    if (email && email !== existing.rows[0].email) {
      const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.params.id]);
      if (emailCheck.rows.length > 0) return res.status(400).json({ error: 'Bu email allaqachon mavjud' });
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
      params.push(is_active ? 1 : 0);
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

// Create new user (admin only)
router.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role_id } = req.body;
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email`,
      [name, email, hashed, role_id || 2]
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
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'Foydalanuvchi ochirildi' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
