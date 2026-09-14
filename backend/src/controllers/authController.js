const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendTelegramMessage } = require('../utils/telegram');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const generateToken = (userId, remember) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: remember ? '30d' : '1d',
  });
};

const getClientInfo = (req) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return { ip, userAgent };
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, remember } = req.body;
    const { ip, userAgent } = getClientInfo(req);

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
      await db.query(
        `INSERT INTO login_audit_logs (user_id, email, status, ip_address, user_agent, store_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [null, email, 'failed', ip, userAgent, null]
      );

      sendTelegramMessage(
        `⚠️ LOGIN FAILED\n📧 Email: ${email}\n🕐 Time: ${new Date().toISOString()}\n❌ Status: Failed login attempt`
      );

      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await db.query(
      `INSERT INTO login_audit_logs (user_id, email, status, ip_address, user_agent, store_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, email, 'success', ip, userAgent, user.store_id]
    );

    sendTelegramMessage(
      `🔐 LOGIN SUCCESS\n👤 User: ${user.name} (${email})\n🕐 Time: ${new Date().toISOString()}\n📱 Device: ${userAgent.slice(0, 80)}\n✅ Status: Successful`
    );

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

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, store_name } = req.body;

    if (!store_name || !store_name.trim()) {
      return res.status(400).json({ error: "Do'kon nomi majburiy" });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Self-registration always creates a brand-new store, and the
    // registering user becomes that store's admin/owner.
    const storeResult = await db.query(
      'INSERT INTO stores (name) VALUES ($1) RETURNING id',
      [store_name.trim()]
    );
    const storeId = storeResult.rows[0].id;

    const result = await db.query(
      `INSERT INTO users (name, email, password, role_id, store_id)
       VALUES ($1, $2, $3, 1, $4) RETURNING id, name, email, role_id, store_id`,
      [name, email, hashedPassword, storeId]
    );

    const user = result.rows[0];

    sendTelegramMessage(
      `🆕 NEW ACCOUNT\n👤 User: ${name} (${email})\n🏪 Store: ${store_name.trim()}\n🕐 Time: ${new Date().toISOString()}`
    );

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin',
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
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      if (decoded?.exp) {
        await db.query(
          'INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING',
          [token, new Date(decoded.exp * 1000).toISOString()]
        );
      }
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.json({ message: 'Logged out successfully' });
  }
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
