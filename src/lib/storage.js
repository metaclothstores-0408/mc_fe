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
  localStorage.removeItem(DTF_COLLECTIONS_KEY);
  localStorage.removeItem(DTF_GROUPS_KEY);
  localStorage.removeItem("mc_enhancer_cache_v1");
  localStorage.removeItem("mc_pending_studio_artwork_v1");
  sessionStorage.removeItem("shade_studio_active_v1");
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
  clearAuth();
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

// Persistent Enhancer Cache across page transitions and back navigation
let enhancerCache = {
  file: null,
  fileName: "",
  enableEnhance: false,
  removeBg: false,
  isPhoto: false,
  outputUrl: null,
  outputBlob: null,
  outputDataUrl: null,
  imageStats: null,
};

export function getEnhancerCache() {
  return enhancerCache;
}

export function updateEnhancerCache(updates) {
  enhancerCache = { ...enhancerCache, ...updates };
  return enhancerCache;
}

export function clearEnhancerCache() {
  if (enhancerCache.outputUrl && enhancerCache.outputUrl.startsWith("blob:")) {
    URL.revokeObjectURL(enhancerCache.outputUrl);
  }
  enhancerCache = {
    file: null,
    fileName: "",
    enableEnhance: false,
    removeBg: false,
    isPhoto: false,
    outputUrl: null,
    outputBlob: null,
    outputDataUrl: null,
    imageStats: null,
  };
}

// In-Memory Transfer Bridge between DTF Enhancer and Studio (bypasses 5MB browser storage limits)
let pendingStudioArtwork = null;

export function setPendingStudioArtwork(art) {
  pendingStudioArtwork = art;
  try {
    if (art) {
      sessionStorage.setItem(
        "shade_pending_studio_meta",
        JSON.stringify({
          name: art.name,
          originalName: art.originalName,
          width: art.width,
          height: art.height,
        })
      );
    } else {
      sessionStorage.removeItem("shade_pending_studio_meta");
    }
  } catch (_) {}
}

export function getPendingStudioArtwork() {
  return pendingStudioArtwork;
}

export function clearPendingStudioArtwork() {
  pendingStudioArtwork = null;
  try {
    sessionStorage.removeItem("shade_pending_studio_meta");
    sessionStorage.removeItem("shade_custom_artwork_data");
  } catch (_) {}
}

// Active Studio Artwork state (retained across client-side route transitions and back navigation)
let activeStudioArtwork = null;
const STUDIO_STORAGE_META_KEY = "shade_studio_active_v1";

export function setActiveStudioArtwork(art) {
  activeStudioArtwork = art;
  try {
    if (art) {
      sessionStorage.setItem(
        STUDIO_STORAGE_META_KEY,
        JSON.stringify({
          dtf: art.dtf,
          cropSettings: art.cropSettings,
          activeVersionId: art.activeVersionId,
          name: art.name,
          originalFilename: art.originalFilename,
          garmentType: art.garment?.type,
          colorHex: art.color?.hex,
          size: art.size
        })
      );
    } else {
      sessionStorage.removeItem(STUDIO_STORAGE_META_KEY);
    }
  } catch (_) {}
}

export function updateActiveStudioArtwork(updates) {
  if (!updates) {
    setActiveStudioArtwork(null);
    return null;
  }
  const merged = { ...(activeStudioArtwork || {}), ...updates };
  setActiveStudioArtwork(merged);
  return merged;
}

export function getActiveStudioArtwork() {
  if (!activeStudioArtwork) {
    try {
      const meta = sessionStorage.getItem(STUDIO_STORAGE_META_KEY);
      if (meta) {
        const parsed = JSON.parse(meta);
        activeStudioArtwork = {
          dtf: parsed.dtf,
          cropSettings: parsed.cropSettings,
          activeVersionId: parsed.activeVersionId,
          name: parsed.name,
          originalFilename: parsed.originalFilename,
          garmentType: parsed.garmentType,
          colorHex: parsed.colorHex,
          size: parsed.size
        };
      }
    } catch (_) {}
  }
  return activeStudioArtwork;
}

// Helper to generate a fast, lightweight thumbnail (< 40KB) for collection saving
export function createThumbnailDataUrl(sourceUrlOrDataUrl, maxDim = 500, quality = 0.82) {
  if (!sourceUrlOrDataUrl) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width || maxDim;
        let h = img.naturalHeight || img.height || maxDim;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        const thumb = canvas.toDataURL("image/webp", quality);
        resolve(thumb.length < sourceUrlOrDataUrl.length ? thumb : canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(sourceUrlOrDataUrl.length > 200000 ? sourceUrlOrDataUrl.slice(0, 50000) : sourceUrlOrDataUrl);
      }
    };
    img.onerror = () => resolve(sourceUrlOrDataUrl);
    img.src = sourceUrlOrDataUrl;
  });
}

export function getDtfCollections() {
  try {
    const list = JSON.parse(localStorage.getItem(DTF_COLLECTIONS_KEY) || "[]");
    return Array.isArray(list)
      ? list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      : [];
  } catch {
    return [];
  }
}

export function saveDtfCollectionItem(item) {
  const list = getDtfCollections();
  const existingIdx = list.findIndex((c) => c.id === item.id);
  const now = new Date().toISOString();
  
  // Ensure lightweight thumbnail payload to prevent QuotaExceededError
  const thumb = item.thumbnailUrl || item.previewDataUrl || item.imageDataUrl;
  const sanitizedItem = {
    ...item,
    collectionGroup: item.collectionGroup && item.collectionGroup.trim() ? item.collectionGroup.trim() : "General",
    updatedAt: now,
    createdAt: item.createdAt || now,
    thumbnailUrl: thumb,
    previewDataUrl: thumb,
    imageDataUrl: thumb,
  };

  if (existingIdx >= 0) {
    list[existingIdx] = sanitizedItem;
  } else {
    list.unshift(sanitizedItem);
  }

  // Safe save with automatic quota overflow pruning
  try {
    localStorage.setItem(DTF_COLLECTIONS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Storage quota limit reached in saveDtfCollectionItem. Trimming heavy payloads...", err);
    try {
      // Keep newest 25 versions and strip any excessive payloads
      const trimmedList = list.slice(0, 25).map((c) => ({
        ...c,
        imageDataUrl: c.imageDataUrl && c.imageDataUrl.length > 150000 ? c.imageDataUrl.slice(0, 1000) : c.imageDataUrl,
        previewDataUrl: c.previewDataUrl && c.previewDataUrl.length > 150000 ? c.previewDataUrl.slice(0, 1000) : c.previewDataUrl,
      }));
      localStorage.setItem(DTF_COLLECTIONS_KEY, JSON.stringify(trimmedList));
      return trimmedList;
    } catch (e2) {
      console.error("Critical storage quota failure:", e2);
    }
  }
  return list;
}

export function deleteDtfCollectionItem(id) {
  const list = getDtfCollections().filter((c) => String(c.id) !== String(id));
  try {
    localStorage.setItem(DTF_COLLECTIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to delete item from storage:", e);
  }
  return list;
}

const DTF_GROUPS_KEY = "mc_dtf_groups_v1";

export function getDtfGroups() {
  try {
    const customGroups = JSON.parse(localStorage.getItem(DTF_GROUPS_KEY) || "[]");
    const items = getDtfCollections();
    const itemGroups = items.map((i) => i.collectionGroup).filter(Boolean);
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
    try {
      const custom = JSON.parse(localStorage.getItem(DTF_GROUPS_KEY) || "[]");
      custom.push(trimmed);
      localStorage.setItem(DTF_GROUPS_KEY, JSON.stringify(custom));
    } catch (_) {}
  }
  return getDtfGroups();
}
