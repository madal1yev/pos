// Vercel serverless entry point for POS Backend
const path = require('path');
const fs = require('fs');

// SQLite database file path (for Vercel serverless - ephemeral but works)
const DB_PATH = path.join(__dirname, '..', 'pos_database.db');

// Run SQLite migration on cold start (tables will be created fresh)
try {
  if (!process.env.DATABASE_URL) {
    // Only for SQLite mode
    const Database = require('better-sqlite3');
    const dbExists = fs.existsSync(DB_PATH);
    const sqlite = new Database(DB_PATH);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    sqlite.close();
    
    // Run the migration to ensure all tables exist
    const { execSync } = require('child_process');
    execSync('node migrations/run.js', { cwd: path.join(__dirname, '..'), stdio: 'pipe', timeout: 30000 });
    console.log('✅ Vercel: DB migration completed (SQLite)');
  }
} catch (err) {
  console.error('⚠️ Vercel: Migration xatosi:', err.message);
}

const app = require('../src/server');
module.exports = app;
