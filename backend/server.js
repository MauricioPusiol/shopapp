require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const path           = require('path');
const authMiddleware = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   authMiddleware, require('./routes/orders'));

if (process.env.NODE_ENV === 'production') {
  const https = require('https');
  setInterval(() => {
    https.get('https://shopapp-uuzm.onrender.com/api/products', (res) => {
      console.log(`Keep-alive: ${res.statusCode}`);
    }).on('error', () => {});
  }, 14 * 60 * 1000);
}

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));