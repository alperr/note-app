const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const fs = require('fs');

const dbDir = path.join(os.homedir(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'notes.db');
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT,
      saved_at INTEGER,
      attachments TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      content BLOB,
      saved_at INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      notes TEXT,
      saved_at INTEGER
    )
  `);
  db.run('ALTER TABLE lists ADD COLUMN name TEXT', function(err) {
    if (err) {
      console.log('Column name already exists or error:', err.message);
    }
  });
});

module.exports = db;