const loginForm = document.getElementById("form-login");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    };

    const res = await fetch("/api/sessions/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById("mensaje").textContent = data.message;
      return;
    }

    window.location.href = "/products";
  });
}

const registerForm = document.getElementById("form-register");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      first_name: document.getElementById("first_name").value,
      last_name: document.getElementById("last_name").value,
      email: document.getElementById("email").value,
      age: Number(document.getElementById("age").value),
      password: document.getElementById("password").value,
    };

    const res = await fetch("/api/sessions/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById("mensaje").textContent = data.message;
      return;
    }

    window.location.href = "/login";
  });
}

const forgotForm = document.getElementById("form-forgot");

if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const res = await fetch("/api/sessions/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: document.getElementById("email").value }),
    });

    const data = await res.json();
    const mensaje = document.getElementById("mensaje");

    mensaje.textContent = data.message;
    mensaje.className = res.ok ? "mensaje-ok" : "mensaje-error";
  });
}

const resetForm = document.getElementById("form-reset");

if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mensaje = document.getElementById("mensaje");
    const password = document.getElementById("password").value;

    if (password !== document.getElementById("password-confirm").value) {
      mensaje.textContent = "Las contraseñas no coinciden";
      return;
    }

    const res = await fetch("/api/sessions/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetForm.dataset.token, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      mensaje.textContent = data.message;
      return;
    }

    window.location.href = "/login?reset=1";
  });
}

const logoutLink = document.getElementById("logout-link");

if (logoutLink) {
  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    await fetch("/api/sessions/logout", { method: "POST" });
    window.location.href = "/";
  });
}
