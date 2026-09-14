import UserDAO from "../dao/user.dao.js";

export default class UserRepository {
  constructor(dao = new UserDAO()) {
    this.dao = dao;
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
}

export const userRepository = new UserRepository();
