import User from "../models/user.model.js";

export default class UserDAO {
  findByEmail(email) {
    return User.findOne({ email });
  }

  findById(id) {
    return User.findById(id);
  }

  paginate(filter, options) {
    return User.paginate(filter, options);
  }

  create(data) {
    return User.create(data);
  }

  findByIdAndUpdate(id, data, options) {
    return User.findByIdAndUpdate(id, data, options);
  }

  findByIdAndDelete(id) {
    return User.findByIdAndDelete(id);
  }
}
