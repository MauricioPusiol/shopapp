const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

// GET /api/products  — todos los productos
router.get('/', async (req, res) => {
  try {
    const products = await db.prepare('SELECT * FROM products').all();
    console.log('Productos encontrados:', products);
    res.json(products);
  } catch (err) {
    console.error('Error en GET /products:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { name, price, stock, category, image_url } = req.body;
    const result = await db.prepare(
      'INSERT INTO products (name, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?) RETURNING id'
    ).run(name, price, stock, category, image_url || '');
    res.status(201).json({ id: result.lastInsertRowid, name, price, stock, category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;