const CART_KEY = "mc_cart_v1";
const ORDERS_KEY = "mc_orders_v1";
const USER_KEY = "mc_user_v1";

export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
}
export function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

export function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"); } catch { return []; }
}
export function saveOrders(orders) { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }

export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}
export function saveUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }

export function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function makeId(prefix = "MC") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}