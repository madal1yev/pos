require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const fs = require('fs');

// Vercel serverless da /tmp dan foydalanamiz
const uploadsDir = path.join(__dirname, process.env.VERCEL ? '/tmp/uploads' : '../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 uploads papkasi yaratildi: ' + uploadsDir);
  }
} catch (err) {
  console.log('⚠️ uploads papkasini yaratib bo\'lmadi (Vercel serverless):', err.message);
}

const klentBot = require('./klentBot');

// Botlarni har doim yuklaymiz (Vercel webhook uchun handlerlar kerak)
let botModule = null;
try {
  botModule = require('./bot');
  console.log('🤖 Bot module yuklandi (webhook rejimi: ' + (process.env.VERCEL ? 'Vercel' : 'Polling') + ')');
} catch (err) {
  console.log('⚠️ Bot module yuklanmadi:', err.message);
}

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const salesRoutes = require('./routes/sales');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const dashboardRoutes = require('./routes/dashboard');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const bulkRoutes = require('./routes/bulk');
const uploadRoutes = require('./routes/upload');

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
    ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// Rate limiting - higher limit for production
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5000 : 1000,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files for uploads
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/upload', uploadRoutes);

// Bot webhook routes (Vercel serverless da ishlaydi)
app.post('/api/bot-webhook', (req, res) => {
  try {
    const { bot } = botModule || {};
    if (bot && req.body) {
      bot.processUpdate(req.body);
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('Bot webhook error:', err.message);
    res.status(200).send('OK');
  }
});

app.post('/api/klent-webhook', async (req, res) => {
  try {
    const update = req.body;
    if (update?.message) {
      await klentBot.handleMessage(update.message);
    }
    if (update?.callback_query) {
      await klentBot.handleCallback(update.callback_query);
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('Klent webhook error:', err.message);
    res.status(200).send('OK');
  }
});

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

// Auto-migrate on startup in production (Vercel serverless da api/index.js ishlaydi)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  console.log(`Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite (⚠️ ma\'lumotlar saqlanmaydi!)'}`);
  (async () => {
    try {
      console.log('Running production migration...');
      const { execSync } = require('child_process');
      execSync('node migrations/pg-migrate.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    } catch (err) {
      console.error('Auto-migration xatosi:', err.message);
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

// Vercel serverless uchun: app.listen() ni chaqirmaymiz
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`POS Server running on port ${PORT}`);
    try {
      klentBot.startPolling();
      console.log('🤖 @klentlarchek_bot polling boshlandi');
    } catch (err) {
      console.log('⚠️ Botlarni ishga tushirishda xatolik:', err.message);
    }
  });
}

module.exports = app;
