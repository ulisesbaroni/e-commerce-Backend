import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { engine } from "express-handlebars";
import { initSocket } from "./socket.js";
import { connectDB } from "./db.js";
import passport from "./config/passport.config.js";

import productsRouter from "./routes/products.router.js";
import cartsRouter from "./routes/carts.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import viewsRouter from "./routes/views.router.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

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

// Rutas vistas
app.use("/", viewsRouter);

// Socket.IO
initSocket(io);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});