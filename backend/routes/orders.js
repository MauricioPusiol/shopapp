const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

router.post('/', async (req, res) => {
  const { items } = req.body;
  const userId = req.user.userId;

  if (!items || items.length === 0)
    return res.status(400).json({ error: 'El carrito está vacío' });

  try {
    const createOrder = db.transaction(async (items, userId) => {
      let total = 0;

      for (const item of items) {
        const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
        if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
        if (product.stock < item.quantity) throw new Error(`Stock insuficiente para "${product.name}"`);
        total += parseFloat(product.price) * item.quantity;
      }

      const orderResult = await db.prepare(
        'INSERT INTO orders (user_id, total) VALUES (?, ?) RETURNING id'
      ).run(userId, total);

      const orderId = orderResult.lastInsertRowid;

      for (const item of items) {
        const product = await db.prepare('SELECT price FROM products WHERE id = ?').get(item.productId);
        await db.prepare(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?) RETURNING id'
        ).run(orderId, item.productId, item.quantity, parseFloat(product.price));

        await db.prepare(
          'UPDATE products SET stock = stock - ? WHERE id = ?'
        ).run(item.quantity, item.productId);
      }

      return { orderId, total };
    });

    const result = await createOrder(items, userId);
    res.status(201).json({ message: 'Orden creada', ...result });

  } catch (err) {
    console.error('Error en POST /orders:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/me — historial del usuario logueado
router.get('/me', async (req, res) => {
  try {
    // Primero traemos las órdenes
    const orders = await db.prepare(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.userId);

    // Luego los items de cada orden por separado
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.prepare(`
          SELECT oi.quantity, oi.price, p.name AS product
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = ?
        `).all(order.id);

        return { ...order, items };
      })
    );

    res.json(ordersWithItems);

  } catch (err) {
    console.error('Error en GET /orders/me:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;