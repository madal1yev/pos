const path = require('path');
let backup;
try {
  backup = require(path.join(__dirname, '../../scripts/backup'));
} catch (e) {
  console.log('ℹ️ Backup script not available:', e.message.slice(0, 80));
}

const db = require('../config/db');

let isRunning = false;
let schedulerInterval = null;

function startBackupScheduler() {
  if (!backup) {
    console.log('ℹ️ Backup scheduler disabled (script not found)');
    return;
  }

  // Fallback: use setInterval to check every hour
  schedulerInterval = setInterval(async () => {
    const hour = new Date().getHours();
    if (hour === 3 && !isRunning) {
      isRunning = true;
      console.log('🕐 Starting scheduled backup...');
      try {
        await backup();
        console.log('✅ Scheduled backup completed');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error.message);
      } finally {
        isRunning = false;
      }
    }
  }, 60 * 60 * 1000);

  console.log('🕐 Backup scheduler started (checks hourly at 3 AM)');

  // Log recent backups
  db.query('SELECT * FROM backups ORDER BY created_at DESC LIMIT 5')
    .then(r => {
      if (r.rows.length > 0) console.log(`📦 Recent backups: ${r.rows.length} found`);
    })
    .catch(() => {});
}

module.exports = { startBackupScheduler };
