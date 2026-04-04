async function loadProducts() {
  const res      = await fetch('/api/products');
  const products = await res.json();
  renderProducts(products);
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = products.map(p => `
    <article class="product-card">
      <h2>${p.name}</h2>
      <p class="price">$${p.price.toFixed(2)}</p>
      <p class="stock">Stock: ${p.stock}</p>
      <button>Agregar al carrito</button>
    </article>
  `).join('');
}

loadProducts();