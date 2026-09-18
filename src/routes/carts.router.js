import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { cartRepository } from "../repositories/cart.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { authorization, ownCart } from "../middlewares/authorization.middleware.js";
import { purchaseCart } from "../services/purchase.service.js";
import TicketDTO from "../dto/ticket.dto.js";

const router = Router();

// POST /api/carts
router.post("/", async (req, res) => {
  try {
    const cart = await cartRepository.create();
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el carrito" });
  }
});

// GET /api/carts/:cid
router.get("/:cid", authorization("user"), ownCart, async (req, res) => {
  try {
    const id = req.params.cid;

    if (!isValidObjectId(id)) return res.status(400).json({ status: "error", message: "ID inválido" });

    const cart = await cartRepository.getByIdPopulated(id);

    if (!cart) return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

    res.json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al obtener el carrito" });
  }
});

// POST /api/carts/:cid/product/:pid
router.post("/:cid/product/:pid", authorization("user"), ownCart, async (req, res) => {
  try {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    if (!isValidObjectId(cartId) || !isValidObjectId(productId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const product = await productRepository.getById(productId);

    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    if (!product.status) return res.status(409).json({ error: "El producto no está disponible" });

    const cart = await cartRepository.addProduct(cartId, productId);

    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: "Error al agregar producto al carrito" });
  }
});

// POST /api/carts/:cid/purchase
router.post("/:cid/purchase", authorization("user"), ownCart, async (req, res) => {
  try {
    const result = await purchaseCart(req.params.cid, req.user);

    if (!result.ok) {
      return res.status(result.status).json({ status: "error", message: result.message, notPurchased: result.notPurchased });
    }

    res.json({
      status: "success",
      payload: { ticket: new TicketDTO(result.ticket), complete: result.complete, notPurchased: result.notPurchased },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al procesar la compra" });
  }
});

// DELETE /api/carts/:cid/products/:pid
router.delete("/:cid/products/:pid", authorization("user"), ownCart, async (req, res) => {
  try {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    if (!isValidObjectId(cartId) || !isValidObjectId(productId)) {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }

    const cart = await cartRepository.removeProduct(cartId, productId);

    if (!cart) return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

    res.json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al eliminar el producto del carrito" });
  }
});

// PUT /api/carts/:cid
router.put("/:cid", authorization("user"), ownCart, async (req, res) => {
  try {
    const cartId = req.params.cid;
    const { products } = req.body;

    if (!isValidObjectId(cartId)) return res.status(400).json({ status: "error", message: "ID inválido" });

    if (!Array.isArray(products)) {
      return res.status(400).json({ status: "error", message: "Se espera un array de productos" });
    }

    const isValidItem = (p) => isValidObjectId(p.product) && typeof p.quantity === "number" && p.quantity >= 1;

    if (!products.every(isValidItem)) {
      return res.status(400).json({ status: "error", message: "Cada producto debe tener un id válido y una cantidad mayor a 0" });
    }

    const cart = await cartRepository.updateProducts(cartId, products);

    if (!cart) return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

    res.json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al actualizar el carrito" });
  }
});

// PUT /api/carts/:cid/products/:pid
router.put("/:cid/products/:pid", authorization("user"), ownCart, async (req, res) => {
  try {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    const { quantity } = req.body;

    if (!isValidObjectId(cartId) || !isValidObjectId(productId)) {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }

    if (typeof quantity !== "number" || quantity < 1) {
      return res.status(400).json({ status: "error", message: "Cantidad inválida" });
    }

    const cart = await cartRepository.updateQuantity(cartId, productId, quantity);

    if (!cart) return res.status(404).json({ status: "error", message: "Carrito o producto no encontrado" });

    res.json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al actualizar la cantidad" });
  }
});

// DELETE /api/carts/:cid
router.delete("/:cid", authorization("user"), ownCart, async (req, res) => {
  try {
    const cartId = req.params.cid;

    if (!isValidObjectId(cartId)) return res.status(400).json({ status: "error", message: "ID inválido" });

    const cart = await cartRepository.clear(cartId);

    if (!cart) return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

    res.json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al vaciar el carrito" });
  }
});

export default router;
