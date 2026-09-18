import bcrypt from "bcrypt";
import { userRepository } from "../repositories/user.repository.js";

// Crea el usuario administrador inicial a partir del .env si todavía no existe
export async function ensureAdminUser() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn("ADMIN_EMAIL y ADMIN_PASSWORD no están definidos: no se creó el administrador inicial");
    return;
  }

  try {
    const exists = await userRepository.findByEmail(ADMIN_EMAIL);

    if (exists) return;

    await userRepository.create({
      first_name: "Admin",
      last_name: "Tienda",
      email: ADMIN_EMAIL,
      age: 30,
      password: bcrypt.hashSync(ADMIN_PASSWORD, 10),
      role: "admin",
    });

    console.log(`Administrador inicial creado: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error("No se pudo crear el administrador inicial:", error.message);
  }
}
