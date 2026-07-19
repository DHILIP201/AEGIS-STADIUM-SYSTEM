export const API_URL =
  (import.meta as any).env?.VITE_BACKEND_HTTP_URL ??
  "https://aegis-backend-a2mw.onrender.com";

export const WS_URL =
  (import.meta as any).env?.VITE_BACKEND_WS_URL ??
  "wss://aegis-backend-a2mw.onrender.com/ws";
