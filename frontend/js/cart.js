let cart = [];

function addToCart(product) {
  const existing = cart.find(i => i.productId === product.id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ productId: product.id, name: product.name, price: product.price, quantity: 1 });
  }

  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.productId !== productId);
  renderCart();
}

function getTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const totalEl   = document.getElementById('cart-total');

  if (cart.length === 0) {
    container.innerHTML = '<p>Tu carrito está vacío.</p>';
    totalEl.textContent = '$0.00';
    return;
  }

  container.innerHTML = cart.map(i => `
    <div class="cart-item">
      <span>${i.name} x${i.quantity}</span>
      <span>$${(i.price * i.quantity).toFixed(2)}</span>
      <button onclick="removeFromCart(${i.productId})">Quitar</button>
    </div>
  `).join('');

  totalEl.textContent = `$${getTotal().toFixed(2)}`;
}

async function checkout() {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Tenés que iniciar sesión para comprar.');
    return;
  }

  if (cart.length === 0) {
    alert('Tu carrito está vacío.');
    return;
  }

  try {
    const res = await authFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ items: cart })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    alert(`Orden #${data.orderId} creada. Total: $${data.total.toFixed(2)}`);
    cart = [];
    renderCart();

  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}