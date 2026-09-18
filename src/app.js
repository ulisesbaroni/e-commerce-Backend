import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { engine } from "express-handlebars";
import { connectDB } from "./db.js";
import passport from "./config/passport.config.js";
import { ensureAdminUser } from "./config/admin.config.js";

import productsRouter from "./routes/products.router.js";
import cartsRouter from "./routes/carts.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import usersRouter from "./routes/users.router.js";
import ticketsRouter from "./routes/tickets.router.js";
import viewsRouter from "./routes/views.router.js";

const app = express();

const PORT = 8080;

// Red de seguridad: evita que un error no controlado tire abajo el servidor
process.on("unhandledRejection", (error) => {
  console.error("Promesa rechazada sin capturar:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Excepción no capturada:", error);
});

// Handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "src/views");

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(passport.initialize());

// Rutas API
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/users", usersRouter);
app.use("/api/tickets", ticketsRouter);

// Rutas vistas
app.use("/", viewsRouter);

connectDB().then(async () => {
  await ensureAdminUser();

  const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });

  // Si no puede escuchar (por ejemplo, puerto ocupado) el servidor no sirve: se corta en vez de quedar colgado
  server.on("error", (error) => {
    console.error("No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  });
});
