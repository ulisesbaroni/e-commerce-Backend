import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { productRepository } from "../repositories/product.repository.js";

const router = Router();

// Traduce errores de validación/casteo de Mongoose a un 400 con mensaje claro
function handleWriteError(error, res) {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ error: "Datos inválidos: " + error.message });
  }

  return res.status(500).json({ error: "Error interno del servidor" });
}

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const { limit = 10, page = 1, query, sort } = req.query;

    const result = await productRepository.getPaginated({ limit, page, query, sort });

    const buildLink = (targetPage) => {
      if (!targetPage) return null;
      const params = new URLSearchParams({ ...req.query, limit, page: targetPage });
      return `${req.baseUrl}?${params.toString()}`;
    };

    res.json({
      status: "success",
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: buildLink(result.prevPage),
      nextLink: buildLink(result.nextPage),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al obtener productos" });
  }
});

// GET /api/products/:pid
router.get("/:pid", async (req, res) => {
  try {
    const id = req.params.pid;

    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    const product = await productRepository.getById(id);

    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el producto" });
  }
});

// POST /api/products
router.post("/", async (req, res) => {
  try {
    const { title, description, code, price, status, stock, category, thumbnails } = req.body;

    // Validamos los campos obligatorios
    if (!title || !description || !code || price == null || stock == null || !category) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const product = await productRepository.create({ title, description, code, price, status, stock, category, thumbnails });
    res.status(201).json(product);
  } catch (error) {
    handleWriteError(error, res);
  }
});

// PUT /api/products/:pid
router.put("/:pid", async (req, res) => {
  try {
    const id = req.params.pid;

    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    const updated = await productRepository.update(id, req.body);

    if (!updated) return res.status(404).json({ error: "Producto no encontrado" });

    res.json(updated);
  } catch (error) {
    handleWriteError(error, res);
  }
});

// DELETE /api/products/:pid
router.delete("/:pid", async (req, res) => {
  try {
    const id = req.params.pid;

    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    const deleted = await productRepository.remove(id);

    if (!deleted) return res.status(404).json({ error: "Producto no encontrado" });

    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
});

export default router;
