import CartDAO from "../dao/cart.dao.js";

export default class CartRepository {
  constructor(dao = new CartDAO()) {
    this.dao = dao;
  }

  async create() {
    return await this.dao.create({ products: [] });
  }

  async getById(id) {
    return await this.dao.findById(id);
  }

  async getByIdPopulated(id) {
    return await this.dao.findByIdPopulated(id);
  }

  async remove(id) {
    const deleted = await this.dao.findByIdAndDelete(id);
    return Boolean(deleted);
  }

  // Suma una unidad del producto. Las dos operaciones son atómicas: pedidos simultáneos
  // (por ejemplo un doble clic) no duplican la línea ni pierden cantidad.
  async addProduct(cartId, productId) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const cart =
        (await this.dao.incrementProduct(cartId, productId)) ?? (await this.dao.pushProduct(cartId, productId));

      if (cart) return cart;

      // Si el carrito no existe se termina; si no, otro pedido acaba de crear la línea y se reintenta
      if (!(await this.dao.findById(cartId))) return null;
    }

    return null;
  }

  async removeProduct(cartId, productId) {
    const cart = await this.dao.findById(cartId);

    if (!cart) return null;

    cart.products = cart.products.filter((p) => p.product.toString() !== productId);

    await cart.save();
    return cart;
  }

  async updateProducts(cartId, products) {
    const cart = await this.dao.findById(cartId);

    if (!cart) return null;

    cart.products = products.map((p) => ({ product: p.product, quantity: p.quantity }));

    await cart.save();
    return cart;
  }

  async updateQuantity(cartId, productId, quantity) {
    const cart = await this.dao.findById(cartId);

    if (!cart) return null;

    const item = cart.products.find((p) => p.product.toString() === productId);

    if (!item) return null;

    item.quantity = quantity;

    await cart.save();
    return cart;
  }

  async clear(cartId) {
    const cart = await this.dao.findById(cartId);

    if (!cart) return null;

    cart.products = [];

    await cart.save();
    return cart;
  }
}

export const cartRepository = new CartRepository();
