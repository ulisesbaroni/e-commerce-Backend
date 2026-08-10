import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import * as CartManager from "../managers/CartManager.js";

passport.use(
  "register",
  new LocalStrategy({ usernameField: "email", passReqToCallback: true }, async (req, email, password, done) => {
    try {
      const { first_name, last_name, age } = req.body;

      if (!first_name || !last_name || !email || !age || !password) {
        return done(null, false, { message: "Faltan campos obligatorios" });
      }

      const exists = await User.findOne({ email });

      if (exists) {
        return done(null, false, { message: "El email ya está registrado" });
      }

      const cart = await CartManager.create();

      const user = await User.create({
        first_name,
        last_name,
        email,
        age,
        password: bcrypt.hashSync(password, 10),
        cart: cart.id,
      });

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.use(
  "login",
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email });

      if (!user || !bcrypt.compareSync(password, user.password)) {
        return done(null, false, { message: "Credenciales inválidas" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

export default passport;
