import { Router } from "express";
import jwt from "jsonwebtoken";
import passport from "../config/passport.config.js";
import UserDTO from "../dto/user.dto.js";

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

// POST /api/sessions/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ status: "success", payload: null });
});

export default router;
