import { useState, useEffect, useRef, useCallback } from 'react';
import { AegisState } from '../types/aegis';
import { BACKEND_WS_URL } from '../config';

export function useAegisWebSocket() {
  const [state, setState] = useState<AegisState | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1000);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(BACKEND_WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        setConnected(true);
        reconnectDelay.current = 1000;
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AegisState;
          setState(data);
        } catch (e) {
          /* ignore parse errors */
        }
      };
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 5000);
          connect();
        }, reconnectDelay.current);
      };
      ws.onerror = () => ws.close();
    } catch (e) {
      reconnectTimer.current = setTimeout(connect, reconnectDelay.current);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const sendMessage = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { state, connected, sendMessage, reconnect: connect };
}
