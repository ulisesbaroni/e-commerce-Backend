import Product from "../models/product.model.js";

export default class ProductDAO {
  find(filter = {}) {
    return Product.find(filter);
  }

  paginate(filter, options) {
    return Product.paginate(filter, options);
  }

  findById(id) {
    return Product.findById(id);
  }

  create(data) {
    return Product.create(data);
  }

  findByIdAndUpdate(id, data, options) {
    return Product.findByIdAndUpdate(id, data, options);
  }

  findByIdAndDelete(id) {
    return Product.findByIdAndDelete(id);
  }
}
