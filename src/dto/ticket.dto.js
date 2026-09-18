import { roundMoney } from "../utils/format.js";

export default class TicketDTO {
  constructor(ticket) {
    this.id = ticket.id;
    this.code = ticket.code;
    this.purchase_datetime = ticket.purchase_datetime;
    this.amount = ticket.amount;
    this.purchaser = ticket.purchaser;
    this.products = ticket.products.map((item) => ({
      product: item.product,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      subtotal: roundMoney(item.price * item.quantity),
    }));
  }
}
