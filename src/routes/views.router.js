import { Router } from "express";
import { isValidObjectId } from "mongoose";
import jwt from "jsonwebtoken";
import { productRepository } from "../repositories/product.repository.js";
import { cartRepository } from "../repositories/cart.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import UserDTO from "../dto/user.dto.js";
import { getUserFromResetToken } from "../services/passwordReset.service.js";

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
  res.locals.isAdmin = user?.role === "admin";
  res.locals.cartId = user?.cart ?? null;
  next();
});

// Las pantallas de administración solo las ve un admin
function requireAdmin(req, res, next) {
  if (!res.locals.user) return res.redirect("/login");
  if (!res.locals.isAdmin) return res.status(403).send("No tenés permisos para acceder a esta sección");

  next();
}

// Landing
router.get("/", (req, res) => {
  res.render("home");
});

// Login
router.get("/login", (req, res) => {
  res.render("login", { reset: req.query.reset === "1" });
});

// Recuperación de contraseña: pedir el enlace
router.get("/forgot-password", (req, res) => {
  res.render("forgotPassword");
});

// Recuperación de contraseña: elegir la contraseña nueva (el enlace del mail)
router.get("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const user = await getUserFromResetToken(token);

  res.render("resetPassword", { token: user ? token : null });
});

// Registro
router.get("/register", (req, res) => {
  res.render("register");
});

// Listado paginado de productos
router.get("/products", async (req, res) => {
  const { limit = 10, page = 1, query, sort } = req.query;

  const result = await productRepository.getPaginated({ limit, page, query, sort, onlyActive: true });

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

  if (!product || (!product.status && !res.locals.isAdmin)) return res.status(404).send("Producto no encontrado");

  res.render("productDetail", { product: product.toJSON() });
});

// Panel de administración: listado de productos
router.get("/admin/products", requireAdmin, async (req, res) => {
  const { limit = 10, page = 1, query, sort } = req.query;

  const result = await productRepository.getPaginated({ limit, page, query, sort });

  res.render("adminProducts", {
    adminProducts: true,
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

// Panel de administración: alta de producto
router.get("/admin/products/new", requireAdmin, (req, res) => {
  res.render("adminProductForm", { product: { status: true } });
});

// Panel de administración: edición de producto
router.get("/admin/products/:pid/edit", requireAdmin, async (req, res) => {
  const { pid } = req.params;

  if (!isValidObjectId(pid)) return res.status(400).send("ID inválido");

  const product = await productRepository.getById(pid);

  if (!product) return res.status(404).send("Producto no encontrado");

  res.render("adminProductForm", {
    product: product.toJSON(),
    thumbnailsText: product.thumbnails.join("\n"),
  });
});

// Panel de administración: listado de usuarios
router.get("/admin/users", requireAdmin, async (req, res) => {
  const { limit = 10, page = 1, query } = req.query;

  const result = await userRepository.getPaginated({ limit, page, query });

  res.render("adminUsers", {
    adminUsers: true,
    users: result.docs.map((user) => ({
      ...new UserDTO(user),
      isAdminRole: user.role === "admin",
      isSelf: user.id === res.locals.user.id,
    })),
    query,
    page: result.page,
    totalPages: result.totalPages,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  });
});

// Panel de administración: edición de usuario
router.get("/admin/users/:uid/edit", requireAdmin, async (req, res) => {
  const { uid } = req.params;

  if (!isValidObjectId(uid)) return res.status(400).send("ID inválido");

  const user = await userRepository.findById(uid);

  if (!user) return res.status(404).send("Usuario no encontrado");

  res.render("adminUserForm", {
    editUser: { ...new UserDTO(user), isAdminRole: user.role === "admin" },
    isSelf: user.id === res.locals.user.id,
  });
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
