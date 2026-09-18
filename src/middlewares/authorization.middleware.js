import passport from "../config/passport.config.js";

// Autentica con la estrategia "current" y exige que el rol del usuario sea uno de los permitidos
export function authorization(...roles) {
  return (req, res, next) => {
    passport.authenticate("current", { session: false }, (error, user, info) => {
      if (error) return res.status(500).json({ status: "error", message: "Error al validar la sesión" });
      if (!user) return res.status(401).json({ status: "error", message: info?.message || "No autorizado" });

      if (!roles.includes(user.role)) {
        return res.status(403).json({ status: "error", message: "No tenés permisos para realizar esta acción" });
      }

      req.user = user;
      next();
    })(req, res, next);
  };
}

// Solo permite operar sobre el carrito que pertenece al usuario logueado
export function ownCart(req, res, next) {
  if (req.user.cart?.toString() !== req.params.cid) {
    return res.status(403).json({ status: "error", message: "Solo podés operar sobre tu propio carrito" });
  }

  next();
}
