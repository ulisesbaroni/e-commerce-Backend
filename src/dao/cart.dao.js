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

  findByIdAndDelete(id) {
    return Cart.findByIdAndDelete(id);
  }
}
