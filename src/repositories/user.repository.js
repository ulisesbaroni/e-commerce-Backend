import UserDAO from "../dao/user.dao.js";
import { cartRepository } from "./cart.repository.js";

export default class UserRepository {
  constructor(dao = new UserDAO(), carts = cartRepository) {
    this.dao = dao;
    this.carts = carts;
  }

  async findByEmail(email) {
    return await this.dao.findByEmail(email);
  }

  async findById(id) {
    return await this.dao.findById(id);
  }

  async create(data) {
    return await this.dao.create(data);
  }

  // `query` filtra por rol ("admin"/"user") o por texto dentro del email
  async getPaginated({ limit = 10, page = 1, query }) {
    const filter = {};

    if (query === "admin" || query === "user") {
      filter.role = query;
    } else if (query) {
      filter.email = { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }

    return await this.dao.paginate(filter, { limit: Number(limit), page: Number(page), sort: { email: 1 } });
  }

  async update(id, data) {
    const user = await this.dao.findById(id);

    if (!user) return null;

    const { first_name, last_name, age, email, role } = data;
    const changes = Object.fromEntries(
      Object.entries({ first_name, last_name, age, email, role }).filter(([, value]) => value !== undefined)
    );

    // Un usuario que antes no compraba (admin) necesita un carrito propio al pasar a "user"
    if (changes.role === "user" && !user.cart) {
      const cart = await this.carts.create();
      changes.cart = cart.id;
    }

    return await this.dao.findByIdAndUpdate(id, changes, { returnDocument: "after", runValidators: true });
  }

  // Recibe la contraseña ya hasheada; `update` no permite tocar este campo a propósito
  async updatePassword(id, hashedPassword) {
    return await this.dao.findByIdAndUpdate(id, { password: hashedPassword }, { returnDocument: "after" });
  }

  async remove(id) {
    const user = await this.dao.findById(id);

    if (!user) return false;

    if (user.cart) await this.carts.remove(user.cart);

    await this.dao.findByIdAndDelete(id);
    return true;
  }
}

export const userRepository = new UserRepository();
