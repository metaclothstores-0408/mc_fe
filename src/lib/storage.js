const CART_KEY = "mc_cart_v1";
const ORDERS_KEY = "mc_orders_v1";
const USER_KEY = "mc_user_v1";
const ACCESS_TOKEN_KEY = "accessToken";

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function makeId(prefix = "MC") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("accessToken");
}

const SESSION_KEY = "mc_session_id_v1";
const DTF_COLLECTIONS_KEY = "mc_dtf_collections_v1";

export function getSessionId() {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = "sess-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function getDtfCollections() {
  try {
    const list = JSON.parse(localStorage.getItem(DTF_COLLECTIONS_KEY) || "[]");
    return Array.isArray(list) ? list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)) : [];
  } catch {
    return [];
  }
}

export function saveDtfCollectionItem(item) {
  const list = getDtfCollections();
  const existingIdx = list.findIndex(c => c.id === item.id);
  const now = new Date().toISOString();
  const fullItem = {
    ...item,
    collectionGroup: item.collectionGroup && item.collectionGroup.trim() ? item.collectionGroup.trim() : "General",
    updatedAt: now,
    createdAt: item.createdAt || now,
  };
  if (existingIdx >= 0) {
    list[existingIdx] = fullItem;
  } else {
    list.unshift(fullItem);
  }
  localStorage.setItem(DTF_COLLECTIONS_KEY, JSON.stringify(list));
  return list;
}

export function deleteDtfCollectionItem(id) {
  const list = getDtfCollections().filter(c => String(c.id) !== String(id));
  localStorage.setItem(DTF_COLLECTIONS_KEY, JSON.stringify(list));
  return list;
}

const DTF_GROUPS_KEY = "mc_dtf_groups_v1";

export function getDtfGroups() {
  try {
    const customGroups = JSON.parse(localStorage.getItem(DTF_GROUPS_KEY) || "[]");
    const items = getDtfCollections();
    const itemGroups = items.map(i => i.collectionGroup).filter(Boolean);
    const combined = Array.from(new Set(["General", ...customGroups, ...itemGroups]));
    return combined;
  } catch {
    return ["General"];
  }
}

export function saveDtfGroup(name) {
  if (!name || typeof name !== "string") return getDtfGroups();
  const trimmed = name.trim();
  if (!trimmed) return getDtfGroups();
  const existing = getDtfGroups();
  if (!existing.includes(trimmed)) {
    const custom = JSON.parse(localStorage.getItem(DTF_GROUPS_KEY) || "[]");
    custom.push(trimmed);
    localStorage.setItem(DTF_GROUPS_KEY, JSON.stringify(custom));
  }
  return getDtfGroups();
}