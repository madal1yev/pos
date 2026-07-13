const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateToken = (userId, remember) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
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

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const result = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, result.rows[0].password);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = $1, updated_at = datetime(\'now\') WHERE id = $2', [hashed, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
