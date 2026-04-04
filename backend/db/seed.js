const db = require('./database');

const products = [
  { name: 'Teclado mecánico', price: 89.99, stock: 15, category: 'tech', image_url: '' },
  { name: 'Mouse gamer',      price: 45.00, stock: 30, category: 'tech', image_url: '' },
  { name: 'Auriculares BT',   price: 120.00,stock: 8,  category: 'tech', image_url: '' },
];

const insert = db.prepare(
  `INSERT INTO products (name, price, stock, category, image_url)
   VALUES (@name, @price, @stock, @category, @image_url)`
);

products.forEach(p => insert.run(p));
console.log('Seed completado.');