import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ticketSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    purchase_datetime: { type: Date, default: Date.now },
    amount: { type: Number, required: true, min: 0 },
    purchaser: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Copia de lo comprado: el historial no cambia si después se modifica o borra un producto
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
  },
  { toJSON: { virtuals: true } }
);

ticketSchema.plugin(mongoosePaginate);

export default mongoose.model("Ticket", ticketSchema);
