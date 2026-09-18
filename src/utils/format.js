export function roundMoney(amount) {
  return Math.round(amount * 100) / 100;
}

export function formatDate(date) {
  return new Date(date).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}
