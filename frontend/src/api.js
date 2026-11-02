// The API base URL comes from the VITE_API_URL environment variable at build time.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Token ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data.detail || Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" ") || "Request failed";
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (user) => request("/auth/register/", { method: "POST", body: user }),
  login: (creds) => request("/auth/login/", { method: "POST", body: creds }),
  logout: (token) => request("/auth/logout/", { method: "POST", token }),
  listItems: (token, status) =>
    request(`/workflows/${status ? `?status=${status}` : ""}`, { token }),
  createItem: (token, item) => request("/workflows/", { method: "POST", body: item, token }),
  updateItem: (token, id, changes) =>
    request(`/workflows/${id}/`, { method: "PATCH", body: changes, token }),
  deleteItem: (token, id) => request(`/workflows/${id}/`, { method: "DELETE", token }),
};
