"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

// ── Types ──────────────────────────────────────────────────────────────────

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

// ── Context ────────────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

// ── Provider ───────────────────────────────────────────────────────────────
// Mount this once in layout.tsx, wrapping the entire app.
// It creates a single socket connection that persists across page navigation.
// The socket reconnects automatically if the connection drops.

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only create the socket once
    if (socketRef.current) return;

    const SOCKET_URL =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:8000";

    const socket = io(SOCKET_URL, {
      // Send cookies with the handshake so socketAuthMiddleware can verify the user
      withCredentials: true,
      // Try WebSocket first, fall back to long-polling
      transports: ["websocket", "polling"],
      // Reconnect automatically on disconnect
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      console.info(`[Socket] Connected: ${socket.id}`);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.info(`[Socket] Disconnected: ${reason}`);
    });

    socket.on("connect_error", (err) => {
      console.warn(`[Socket] Connection error: ${err.message}`);
    });

    socketRef.current = socket;

    // Cleanup on app unmount (rare, but correct)
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSocket() {
  return useContext(SocketContext);
}
