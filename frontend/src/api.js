// Set VITE_API_URL to your deployed backend URL once Render gives you one,
// e.g. "https://paperloop-backend.onrender.com"
// For local testing it falls back to localhost.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authHeaders() {
  const token = localStorage.getItem("paperloop_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  async login(code, password) {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, password }),
    });
    return handle(res);
  },

  async me() {
    const res = await fetch(`${API_BASE}/api/me`, { headers: authHeaders() });
    return handle(res);
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/api/stats`);
    return handle(res);
  },

  async getLogs() {
    const res = await fetch(`${API_BASE}/api/logs`);
    return handle(res);
  },

  async createLog(waste_type, kg) {
    const res = await fetch(`${API_BASE}/api/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ waste_type, kg }),
    });
    return handle(res);
  },
};
