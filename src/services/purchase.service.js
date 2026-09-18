import { cartRepository } from "../repositories/cart.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { ticketRepository } from "../repositories/ticket.repository.js";
import { roundMoney } from "../utils/format.js";

// Compra los productos del carrito que tengan stock. Cada producto se compra completo o queda en el carrito.
export async function purchaseCart(cartId, user) {
  const cart = await cartRepository.getById(cartId);

  if (!cart) return { ok: false, status: 404, message: "Carrito no encontrado" };
  if (cart.products.length === 0) return { ok: false, status: 400, message: "El carrito está vacío" };

  // Una sola consulta para traer todos los productos del carrito
  const products = await productRepository.getByIds(cart.products.map((item) => item.product));
  const productsById = new Map(products.map((product) => [product.id, product]));

  const purchased = [];
  const notPurchased = [];
  const remaining = [];

  for (const item of cart.products) {
    const productId = item.product.toString();
    const product = productsById.get(productId);

    if (!product || !product.status) {
      notPurchased.push({ product: productId, title: product?.title ?? null, quantity: item.quantity, reason: "Producto no disponible" });
      remaining.push({ product: item.product, quantity: item.quantity });
      continue;
    }

    const reserved = await productRepository.reserveStock(productId, item.quantity);

    if (!reserved) {
      notPurchased.push({ product: productId, title: product.title, quantity: item.quantity, reason: "Stock insuficiente" });
      remaining.push({ product: item.product, quantity: item.quantity });
      continue;
    }

    purchased.push({ product: productId, title: reserved.title, price: reserved.price, quantity: item.quantity });
  }

  if (purchased.length === 0) {
    return { ok: false, status: 409, message: "No se pudo comprar ningún producto del carrito", notPurchased };
  }

  const amount = roundMoney(purchased.reduce((total, item) => total + item.price * item.quantity, 0));

  let ticket;

  try {
    ticket = await ticketRepository.create({ amount, purchaser: user.email, user: user.id, products: purchased });
  } catch (error) {
    // Si no se pudo generar el ticket se devuelve el stock reservado
    await Promise.all(purchased.map((item) => productRepository.restoreStock(item.product, item.quantity)));
    throw error;
  }

  // El carrito conserva solo lo que no se pudo comprar
  await cartRepository.updateProducts(cartId, remaining);

  return { ok: true, ticket, notPurchased, complete: notPurchased.length === 0 };
}
