require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const BACKUP_DIR = path.join(__dirname, '../../backups');
const RETENTION_DAYS = 30;

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('📁 Backup directory created:', BACKUP_DIR);
}

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  let filename, filepath;

  try {
    if (process.env.DATABASE_URL) {
      // PostgreSQL backup using pg_dump
      filename = `pos_backup_${timestamp}.sql`;
      filepath = path.join(BACKUP_DIR, filename);
      console.log('🗄️  Backing up PostgreSQL...');
      execSync(`pg_dump "${process.env.DATABASE_URL}" > "${filepath}"`, {
        timeout: 60000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      console.log('✅ PostgreSQL backup created:', filepath);
    } else {
      // SQLite backup - copy the file
      filename = `pos_backup_${timestamp}.db`;
      filepath = path.join(BACKUP_DIR, filename);
      const sourceDb = path.join(__dirname, '../pos_database.db');
      if (fs.existsSync(sourceDb)) {
        fs.copyFileSync(sourceDb, filepath);
        // Also copy WAL and SHM if they exist
        if (fs.existsSync(sourceDb + '-wal')) {
          fs.copyFileSync(sourceDb + '-wal', filepath + '-wal');
        }
        if (fs.existsSync(sourceDb + '-shm')) {
          fs.copyFileSync(sourceDb + '-shm', filepath + '-shm');
        }
        console.log('✅ SQLite backup created:', filepath);
      } else {
        throw new Error('Database file not found: ' + sourceDb);
      }
    }

    const stats = fs.statSync(filepath);
    const sizeBytes = stats.size;

    // Log backup to database
    try {
      await db.query(
        `INSERT INTO backups (filename, filepath, size_bytes, status)
         VALUES ($1, $2, $3, 'completed')`,
        [filename, filepath, sizeBytes]
      );
    } catch (logErr) {
      console.log('⚠️ Backup log error:', logErr.message);
    }

    console.log(`📦 Backup size: ${(sizeBytes / 1024 / 1024).toFixed(2)} MB`);

    // Clean old backups
    cleanOldBackups();

    return { filename, filepath, sizeBytes };
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    try {
      await db.query(
        `INSERT INTO backups (filename, filepath, status)
         VALUES ($1, $2, 'failed')`,
        [filename || 'unknown', filepath || 'unknown']
      );
    } catch (logErr) {
      console.log('⚠️ Backup log error:', logErr.message);
    }
    throw error;
  }
}

function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();

    files.forEach((file) => {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filepath);
      const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

      if (ageDays > RETENTION_DAYS && !file.startsWith('.')) {
        fs.unlinkSync(filepath);
        console.log(`🗑️  Deleted old backup: ${file} (${Math.round(ageDays)} days old)`);
      }
    });
  } catch (error) {
    console.log('⚠️ Cleanup error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  backup()
    .then((result) => {
      console.log('✅ Backup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Backup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { backup };
