// Resolve the backend base URLs.
// Priority: explicit Vite env var → localhost when running locally →
// the deployed Render backend in production. This means the app works
// deployed even if the Vercel env vars aren't set.
const RENDER_BACKEND = "https://genz-backend-1-nc3c.onrender.com";

const isLocal =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (isLocal ? "http://localhost:5000/api" : `${RENDER_BACKEND}/api`);

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (isLocal ? "http://localhost:5000" : RENDER_BACKEND);
