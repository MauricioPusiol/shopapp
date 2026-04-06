const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../db/database');

const SALT_ROUNDS = 10;
const SECRET      = process.env.JWT_SECRET;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });

  if (password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?) RETURNING id');
    const result = await stmt.run(email, hash);

    res.status(201).json({ message: 'Usuario creado', userId: result.lastInsertRowid });

  } catch (err) {
    if (err.message.includes('unique') || err.message.includes('UNIQUE'))
      return res.status(409).json({ error: 'El email ya está registrado' });

    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;