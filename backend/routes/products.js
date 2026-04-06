const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

// GET /api/products  — todos los productos
router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

// GET /api/products/:id  — un producto por ID
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
});

// POST /api/products — agregar producto
router.post('/', (req, res) => {
  const { name, price, stock, category, image_url } = req.body;
  const result = db.prepare(
    'INSERT INTO products (name, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?)'
  ).run(name, price, stock, category, image_url || '');
  res.status(201).json({ id: result.lastInsertRowid, name, price, stock, category });
});

module.exports = router;