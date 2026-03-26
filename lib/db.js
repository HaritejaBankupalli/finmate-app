const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use /tmp/ on Vercel (serverless read-only filesystem), project root locally
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const dbPath = isVercel
  ? path.join('/tmp', 'finmate.db')
  : path.join(process.cwd(), 'finmate.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      mode TEXT DEFAULT 'individual',
      partner_name TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      age INTEGER DEFAULT 28,
      income REAL DEFAULT 0,
      expenses REAL DEFAULT 0,
      emi REAL DEFAULT 0,
      savings REAL DEFAULT 0,
      city TEXT DEFAULT '',
      risk_level TEXT DEFAULT 'moderate',
      goals TEXT DEFAULT '[]',
      mutual_funds REAL DEFAULT 0,
      stocks REAL DEFAULT 0,
      fd_ppf REAL DEFAULT 0,
      gold REAL DEFAULT 0,
      retirement_year INTEGER DEFAULT 2045,
      partner_age INTEGER DEFAULT 0,
      partner_income REAL DEFAULT 0,
      partner_expenses REAL DEFAULT 0,
      partner_emi REAL DEFAULT 0,
      partner_savings REAL DEFAULT 0,
      partner_mutual_funds REAL DEFAULT 0,
      partner_stocks REAL DEFAULT 0,
      partner_fd_ppf REAL DEFAULT 0,
      partner_gold REAL DEFAULT 0,
      salary_basic REAL DEFAULT 0,
      salary_hra REAL DEFAULT 0,
      salary_special REAL DEFAULT 0,
      salary_lta REAL DEFAULT 0,
      investments_80c REAL DEFAULT 0,
      investments_80d REAL DEFAULT 0,
      investments_nps REAL DEFAULT 0,
      hra_rent REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT DEFAULT '',
      who TEXT DEFAULT 'self',
      date TEXT DEFAULT (date('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS scheme_interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      scheme_id TEXT NOT NULL,
      interested INTEGER DEFAULT 0,
      invest_amount REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, scheme_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'reminder',
      due_date TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

module.exports = { getDb };
