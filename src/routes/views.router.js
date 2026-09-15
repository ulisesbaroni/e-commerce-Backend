import { Router } from "express";
import { isValidObjectId } from "mongoose";
import jwt from "jsonwebtoken";
import { productRepository } from "../repositories/product.repository.js";
import { cartRepository } from "../repositories/cart.repository.js";

const router = Router();

// Decodifica el usuario logueado a partir de la cookie del JWT (o null si no hay sesión)
function getCurrentUser(req) {
  const token = req.cookies.token;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Disponible en todas las vistas, para el nav y el botón de agregar al carrito
router.use((req, res, next) => {
  const user = getCurrentUser(req);
  res.locals.user = user;
  res.locals.cartId = user?.cart ?? null;
  next();
});

// Landing
router.get("/", (req, res) => {
  res.render("home");
});

// Login
router.get("/login", (req, res) => {
  res.render("login");
});

// Registro
router.get("/register", (req, res) => {
  res.render("register");
});

// Vista en tiempo real
router.get("/realtimeproducts", async (req, res) => {
  const products = await productRepository.getAll();
  res.render("realTimeProducts", { products: products.map((p) => p.toJSON()) });
});

// Listado paginado de productos
router.get("/products", async (req, res) => {
  const { limit = 10, page = 1, query, sort } = req.query;

  const result = await productRepository.getPaginated({ limit, page, query, sort });

  res.render("products", {
    products: result.docs.map((p) => p.toJSON()),
    query,
    sort,
    page: result.page,
    totalPages: result.totalPages,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  });
});

// Detalle de un producto
router.get("/products/:pid", async (req, res) => {
  const { pid } = req.params;

  if (!isValidObjectId(pid)) return res.status(400).send("ID inválido");

  const product = await productRepository.getById(pid);

  if (!product) return res.status(404).send("Producto no encontrado");

  res.render("productDetail", { product: product.toJSON() });
});

// Detalle de un carrito
router.get("/carts/:cid", async (req, res) => {
  const { cid } = req.params;

  if (!isValidObjectId(cid)) return res.status(400).send("ID inválido");

  const cart = await cartRepository.getByIdPopulated(cid);

  if (!cart) return res.status(404).send("Carrito no encontrado");

  res.render("cartDetail", { cart: cart.toJSON() });
});

export default router;
