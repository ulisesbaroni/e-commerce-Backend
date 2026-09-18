import crypto from "crypto";
import TicketDAO from "../dao/ticket.dao.js";

// Código legible y difícil de adivinar, por ejemplo TCK-MK3F9Z-A1B2C3
function generateCode() {
  return `TCK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export default class TicketRepository {
  constructor(dao = new TicketDAO()) {
    this.dao = dao;
  }

  async create({ amount, purchaser, user, products }) {
    return await this.dao.create({ code: generateCode(), amount, purchaser, user, products });
  }

  async getById(id) {
    return await this.dao.findById(id);
  }

  // Todas las ventas, de la más reciente a la más antigua (vista del admin)
  async getPaginated({ limit = 10, page = 1 }) {
    return await this.dao.paginate({}, { limit: Number(limit), page: Number(page), sort: { purchase_datetime: -1 } });
  }

  // Las compras de un usuario
  async getPaginatedByUser(userId, { limit = 10, page = 1 }) {
    return await this.dao.paginate(
      { user: userId },
      { limit: Number(limit), page: Number(page), sort: { purchase_datetime: -1 } }
    );
  }
}

export const ticketRepository = new TicketRepository();
