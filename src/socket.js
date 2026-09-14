import { isValidObjectId } from "mongoose";
import { productRepository } from "./repositories/product.repository.js";

export function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    // Crear producto
    socket.on("crear-producto", async (data) => {
      try {
        await productRepository.create(data);
        const products = await productRepository.getAll();
        io.emit("productos-actualizados", products);
      } catch (error) {
        socket.emit("error-producto", "No se pudo crear el producto: " + error.message);
      }
    });

    // Eliminar producto
    socket.on("eliminar-producto", async (id) => {
      try {
        if (!isValidObjectId(id)) return;

        await productRepository.remove(id);
        const products = await productRepository.getAll();
        io.emit("productos-actualizados", products);
      } catch (error) {
        socket.emit("error-producto", "No se pudo eliminar el producto: " + error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });
}