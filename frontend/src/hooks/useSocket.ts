import { useSyncExternalStore } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

export const getDefaultServerUrl = () => {
  if (typeof window === "undefined") return "http://localhost:3001";
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const host = window.location.hostname;
  return `${protocol}//${host}:3001`;
};

export const normalizeServerUrl = (url: string) => url.trim().replace(/\/+$/, "");

const SERVER_URL = normalizeServerUrl(
  import.meta.env.VITE_WS_URL || getDefaultServerUrl(),
);

let socket: Socket | null = null;
let socketDebugAttached = false;

export function setSocketAuthToken(token: string | null) {
  if (socket && token) {
    socket.auth = { token };
  }
}

export function getSocket() {
  if (!socket) {
    const { token } = useAuthStore.getState();
    socket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: token ? { token } : {},
    });
  }

  if (socket && !socketDebugAttached) {
    socketDebugAttached = true;
    console.info("[socket] init", { serverUrl: SERVER_URL });
    socket.on("connect", () => {
      console.info("[socket] connected", { id: socket?.id, connected: socket?.connected });
    });
    socket.on("disconnect", (reason) => {
      console.warn("[socket] disconnected", { reason });
    });
    socket.on("connect_error", (error) => {
      console.error("[socket] connect_error", {
        message: error.message,
        name: error.name,
      });
    });
    socket.io.on("reconnect_attempt", (attempt) => {
      console.warn("[socket] reconnect_attempt", { attempt });
    });
    socket.io.on("reconnect_error", (error) => {
      console.error("[socket] reconnect_error", { message: error.message });
    });
    socket.io.on("reconnect_failed", () => {
      console.error("[socket] reconnect_failed");
    });
  }

  return socket;
}

const connectSubscribe = (onStoreChange: () => void) => {
  const s = getSocket();
  s.on("connect", onStoreChange);
  s.on("disconnect", onStoreChange);
  return () => {
    s.off("connect", onStoreChange);
    s.off("disconnect", onStoreChange);
  };
};

const getServerSnapshot = () => getSocket().connected;

export function useSocket() {
  const isConnected = useSyncExternalStore(
    connectSubscribe,
    () => getSocket().connected,
    getServerSnapshot,
  );

  return { socket: getSocket(), isConnected };
}
