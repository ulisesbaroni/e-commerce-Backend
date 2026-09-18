import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { isValidObjectId } from "mongoose";
import { userRepository } from "../repositories/user.repository.js";
import { sendPasswordResetEmail } from "./mail.service.js";
import { MIN_PASSWORD_LENGTH } from "../config/password.config.js";

// La clave incluye el hash actual: al cambiar la contraseña el enlace deja de ser válido (un solo uso)
function resetSecret(user) {
  return process.env.JWT_SECRET + user.password;
}

export async function requestPasswordReset(email) {
  const user = await userRepository.findByEmail(email);

  // No se revela si el email existe o no
  if (!user) return;

  const token = jwt.sign({ id: user.id, purpose: "password-reset" }, resetSecret(user), { expiresIn: "1h" });
  const baseUrl = process.env.APP_URL || "http://localhost:8080";

  await sendPasswordResetEmail(user, `${baseUrl}/reset-password/${token}`);
}

// Devuelve el usuario dueño del token, o null si es inválido, ya se usó o venció
export async function getUserFromResetToken(token) {
  const payload = jwt.decode(token);

  if (!payload?.id || !isValidObjectId(payload.id)) return null;

  const user = await userRepository.findById(payload.id);

  if (!user) return null;

  try {
    const verified = jwt.verify(token, resetSecret(user));
    return verified.purpose === "password-reset" ? user : null;
  } catch {
    return null;
  }
}

export async function resetPassword(token, newPassword) {
  const user = await getUserFromResetToken(token);

  if (!user) return { ok: false, status: 400, message: "El enlace es inválido o venció. Pedí uno nuevo." };

  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, status: 400, message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` };
  }

  if (bcrypt.compareSync(newPassword, user.password)) {
    return { ok: false, status: 400, message: "La nueva contraseña no puede ser igual a la anterior" };
  }

  await userRepository.updatePassword(user.id, bcrypt.hashSync(newPassword, 10));

  return { ok: true };
}
