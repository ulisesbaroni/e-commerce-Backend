import { Router } from "express";
import jwt from "jsonwebtoken";
import passport from "../config/passport.config.js";
import UserDTO from "../dto/user.dto.js";
import { requestPasswordReset, resetPassword } from "../services/passwordReset.service.js";

const router = Router();

// POST /api/sessions/register
router.post("/register", (req, res, next) => {
  passport.authenticate("register", { session: false }, (error, user, info) => {
    if (error) return res.status(500).json({ status: "error", message: "Error al registrar el usuario" });
    if (!user) return res.status(400).json({ status: "error", message: info?.message || "No se pudo registrar el usuario" });

    res.status(201).json({ status: "success", payload: new UserDTO(user) });
  })(req, res, next);
});

// POST /api/sessions/login
router.post("/login", (req, res, next) => {
  passport.authenticate("login", { session: false }, (error, user, info) => {
    if (error) return res.status(500).json({ status: "error", message: "Error al iniciar sesión" });
    if (!user) return res.status(401).json({ status: "error", message: info?.message || "Credenciales inválidas" });

    // Solo los clientes tienen carrito activo; un admin no compra
    const cart = user.role === "user" ? user.cart : undefined;

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, cart }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 });
    res.json({ status: "success", payload: new UserDTO(user), token });
  })(req, res, next);
});

// GET /api/sessions/current
router.get("/current", (req, res, next) => {
  passport.authenticate("current", { session: false }, (error, user, info) => {
    if (error) return res.status(500).json({ status: "error", message: "Error al validar la sesión" });
    if (!user) return res.status(401).json({ status: "error", message: info?.message || "No autorizado" });

    res.json({ status: "success", payload: new UserDTO(user) });
  })(req, res, next);
});

// POST /api/sessions/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ status: "error", message: "Ingresá tu email" });
  }

  // El envío va en segundo plano: así la respuesta tarda lo mismo exista o no el email
  requestPasswordReset(email.trim()).catch((error) => {
    console.error("No se pudo enviar el mail de recuperación:", error.message);
  });

  res.json({ status: "success", message: "Si el email está registrado, te enviamos un correo para restablecer tu contraseña" });
});

// POST /api/sessions/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (typeof token !== "string" || !token) {
    return res.status(400).json({ status: "error", message: "Falta el token de recuperación" });
  }

  try {
    const result = await resetPassword(token, password);

    if (!result.ok) return res.status(result.status).json({ status: "error", message: result.message });

    res.json({ status: "success", message: "Contraseña actualizada" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al restablecer la contraseña" });
  }
});

// POST /api/sessions/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ status: "success", payload: null });
});

export default router;
