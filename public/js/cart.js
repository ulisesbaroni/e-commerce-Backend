document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", async () => {
    const { cartId, productId } = button.dataset;
    const res = await fetch(`/api/carts/${cartId}/product/${productId}`, { method: "POST" });

    if (res.status === 401 || res.status === 403) {
      window.location.href = "/login";
      return;
    }

    if (res.ok) {
      const original = button.textContent;
      button.textContent = "Agregado ✓";
      setTimeout(() => (button.textContent = original), 1500);
    }
  });
});
