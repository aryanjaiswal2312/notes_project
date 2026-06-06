const defaultApiBase =
  typeof window === "undefined"
    ? "http://localhost:4000"
    : `${window.location.protocol}//${window.location.hostname}:4000`;

export const API_BASE = import.meta.env.VITE_API_URL || defaultApiBase;

async function request(path, options = {}) {
  const isForm = options.body instanceof FormData;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {})
      },
      body: isForm || typeof options.body === "string" ? options.body : options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new Error(`Cannot reach backend at ${API_BASE}. Start the backend server and use a local app URL such as http://127.0.0.1:5173.`);
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === "string" ? data : data.message;
    throw new Error(message || "Request failed.");
  }

  return data;
}

export function assetUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

export const api = {
  auth: {
    me: () => request("/api/auth/me"),
    login: (body) => request("/api/auth/login", { method: "POST", body }),
    signup: (body) => request("/api/auth/signup", { method: "POST", body }),
    logout: () => request("/api/auth/logout", { method: "POST" })
  },
  profile: {
    get: () => request("/api/profile"),
    update: (body) => request("/api/profile", { method: "PUT", body }),
    clear: () => request("/api/profile", { method: "DELETE" }),
    avatar: (formData) => request("/api/profile/avatar", { method: "POST", body: formData })
  },
  settings: {
    get: () => request("/api/settings"),
    update: (body) => request("/api/settings", { method: "PUT", body })
  },
  sections: {
    list: (includeArchived = false) => request(`/api/sections?includeArchived=${includeArchived}`),
    create: (body) => request("/api/sections", { method: "POST", body }),
    update: (id, body) => request(`/api/sections/${id}`, { method: "PUT", body }),
    archive: (id, archived = true) => request(`/api/sections/${id}/archive`, { method: "PATCH", body: { archived } }),
    remove: (id) => request(`/api/sections/${id}`, { method: "DELETE" })
  },
  notes: {
    list: (params = {}) => {
      const query = new URLSearchParams(params);
      return request(`/api/notes?${query.toString()}`);
    },
    create: (body) => request("/api/notes", { method: "POST", body }),
    update: (id, body) => request(`/api/notes/${id}`, { method: "PUT", body }),
    remove: (id) => request(`/api/notes/${id}`, { method: "DELETE" })
  },
  tasks: {
    list: () => request("/api/tasks"),
    create: (body) => request("/api/tasks", { method: "POST", body }),
    update: (id, body) => request(`/api/tasks/${id}`, { method: "PUT", body }),
    complete: (id, completed) => request(`/api/tasks/${id}/complete`, { method: "PATCH", body: { completed } }),
    remove: (id) => request(`/api/tasks/${id}`, { method: "DELETE" })
  },
  gallery: {
    list: () => request("/api/gallery"),
    upload: (formData) => request("/api/gallery", { method: "POST", body: formData }),
    remove: (id) => request(`/api/gallery/${id}`, { method: "DELETE" }),
    downloadUrl: (id) => `${API_BASE}/api/gallery/${id}/download`
  },
  admin: {
    stats: () => request("/api/admin/stats"),
    users: (search = "") => request(`/api/admin/users?search=${encodeURIComponent(search)}`),
    user: (id) => request(`/api/admin/users/${id}`),
    updateUser: (id, body) => request(`/api/admin/users/${id}`, { method: "PUT", body }),
    status: (id, status) => request(`/api/admin/users/${id}/status`, { method: "PATCH", body: { status } }),
    removeUser: (id) => request(`/api/admin/users/${id}`, { method: "DELETE" }),
    activity: () => request("/api/admin/activity")
  }
};
