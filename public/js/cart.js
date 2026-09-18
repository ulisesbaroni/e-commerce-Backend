const jsonHeaders = { "Content-Type": "application/json" };

// Si la sesión venció o el usuario no puede operar este carrito, se lo manda a iniciar sesión
function handleAuthError(res) {
  if (res.status === 401 || res.status === 403) {
    window.location.href = "/login";
    return true;
  }

  return false;
}

document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", async () => {
    const { cartId, productId } = button.dataset;
    const res = await fetch(`/api/carts/${cartId}/product/${productId}`, { method: "POST" });

    if (handleAuthError(res)) return;

    if (res.ok) {
      const original = button.textContent;
      button.textContent = "Agregado ✓";
      setTimeout(() => (button.textContent = original), 1500);
    }
  });
});

const cartPage = document.getElementById("carrito");

if (cartPage) {
  const cartId = cartPage.dataset.cartId;
  const mensaje = document.getElementById("mensaje");

  document.querySelectorAll(".btn-cantidad").forEach((button) => {
    button.addEventListener("click", async () => {
      const res = await fetch(`/api/carts/${cartId}/products/${button.dataset.id}`, {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ quantity: Number(button.dataset.quantity) }),
      });

      if (handleAuthError(res)) return;

      window.location.reload();
    });
  });

  document.querySelectorAll(".btn-quitar").forEach((button) => {
    button.addEventListener("click", async () => {
      const res = await fetch(`/api/carts/${cartId}/products/${button.dataset.id}`, { method: "DELETE" });

      if (handleAuthError(res)) return;

      window.location.reload();
    });
  });

  const emptyButton = document.getElementById("btn-vaciar");

  if (emptyButton) {
    emptyButton.addEventListener("click", async () => {
      if (!confirm("¿Vaciar el carrito?")) return;

      const res = await fetch(`/api/carts/${cartId}`, { method: "DELETE" });

      if (handleAuthError(res)) return;

      window.location.reload();
    });
  }

  const buyButton = document.getElementById("btn-comprar");

  if (buyButton) {
    buyButton.addEventListener("click", async () => {
      // Evita compras dobles por clics repetidos mientras se procesa
      buyButton.disabled = true;
      mensaje.textContent = "";

      const res = await fetch(`/api/carts/${cartId}/purchase`, { method: "POST" });

      if (handleAuthError(res)) return;

      const data = await res.json();

      if (res.ok) {
        const suffix = data.payload.complete ? "" : "?partial=1";
        window.location.href = `/tickets/${data.payload.ticket.id}${suffix}`;
        return;
      }

      const details = (data.notPurchased ?? []).map((item) => `${item.title ?? "Producto"}: ${item.reason}`).join(" · ");
      mensaje.textContent = details ? `${data.message}. ${details}` : data.message;
      buyButton.disabled = false;
    });
  }
}
