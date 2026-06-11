import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'concert_reviews.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS concerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artist TEXT NOT NULL,
      venue TEXT NOT NULL,
      city TEXT NOT NULL,
      date TEXT NOT NULL,
      poster TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      concert_id INTEGER NOT NULL,
      sound_score INTEGER NOT NULL,
      stage_score INTEGER NOT NULL,
      atmosphere_score INTEGER NOT NULL,
      value_score INTEGER NOT NULL,
      overall_score REAL NOT NULL,
      content TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      videos TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (concert_id) REFERENCES concerts (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      review_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, review_id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (review_id) REFERENCES reviews (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      review_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, review_id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (review_id) REFERENCES reviews (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      review_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (review_id) REFERENCES reviews (id)
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_concert ON reviews(concert_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_concerts_artist ON concerts(artist)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_concerts_venue ON concerts(venue)`);
  });
}

export function runQuery(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(this: any, err: Error | null) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function getQuery<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: Error | null, row: T) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function allQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: Error | null, rows: T[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export default db;
