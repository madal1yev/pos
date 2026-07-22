// Vercel serverless entry point for POS Backend
// Vercel serverless da better-sqlite3 ishlamaydi (native module)
// PostgreSQL kerak! DATABASE_URL env var orqali ulanish

let app;

try {
  app = require('../src/server');
} catch (err) {
  console.error('❌ Server yuklanmadi:', err.message);
  // Fallback: minimal Express app
  const express = require('express');
  app = express();
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'error',
      message: 'Backend not configured for serverless. Set DATABASE_URL (PostgreSQL) env var.',
      error: err.message,
    });
  });
  app.all('*', (req, res) => {
    res.status(503).json({
      error: 'Backend not available',
      message: 'Please set DATABASE_URL environment variable for PostgreSQL connection.',
    });
  });
}

module.exports = app;
