// Vercel serverless entry point for POS Backend
// PostgreSQL DATABASE_URL env var orqali ulanish

const path = require('path');

// Production'da auto-migrate (PostgreSQL)
if (process.env.DATABASE_URL) {
  (async () => {
    try {
      const { execSync } = require('child_process');
      console.log('🔧 Running PostgreSQL migration on cold start...');
      execSync('node migrations/pg-migrate.js', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        timeout: 30000,
      });
      console.log('✅ Migration completed');
    } catch (err) {
      console.error('⚠️ Migration xatosi (non-fatal):', err.message);
    }
  })();
}

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
