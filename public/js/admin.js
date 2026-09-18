const headers = { "Content-Type": "application/json" };

// Si la sesión venció o el usuario no es admin, se lo manda a iniciar sesión
function handleAuthError(res) {
  if (res.status === 401 || res.status === 403) {
    window.location.href = "/login";
    return true;
  }

  return false;
}

const productForm = document.getElementById("form-producto");

if (productForm) {
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = productForm.dataset.productId;

    const body = {
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      code: document.getElementById("code").value,
      category: document.getElementById("category").value,
      price: Number(document.getElementById("price").value),
      stock: Number(document.getElementById("stock").value),
      status: document.getElementById("status").checked,
      thumbnails: document
        .getElementById("thumbnails")
        .value.split("\n")
        .map((url) => url.trim())
        .filter(Boolean),
    };

    const res = await fetch(id ? `/api/products/${id}` : "/api/products", {
      method: id ? "PUT" : "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (handleAuthError(res)) return;

    if (!res.ok) {
      const data = await res.json();
      document.getElementById("mensaje").textContent = data.error || data.message;
      return;
    }

    window.location.href = "/admin/products";
  });
}

document.querySelectorAll(".btn-estado").forEach((button) => {
  button.addEventListener("click", async () => {
    const isActive = button.dataset.status === "true";

    const res = await fetch(`/api/products/${button.dataset.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status: !isActive }),
    });

    if (handleAuthError(res)) return;

    window.location.reload();
  });
});

document.querySelectorAll(".btn-eliminar").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!confirm(`¿Eliminar "${button.dataset.title}"? Esta acción no se puede deshacer.`)) return;

    const res = await fetch(`/api/products/${button.dataset.id}`, { method: "DELETE" });

    if (handleAuthError(res)) return;

    window.location.reload();
  });
});

const userForm = document.getElementById("form-usuario");

if (userForm) {
  userForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const roleSelect = document.getElementById("role");

    const body = {
      first_name: document.getElementById("first_name").value,
      last_name: document.getElementById("last_name").value,
      email: document.getElementById("email").value,
      age: Number(document.getElementById("age").value),
    };

    if (!roleSelect.disabled) body.role = roleSelect.value;

    const res = await fetch(`/api/users/${userForm.dataset.userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (handleAuthError(res)) return;

    if (!res.ok) {
      const data = await res.json();
      document.getElementById("mensaje").textContent = data.message;
      return;
    }

    window.location.href = "/admin/users";
  });
}

document.querySelectorAll(".btn-rol").forEach((button) => {
  button.addEventListener("click", async () => {
    const newRole = button.dataset.role === "admin" ? "user" : "admin";
    const action = newRole === "admin" ? "darle permisos de administrador a" : "quitarle los permisos de administrador a";

    if (!confirm(`¿Seguro que querés ${action} ${button.dataset.email}?`)) return;

    const res = await fetch(`/api/users/${button.dataset.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ role: newRole }),
    });

    if (handleAuthError(res)) return;

    if (!res.ok) {
      const data = await res.json();
      alert(data.message);
      return;
    }

    window.location.reload();
  });
});

document.querySelectorAll(".btn-eliminar-usuario").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!confirm(`¿Eliminar a ${button.dataset.email}? Se borra también su carrito y no se puede deshacer.`)) return;

    const res = await fetch(`/api/users/${button.dataset.id}`, { method: "DELETE" });

    if (handleAuthError(res)) return;

    if (!res.ok) {
      const data = await res.json();
      alert(data.message);
      return;
    }

    window.location.reload();
  });
});
