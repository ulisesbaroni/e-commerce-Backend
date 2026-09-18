import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import { ensureAdminUser } from "./config/admin.config.js";
import { productRepository } from "./repositories/product.repository.js";

const products = [
  { title: "Remera básica negra", description: "Remera de algodón peinado, corte clásico.", code: "REM-001", price: 12900, stock: 25, category: "remeras" },
  { title: "Remera básica blanca", description: "Remera de algodón peinado, corte clásico.", code: "REM-002", price: 12900, stock: 30, category: "remeras" },
  { title: "Remera estampada", description: "Remera con estampa frontal, algodón 100%.", code: "REM-003", price: 15900, stock: 12, category: "remeras" },
  { title: "Buzo canguro gris", description: "Buzo con capucha y bolsillo canguro, frisa liviana.", code: "BUZ-001", price: 34900, stock: 8, category: "buzos" },
  { title: "Buzo con cierre", description: "Buzo abierto con cierre completo y bolsillos laterales.", code: "BUZ-002", price: 39900, stock: 5, category: "buzos" },
  { title: "Buzo temporada anterior", description: "Producto desactivado: no se muestra en la tienda.", code: "BUZ-000", price: 24900, stock: 2, category: "buzos", status: false },
  { title: "Gorra visera plana", description: "Gorra ajustable de gabardina.", code: "ACC-001", price: 8900, stock: 20, category: "accesorios" },
  { title: "Medias deportivas (pack x3)", description: "Pack de tres pares de medias deportivas.", code: "ACC-002", price: 5900, stock: 40, category: "accesorios" },
  { title: "Campera rompeviento", description: "Campera impermeable liviana. Stock limitado.", code: "CAM-001", price: 59900, stock: 3, category: "camperas" },
];

await connectDB();
await ensureAdminUser();

const { totalDocs } = await productRepository.getPaginated({ limit: 1 });

if (totalDocs > 0) {
  console.log(`El catálogo ya tiene ${totalDocs} productos: no se cargó nada`);
} else {
  for (const product of products) await productRepository.create(product);
  console.log(`Se cargaron ${products.length} productos de ejemplo`);
}

await mongoose.disconnect();
