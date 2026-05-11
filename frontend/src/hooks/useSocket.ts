import { useSyncExternalStore } from "react";
import { io, Socket } from "socket.io-client";

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

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      withCredentials: true,
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
