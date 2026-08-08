const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const ROLE_HIERARCHY = {
  admin: 100,
  manager: 80,
  stock: 60,
  cashier: 40,
  view: 20,
};

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.is_active, u.role_id, r.name as role 
       FROM users u LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid token or user inactive.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const userRole = req.user.role || 'view';
    const userLevel = ROLE_HIERARCHY[userRole] || 0;

    // Check if user's role is in the allowed list OR has higher permissions
    if (!roles.includes(userRole)) {
      // Allow if user has a higher role level than any of the required roles
      const minRequiredLevel = Math.min(...roles.map(r => ROLE_HIERARCHY[r] || 0));
      if (userLevel < minRequiredLevel) {
        return res.status(403).json({ error: 'Insufficient permissions. Required: ' + roles.join(' or ') });
      }
    }

    next();
  };
};

// Specific permission check helpers
const canManageUsers = () => authorize('admin');
const canManageProducts = () => authorize('admin', 'manager', 'stock');
const canManageSettings = () => authorize('admin');
const canViewReports = () => authorize('admin', 'manager');
const canProcessSales = () => authorize('admin', 'manager', 'cashier');
const canViewSales = () => authorize('admin', 'manager', 'cashier', 'stock');

module.exports = { auth, authorize, canManageUsers, canManageProducts, canManageSettings, canViewReports, canProcessSales, canViewSales };
