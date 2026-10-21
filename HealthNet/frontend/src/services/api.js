import axios from "axios";
import { getAuthToken } from "../utils/authStorage";

// Use relative URL so it works with:
//   - localhost (React proxy forwards /api -> localhost:5000)
//   - ngrok tunnel (same proxy applies)
//   - cloudflare tunnel (same proxy applies)
//   - direct LAN access (falls back to same-host:5000)
const getBaseURL = () => {
  const configuredBaseURL = process.env.REACT_APP_API_BASE_URL;
  if (configuredBaseURL) {
    return configuredBaseURL.replace(/\/$/, "");
  }

  const host = window.location.hostname;
  // If accessed via localhost, ngrok, or cloudflare tunnel, use relative path (proxy handles it)
  if (host === "localhost" || host === "127.0.0.1" || host.includes("ngrok") || host.includes("trycloudflare") || host.includes("cloudflare")) {
    return "/api";
  }
  // LAN access — direct to backend port
  return `http://${host}:5000/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Important for file uploads: let browser set multipart boundary automatically.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }

  return config;
});

export default api;
