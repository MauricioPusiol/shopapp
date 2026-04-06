const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

// POST /api/orders — crear una orden (requiere JWT)
router.post('/', (req, res) => {
  const { items } = req.body;
  // req.user viene del authMiddleware: { userId, email }
  const userId = req.user.userId;

  if (!items || items.length === 0)
    return res.status(400).json({ error: 'El carrito está vacío' });

  // Transacción: o todo sale bien, o nada se guarda
  const createOrder = db.transaction((items, userId) => {
    let total = 0;

    // Verificar stock y calcular total
    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);

      if (!product)
        throw new Error(`Producto ${item.productId} no encontrado`);

      if (product.stock < item.quantity)
        throw new Error(`Stock insuficiente para "${product.name}"`);

      total += product.price * item.quantity;
    }

    // Crear la orden
    const orderResult = db.prepare(
      'INSERT INTO orders (user_id, total) VALUES (?, ?) RETURNING id'
    ).run(userId, total);

    const orderId = orderResult.lastInsertRowid;

    // Insertar los items y descontar stock
    for (const item of items) {
      const product = db.prepare('SELECT price FROM products WHERE id = ?').get(item.productId);

      db.prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
      ).run(orderId, item.productId, item.quantity, product.price);

      db.prepare(
        'UPDATE products SET stock = stock - ? WHERE id = ?'
      ).run(item.quantity, item.productId);
    }

    return { orderId, total };
  });

  try {
    const result = createOrder(items, userId);
    res.status(201).json({ message: 'Orden creada', ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders/me — historial del usuario logueado
router.get('/me', (req, res) => {
  const orders = db.prepare(`
    SELECT o.id, o.total, o.status, o.created_at,
           json_group_array(json_object(
             'product', p.name,
             'quantity', oi.quantity,
             'price', oi.price
           )) AS items
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p     ON p.id = oi.product_id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all(req.user.userId);

  // items viene como string JSON, hay que parsearlo
  const parsed = orders.map(o => ({ ...o, items: JSON.parse(o.items) }));
  res.json(parsed);
});

module.exports = router;