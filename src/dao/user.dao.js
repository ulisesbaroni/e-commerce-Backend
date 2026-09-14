import User from "../models/user.model.js";

export default class UserDAO {
  findByEmail(email) {
    return User.findOne({ email });
  }

  findById(id) {
    return User.findById(id);
  }

  create(data) {
    return User.create(data);
  }
}
