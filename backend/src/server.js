require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const salesRoutes = require('./routes/sales');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const dashboardRoutes = require('./routes/dashboard');
const bulkRoutes = require('./routes/bulk');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (Render/load balancer)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bulk', bulkRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./config/db');
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// Auto-migrate on startup in production
if (process.env.NODE_ENV === 'production') {
  (async () => {
    try {
      console.log('Running production migration...');
      const { execSync } = require('child_process');
      execSync('node migrations/pg-migrate.js', { cwd: path.join(__dirname, '../..'), stdio: 'inherit' });
    } catch (err) {
      console.error('Auto-migration warning:', err.message);
    }
  })();
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`POS Server running on port ${PORT}`);

  if (process.env.TELEGRAM_BOT_TOKEN) {
    try {
      require('./bot');
      console.log('Telegram bot started alongside server');
    } catch (err) {
      console.error('Bot startup error:', err.message);
    }
  }
});

module.exports = app;
