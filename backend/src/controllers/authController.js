const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// JWT_SECRET - .env dan yoki fallback (sayt sotilganda o'zgartirish kerak!)
const JWT_SECRET = process.env.JWT_SECRET || 'pos-system-2026-fallback-secret-key';

const generateToken = (userId, remember) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: remember ? '30d' : '1d',
  });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, remember } = req.body;

    const result = await db.query(
      `SELECT u.*, r.name as role_name FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, remember);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name,
        has_pin: !!user.pin,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.pinLogin = async (req, res, next) => {
  try {
    const { pin, remember } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'PIN kiritilmagan' });
    }

    const result = await db.query(
      `SELECT u.*, r.name as role_name FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.pin = $1 AND u.is_active = true`,
      [String(pin)]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'PIN xato yoki foydalanuvchi faol emas' });
    }

    const user = result.rows[0];
    const token = generateToken(user.id, remember);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name,
        has_pin: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role_id } = req.body;

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const roleId = role_id || 2;

    const result = await db.query(
      `INSERT INTO users (name, email, password, role_id) 
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role_id`,
      [name, email, hashedPassword, roleId]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: roleId === 1 ? 'admin' : 'cashier',
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    if (email) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Bu email allaqachon band' });
      }
    }

    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    const result = await db.query(
      `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), updated_at = ${nowExpr} WHERE id = $3 RETURNING id, name, email`,
      [name || req.user.name, email || req.user.email, req.user.id]
    );

    const updated = result.rows[0];
    
    // Update user in request
    req.user.name = updated.name;
    req.user.email = updated.email;
    
    res.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const result = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, result.rows[0].password);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const nowExpr = db.isSqlite ? "datetime('now')" : 'NOW()';
    const hashed = await bcrypt.hash(new_password, 10);
    await db.query(`UPDATE users SET password = $1, updated_at = ${nowExpr} WHERE id = $2`, [hashed, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
