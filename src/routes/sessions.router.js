import { Router } from "express";
import jwt from "jsonwebtoken";
import passport from "../config/passport.config.js";

const router = Router();

// POST /api/sessions/register
router.post("/register", (req, res, next) => {
  passport.authenticate("register", { session: false }, (error, user, info) => {
    if (error) return res.status(500).json({ status: "error", message: "Error al registrar el usuario" });
    if (!user) return res.status(400).json({ status: "error", message: info?.message || "No se pudo registrar el usuario" });

    res.status(201).json({ status: "success", payload: user });
  })(req, res, next);
});

// POST /api/sessions/login
router.post("/login", (req, res, next) => {
  passport.authenticate("login", { session: false }, (error, user, info) => {
    if (error) return res.status(500).json({ status: "error", message: "Error al iniciar sesión" });
    if (!user) return res.status(401).json({ status: "error", message: info?.message || "Credenciales inválidas" });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 });
    res.json({ status: "success", payload: user, token });
  })(req, res, next);
});

export default router;
