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

const logoutLink = document.getElementById("logout-link");

if (logoutLink) {
  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    await fetch("/api/sessions/logout", { method: "POST" });
    window.location.href = "/";
  });
}
