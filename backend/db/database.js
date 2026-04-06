const path = require('path');

let db;

if (process.env.DATABASE_URL) {
  // Producción — PostgreSQL en Render
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    email      TEXT   NOT NULL UNIQUE,
    password   TEXT   NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS products (
    id        SERIAL PRIMARY KEY,
    name      TEXT    NOT NULL,
    price     FLOAT   NOT NULL,
    image_url TEXT,
    stock     INTEGER DEFAULT 0,
    category  TEXT
  );
  CREATE TABLE IF NOT EXISTS orders (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    total      FLOAT   NOT NULL,
    status     TEXT    DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity   INTEGER NOT NULL,
    price      FLOAT   NOT NULL
  );
`).catch(err => console.error('Error creando tablas:', err.message));

  // Adaptador para que el resto del código funcione igual
  db = {
    prepare: (sql) => ({
      all:    (...p) => pool.query(sql, p).then(r => r.rows),
      get:    (...p) => pool.query(sql, p).then(r => r.rows[0]),
      run:    (...p) => pool.query(sql, p).then(r => ({ lastInsertRowid: r.rows[0]?.id, changes: r.rowCount })),
    }),
    transaction: (fn) => async (...args) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(...args);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
  };

} else {
  // Desarrollo — SQLite local
  const Database = require('better-sqlite3');
  db = new Database(path.join(__dirname, 'shopapp.db'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT,
      stock INTEGER DEFAULT 0,
      category TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);
}

module.exports = db;