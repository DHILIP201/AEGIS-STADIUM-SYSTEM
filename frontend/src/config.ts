const isProd = (import.meta as any).env?.PROD;

// Live Render backend URL: aegis-backend-a2mv.onrender.com
export const BACKEND_HTTP_URL = (import.meta as any).env?.VITE_BACKEND_HTTP_URL || 
  (isProd ? 'https://aegis-backend-a2mv.onrender.com' : 'http://localhost:8000');

export const BACKEND_WS_URL = (import.meta as any).env?.VITE_BACKEND_WS_URL || 
  (isProd ? 'wss://aegis-backend-a2mv.onrender.com/ws' : 'ws://localhost:8000/ws');
