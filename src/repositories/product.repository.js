import ProductDAO from "../dao/product.dao.js";

export default class ProductRepository {
  constructor(dao = new ProductDAO()) {
    this.dao = dao;
  }

  async getAll() {
    return await this.dao.find();
  }

  async getPaginated({ limit = 10, page = 1, query, sort, onlyActive = false }) {
    const filter = {};

    if (query === "true" || query === "false") {
      filter.status = query === "true";
    } else if (query) {
      filter.category = query;
    }

    // La tienda solo muestra productos activos
    if (onlyActive) filter.status = true;

    const options = { limit: Number(limit), page: Number(page) };

    if (sort === "asc" || sort === "desc") {
      options.sort = { price: sort === "asc" ? 1 : -1 };
    }

    return await this.dao.paginate(filter, options);
  }

  async getById(id) {
    return await this.dao.findById(id);
  }

  async create(data) {
    return await this.dao.create({
      title: data.title,
      description: data.description,
      code: data.code,
      price: data.price,
      status: data.status ?? true,
      stock: data.stock,
      category: data.category,
      thumbnails: data.thumbnails ?? [],
    });
  }

  async update(id, data) {
    // No permitimos modificar el id
    const { id: _ignored, _id, ...safeData } = data;
    return await this.dao.findByIdAndUpdate(id, safeData, { returnDocument: "after", runValidators: true });
  }

  async remove(id) {
    const deleted = await this.dao.findByIdAndDelete(id);
    return Boolean(deleted);
  }
}

export const productRepository = new ProductRepository();
