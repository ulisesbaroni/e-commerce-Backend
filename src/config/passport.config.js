import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcrypt";
import { userRepository } from "../repositories/user.repository.js";
import { cartRepository } from "../repositories/cart.repository.js";

function cookieExtractor(req) {
  return req?.cookies?.token || null;
}

passport.use(
  "register",
  new LocalStrategy({ usernameField: "email", passReqToCallback: true }, async (req, email, password, done) => {
    try {
      const { first_name, last_name, age } = req.body;

      if (!first_name || !last_name || !email || !age || !password) {
        return done(null, false, { message: "Faltan campos obligatorios" });
      }

      const exists = await userRepository.findByEmail(email);

      if (exists) {
        return done(null, false, { message: "El email ya está registrado" });
      }

      const cart = await cartRepository.create();

      const user = await userRepository.create({
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
      const user = await userRepository.findByEmail(email);

      if (!user || !bcrypt.compareSync(password, user.password)) {
        return done(null, false, { message: "Credenciales inválidas" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.use(
  "current",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await userRepository.findById(payload.id);

        if (!user) return done(null, false, { message: "Usuario no encontrado" });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
