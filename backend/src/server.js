require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const os = require('os');

const fs = require('fs');

// Lokal network IP manzilini aniqlash (192.168.x.x yoki 10.x.x.x)
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let fallback = '127.0.0.1';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // WiFi IP ni afzal ko'ramiz (192.168.x.x yoki 10.x.x.x)
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          return iface.address;
        }
        if (fallback === '127.0.0.1') {
          fallback = iface.address;
        }
      }
    }
  }
  return fallback;
}

const LOCAL_IP = getLocalIP();

// Uploads papkasi
const uploadsDir = path.join(__dirname, process.env.VERCEL ? '/tmp/uploads' : '../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 uploads papkasi yaratildi: ' + uploadsDir);
  }
} catch (err) {
  console.log('⚠️ uploads papkasini yaratib bo\'lmadi:', err.message);
}

const klentBot = require('./klentBot');
const { startBackupScheduler } = require('./services/backupScheduler');

// Botlarni yuklaymiz
let botModule = null;
try {
  botModule = require('./bot');
  console.log('🤖 Bot module yuklandi');
} catch (err) {
  console.log('⚠️ Bot module yuklanmadi:', err.message);
}

// Backup scheduler (faqat lokal, Vercel emas)
if (!process.env.VERCEL) {
  try {
    startBackupScheduler();
  } catch (err) {
    console.log('⚠️ Backup scheduler yuklanmadi:', err.message);
  }
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
const userRoutes = require('./routes/users');
const shiftRoutes = require('./routes/shifts');
const refundRoutes = require('./routes/refunds');
const discountRoutes = require('./routes/discounts');
const auditRoutes = require('./routes/audit');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS - local tarmoq va Vercel uchun
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  `http://${LOCAL_IP}:5000`,
  `http://${LOCAL_IP}:5173`,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}:\d+$/,
];
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(u => allowedOrigins.push(u.trim()));
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
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

// API Routes
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
app.use('/api/users', userRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/inventory', inventoryRoutes);

// Data overview endpoint — barcha buyurtmalar va mahsulotlarni ko'rish
app.get('/api/data/overview', async (req, res) => {
  try {
    const db = require('./config/db');
    const sales = await db.query(
      `SELECT s.*, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
       FROM sales s ORDER BY s.created_at DESC LIMIT 50`
    );
    const products = await db.query(
      `SELECT p.*, c.name as category_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.product_id = p.id) as times_sold
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.name`
    );
    const categories = await db.query(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count
       FROM categories c ORDER BY c.name`
    );
    const stats = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM sales) as total_sales,
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales) as total_revenue,
        (SELECT COUNT(*) FROM products WHERE status = 'active') as active_products,
        (SELECT COUNT(*) FROM products WHERE stock_quantity <= minimum_stock AND status = 'active') as low_stock
       FROM sqlite_master WHERE type='table' LIMIT 1`
    );
    res.json({
      sales: sales.rows,
      products: products.rows,
      categories: categories.rows,
      stats: stats.rows[0] || {},
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bot webhook routes
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

// Health check + network info
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./config/db');
    await db.query('SELECT 1');
    res.json({
      status: 'ok',
      db: 'connected',
      local_ip: LOCAL_IP,
      port: PORT,
      network_url: `http://${LOCAL_IP}:${PORT}`,
      bots: botModule ? 'active' : 'inactive',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      db: 'disconnected',
      local_ip: LOCAL_IP,
      port: PORT,
      network_url: `http://${LOCAL_IP}:${PORT}`,
      error: err.message,
    });
  }
});

// Auto-migrate on startup
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  console.log(`Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}`);
}

// ============================================================
// FRONTEND STATIK FAYLLARNI SERVE QILISH (faqat local)
// ============================================================
// Vercel serverless da frontend serve qilmaymiz
if (!process.env.VERCEL) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    console.log('🌐 Frontend dist papkasi topildi, statik serve qilinadi');
    app.use(express.static(frontendDist));

    // Barcha non-API so'rovlarni index.html ga yo'naltirish (SPA)
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return;
      res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
        if (err) {
          if (!res.headersSent) {
            res.status(404).json({ error: 'Frontend not built yet. Run: cd frontend && npm run build' });
          }
        }
      });
    });
  } else {
    console.log('⚠️ Frontend dist topilmadi. Avval "cd frontend && npm run build" qiling.');
    console.log(`   Telefon ulanishi: http://${LOCAL_IP}:${PORT}`);
    app.get('/', (req, res) => {
      res.send(`
        <html>
        <head><title>POS Tizimi</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>🚀 POS Tizimi Ishga Tushdi!</h1>
          <p>Backend API: <code>/api</code></p>
          <p>Local IP: <strong>${LOCAL_IP}</strong></p>
          <p>Port: <strong>${PORT}</strong></p>
          <p style="color:orange;">⚠️ Frontend build qilinmagan. Serverda "cd frontend && npm run build" ni bajaring.</p>
          <hr>
          <p>Telefondan ulanish: <strong>http://${LOCAL_IP}:${PORT}</strong></p>
        </body>
        </html>
      `);
    });
  }
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ============================================================
// SERVER START
// ============================================================
if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║         🚀 POS TIZIMI ISHGA TUSHDI          ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Lokal:    http://localhost:${PORT}            ║`);
    console.log(`║  Tarmoq:   http://${LOCAL_IP}:${PORT}           ║`);
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Telefon:  http://${LOCAL_IP}:${PORT}           ║`);
    console.log('║  Admin:    admin@pos.uz / admin123          ║');
    console.log('╚══════════════════════════════════════════════╝');

    try {
      klentBot.startPolling();
      console.log('🤖 @klentlarchek_bot polling boshlandi');
    } catch (err) {
      console.log('⚠️ Botlarni ishga tushirishda xatolik:', err.message);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} band! Boshqa dastun ishlayapti (PM2?). Bu dastur to'xtatilgan.`);
      process.exit(1);
    } else {
      console.error('❌ Server xatosi:', err.message);
    }
  });
}

module.exports = app;
