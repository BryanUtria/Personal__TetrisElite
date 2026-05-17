const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = path.resolve(__dirname, '..', 'database', 'tetriselite.sqlite');
const TABLE_NAME = 'settings';

function openDb() {
  return new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
}

function initialize() {
  const db = openDb();
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (key TEXT PRIMARY KEY, value TEXT)`);
  });
  return db;
}

function getValue(key) {
  return new Promise((resolve, reject) => {
    const db = initialize();
    db.get(`SELECT value FROM ${TABLE_NAME} WHERE key = ?`, [key], (err, row) => {
      db.close();
      if (err) return reject(err);
      resolve(row ? row.value : null);
    });
  });
}

function setValue(key, value) {
  return new Promise((resolve, reject) => {
    const db = initialize();
    db.run(
      `INSERT INTO ${TABLE_NAME} (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
      function (err) {
        db.close();
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

module.exports = {
  getValue,
  setValue,
};
