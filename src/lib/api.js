const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";

async function request(path, options = {}) {
  const token = localStorage.getItem("accessToken");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Request failed";

    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch (_) {}

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // =========================
  // AUTH
  // =========================

  adminLogin: (data) =>
    request("/api/v1/auth/admin/signin", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // =========================
  // PRODUCTS
  // =========================

  getProducts: () =>
    request("/api/v1/products/customizable"),

  getProductReviews: (productId) =>
    request(`/api/v1/products/${productId}/reviews`),

  getProductRating: (productId) =>
    request(`/api/v1/products/${productId}/rating`),

  createReview: (productId, data) =>
    request(`/api/v1/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteReview: (productId) =>
    request(`/api/v1/products/${productId}/reviews`, {
      method: "DELETE",
    }),

  // =========================
  // AVATARS
  // =========================

  getAvatars: () =>
    request("/api/v1/avatars"),

  // =========================
  // ADMIN CATALOG
  // =========================

  createProduct: (data) =>
    request("/api/v1/admin/catalog/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createAvatar: (data) =>
    request("/api/v1/admin/catalog/avatars", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProductStatus: (id, active) =>
    request(
      `/api/v1/admin/catalog/products/${id}/active?active=${active}`,
      {
        method: "PATCH",
      }
    ),

  updateAvatarStatus: (id, active) =>
    request(
      `/api/v1/admin/catalog/avatars/${id}/active?active=${active}`,
      {
        method: "PATCH",
      }
    ),

  // =========================
  // ADMIN
  // =========================

  getAdminDashboardStats: () =>
    request("/api/v1/admin/dashboard/stats"),

  getAdminOrders: () =>
    request("/api/v1/admin/orders"),

  updateOrderStatus: (id, status) =>
    request(`/api/v1/admin/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  // =========================
  // USER
  // =========================

  getMe: () =>
    request("/api/v1/me"),
};