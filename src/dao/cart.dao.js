import Cart from "../models/cart.model.js";

export default class CartDAO {
  create(data) {
    return Cart.create(data);
  }

  findById(id) {
    return Cart.findById(id);
  }

  findByIdPopulated(id) {
    return Cart.findById(id).populate("products.product");
  }

  // Suma una unidad a la línea existente del producto (null si el carrito no existe o el producto no está)
  incrementProduct(cartId, productId) {
    return Cart.findOneAndUpdate(
      { _id: cartId, "products.product": productId },
      { $inc: { "products.$.quantity": 1 } },
      { returnDocument: "after" }
    );
  }

  // Agrega la línea del producto solo si todavía no existe (null si el carrito no existe o ya estaba)
  pushProduct(cartId, productId) {
    return Cart.findOneAndUpdate(
      { _id: cartId, "products.product": { $ne: productId } },
      { $push: { products: { product: productId, quantity: 1 } } },
      { returnDocument: "after" }
    );
  }

  findByIdAndDelete(id) {
    return Cart.findByIdAndDelete(id);
  }
}
