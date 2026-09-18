import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { ticketRepository } from "../repositories/ticket.repository.js";
import { authorization } from "../middlewares/authorization.middleware.js";
import TicketDTO from "../dto/ticket.dto.js";

const router = Router();

router.use(authorization("user", "admin"));

// GET /api/tickets  (el usuario ve sus compras; el admin ve todas las ventas)
router.get("/", async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const result =
      req.user.role === "admin"
        ? await ticketRepository.getPaginated({ limit, page })
        : await ticketRepository.getPaginatedByUser(req.user.id, { limit, page });

    res.json({
      status: "success",
      payload: result.docs.map((ticket) => new TicketDTO(ticket)),
      totalPages: result.totalPages,
      page: result.page,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al obtener los tickets" });
  }
});

// GET /api/tickets/:tid
router.get("/:tid", async (req, res) => {
  try {
    const { tid } = req.params;

    if (!isValidObjectId(tid)) return res.status(400).json({ status: "error", message: "ID inválido" });

    const ticket = await ticketRepository.getById(tid);

    if (!ticket) return res.status(404).json({ status: "error", message: "Ticket no encontrado" });

    if (req.user.role !== "admin" && ticket.user.toString() !== req.user.id) {
      return res.status(403).json({ status: "error", message: "No tenés acceso a este ticket" });
    }

    res.json({ status: "success", payload: new TicketDTO(ticket) });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al obtener el ticket" });
  }
});

export default router;
