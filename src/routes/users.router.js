import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { userRepository } from "../repositories/user.repository.js";
import { authorization } from "../middlewares/authorization.middleware.js";
import UserDTO from "../dto/user.dto.js";

const router = Router();

const ROLES = ["user", "admin"];

router.use(authorization("admin"));

// Devuelve un mensaje de error si los datos a actualizar no son válidos
function validateUserData({ first_name, last_name, age, email, role }) {
  const isBlank = (value) => typeof value !== "string" || !value.trim();

  if (first_name !== undefined && isBlank(first_name)) return "Nombre inválido";
  if (last_name !== undefined && isBlank(last_name)) return "Apellido inválido";
  if (age !== undefined && (!Number.isInteger(age) || age < 0)) return "Edad inválida";
  if (email !== undefined && (isBlank(email) || !/^\S+@\S+\.\S+$/.test(email))) return "Email inválido";
  if (role !== undefined && !ROLES.includes(role)) return "Rol inválido: debe ser user o admin";

  return null;
}

// Traduce errores de Mongoose a respuestas claras
function handleWriteError(error, res) {
  if (error.code === 11000) {
    return res.status(409).json({ status: "error", message: "Ya existe un usuario con ese email" });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ status: "error", message: "Datos inválidos: " + error.message });
  }

  return res.status(500).json({ status: "error", message: "Error interno del servidor" });
}

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const { limit = 10, page = 1, query } = req.query;

    const result = await userRepository.getPaginated({ limit, page, query });

    res.json({
      status: "success",
      payload: result.docs.map((user) => new UserDTO(user)),
      totalPages: result.totalPages,
      page: result.page,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al obtener los usuarios" });
  }
});

// GET /api/users/:uid
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    if (!isValidObjectId(uid)) return res.status(400).json({ status: "error", message: "ID inválido" });

    const user = await userRepository.findById(uid);

    if (!user) return res.status(404).json({ status: "error", message: "Usuario no encontrado" });

    res.json({ status: "success", payload: new UserDTO(user) });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al obtener el usuario" });
  }
});

// PUT /api/users/:uid
router.put("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    if (!isValidObjectId(uid)) return res.status(400).json({ status: "error", message: "ID inválido" });

    const { first_name, last_name, age, email, role } = req.body;

    if ([first_name, last_name, age, email, role].every((value) => value === undefined)) {
      return res.status(400).json({ status: "error", message: "No hay datos para actualizar" });
    }

    const validationError = validateUserData({ first_name, last_name, age, email, role });

    if (validationError) return res.status(400).json({ status: "error", message: validationError });

    // Evita que el único admin se quite el rol y deje el panel sin acceso
    if (req.user.id === uid && role !== undefined && role !== req.user.role) {
      return res.status(400).json({ status: "error", message: "No podés cambiar tu propio rol" });
    }

    const updated = await userRepository.update(uid, { first_name, last_name, age, email, role });

    if (!updated) return res.status(404).json({ status: "error", message: "Usuario no encontrado" });

    res.json({ status: "success", payload: new UserDTO(updated) });
  } catch (error) {
    handleWriteError(error, res);
  }
});

// DELETE /api/users/:uid
router.delete("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    if (!isValidObjectId(uid)) return res.status(400).json({ status: "error", message: "ID inválido" });

    if (req.user.id === uid) {
      return res.status(400).json({ status: "error", message: "No podés eliminar tu propio usuario" });
    }

    const deleted = await userRepository.remove(uid);

    if (!deleted) return res.status(404).json({ status: "error", message: "Usuario no encontrado" });

    res.json({ status: "success", payload: null });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al eliminar el usuario" });
  }
});

export default router;
