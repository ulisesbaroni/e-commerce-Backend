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

  async addProduct(cartId, productId) {
    const cart = await this.dao.findById(cartId);

    if (!cart) return null;

    const existing = cart.products.find((p) => p.product.toString() === productId);

    if (existing) {
      // Si ya existe, sumamos una unidad
      existing.quantity += 1;
    } else {
      cart.products.push({ product: productId, quantity: 1 });
    }

    await cart.save();
    return cart;
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
