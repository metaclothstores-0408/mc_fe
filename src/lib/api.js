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

  updateProfile: (data) =>
  request("/api/v1/me/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  }),

getAdminUsers: () =>
  request("/api/v1/admin/users"),

deleteAdminUser: (id) =>
  request(`/api/v1/admin/users/${id}`, {
    method: "DELETE",
  }),

  // =========================
  // ORDERS (incl. DTF payload)
  // =========================
  createOrder: (data) =>
    request("/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  myOrders: () => request("/api/v1/orders/my-orders"),

  trackOrder: (id) => request(`/api/v1/orders/${id}/track`),

  // DTF production asset (generated async server-side)
  getDtfAsset: (orderId, itemId) =>
    request(`/api/v1/orders/${orderId}/items/${itemId}/dtf-asset`),

  getDtfFileUrl: (orderId, itemId) =>
    `${API_BASE}/api/v1/orders/${orderId}/items/${itemId}/dtf-file`,

  // On-demand high-res render — isolated middleware pipeline
  // Returns a Blob; caller triggers native download.
  downloadDtfPng: async (payload) => {
    const token = localStorage.getItem("accessToken");
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/v1/dtf/download`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      let msg = "DTF render failed";
      try { const j = await res.json(); msg = j.message || j.error || msg; } catch (_) {}
      throw new Error(msg);
    }
    return await res.blob();
  },
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function getGoogleOAuthSession() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/auth/google/session`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to complete Google authentication."
    );
  }

  return data;
}

export function startGoogleOAuth() {
  window.location.href =
    `${API_BASE_URL}/api/v1/auth/google/start`;
}