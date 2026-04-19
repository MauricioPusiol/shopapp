async function loadProducts(retries = 3) {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const products = await res.json();
    renderProducts(products);
  } catch (err) {
    if (retries > 0) {
      console.log(`Reintentando... (${retries} intentos restantes)`);
      document.getElementById('products-grid').innerHTML =
        '<div class="state-msg">Conectando con el servidor...</div>';
      setTimeout(() => loadProducts(retries - 1), 5000);
    } else {
      document.getElementById('products-grid').innerHTML =
        '<div class="state-msg">No se pudo conectar. Recargá la página.</div>';
    }
  }
}

loadProducts();