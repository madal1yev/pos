const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendAdminBotMessage } = require('../utils/adminTelegram');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Login Akkaunt ID formatini tekshirish (M-123456 yoki 123456)
const normalizeAccountId = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim().toUpperCase();
  const digits = trimmed.replace(/^M-?/, '').replace(/\D/g, '');
  return digits ? `M-${digits}` : null;
};

// Login himoyasi: har bir IP + Akkaunt ID uchun 3 marta xato → 30 soniya blok.
// (express-rate-limit dan tashqari — bu aniq 3/30 qoida, o'zbekcha ogohlantirish bilan)
const loginAttempts = new Map(); // key: `${ip}:${accountId}` → { count, lockedUntil }
const MAX_ATTEMPTS = 3;
const LOCK_SECONDS = 30;

const getLockKey = (ip, accountId) => `${ip}:${accountId}`;

function checkLockout(key) {
  const rec = loginAttempts.get(key);
  if (rec && rec.lockedUntil && Date.now() < rec.lockedUntil) {
    return Math.ceil((rec.lockedUntil - Date.now()) / 1000);
  }
  if (rec && rec.lockedUntil && Date.now() >= rec.lockedUntil) {
    loginAttempts.delete(key); // blok muddati tugadi — urinishlar nollanadi
  }
  return 0;
}

function recordFailedAttempt(key) {
  let rec = loginAttempts.get(key);
  if (!rec) rec = { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCK_SECONDS * 1000;
    rec.count = 0; // blokdan keyin yangidan sanash
    loginAttempts.set(key, rec);
    return { locked: true, retryAfter: LOCK_SECONDS };
  }
  loginAttempts.set(key, rec);
  return { locked: false, attemptsLeft: MAX_ATTEMPTS - rec.count };
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
    const { account_id, password, remember } = req.body;
    const { ip, userAgent } = getClientInfo(req);

    const accountId = normalizeAccountId(account_id);
    if (!accountId) {
      return res.status(400).json({ error: 'Akkaunt ID kiritilishi shart (masalan: M-123456)' });
    }

    // 3 marta xato → 30 soniya blok (IP + Akkaunt ID bo'yicha)
    const lockKey = getLockKey(ip, accountId);
    const retryAfter = checkLockout(lockKey);
    if (retryAfter > 0) {
      return res.status(429).json({
        error: `Ko'p marta xato kiritildi! ${retryAfter} soniyadan keyin qayta urinib ko'ring.`,
        retry_after: retryAfter,
      });
    }

    // Bitta helper — noto'g'ri ID ham, noto'g'ri parol ham bir xil hisoblanadi,
    // shunda mavjud bo'lmagan ID bilan ham kira olmaydi va 3-xatoda bloklanadi.
    const failLogin = async (userId, storeId, botText) => {
      try {
        await db.query(
          `INSERT INTO login_audit_logs (user_id, email, status, ip_address, user_agent, store_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, accountId, 'failed', ip, userAgent, storeId]
        );
      } catch (e) { /* audit jadvali bo'lmasa ham login javobi qaytishi shart */ }
      sendAdminBotMessage(botText);
      const attempt = recordFailedAttempt(lockKey);
      if (attempt.locked) {
        return res.status(429).json({
          error: `3 marta xato kiritildi! 30 soniya kuting, keyin qayta urinib ko'ring.`,
          retry_after: attempt.retryAfter,
        });
      }
      return res.status(401).json({
        error: `Akkaunt ID yoki parol xato. ${attempt.attemptsLeft} ta urinish qoldi.`,
        attempts_left: attempt.attemptsLeft,
      });
    };

    const result = await db.query(
      `SELECT u.*, r.name as role_name FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.account_id = $1`,
      [accountId]
    );

    if (result.rows.length === 0) {
      return failLogin(
        null,
        null,
        `⚠️ LOGIN FAILED (mavjud bo'lmagan ID)\n🆔 ID: ${accountId}\n🕐 ${new Date().toISOString()}\n📍 IP: ${ip}`
      );
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Akkaunt faol emas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return failLogin(
        user.id,
        user.store_id,
        `⚠️ LOGIN FAILED (xato parol)\n🆔 ID: ${accountId} (${user.name})\n🕐 ${new Date().toISOString()}\n📍 IP: ${ip}`
      );
    }

    // Muvaffaqiyatli kirish — urinishlar hisoblagichi nollanadi
    loginAttempts.delete(lockKey);

    await db.query(
      `INSERT INTO login_audit_logs (user_id, email, status, ip_address, user_agent, store_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, accountId, 'success', ip, userAgent, user.store_id]
    );

    sendAdminBotMessage(
      `🔐 LOGIN\n🆔 ID: ${accountId}\n👤 ${user.name}\n🏪 Do'kon #${user.store_id || '-'}\n🕐 ${new Date().toISOString()}\n📍 IP: ${ip}\n📱 ${userAgent.slice(0, 60)}`
    );

    const token = generateToken(user.id, remember);

    res.json({
      token,
      user: {
        id: user.id,
        account_id: user.account_id,
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

// O'CHIRILGAN: interfeys/API orqali yangi do'kon akkaunti ochish taqiqlangan.
// Yangi akkaunt faqat tizim egasi tomonidan backend/users-import.json +
// `npm run import-users` orqali qo'shiladi.
exports.createStoreAccount = async (req, res) => {
  return res.status(403).json({ error: "Bu funksiya o'chirilgan. Yangi akkaunt faqat tizim egasi tomonidan qo'shiladi." });
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        account_id: req.user.account_id,
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
