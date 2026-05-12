import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlayerStatus = "idle" | "lobby" | "playing";

export interface OnlineUser {
  odispatchId: string;
  username: string;
  status: PlayerStatus;
  roomCode?: string;
  joinedAt: number;
}

interface AuthState {
  userId: string | null;
  username: string | null;
  token: string | null;
  isAuthenticated: boolean;
  onlineUsers: OnlineUser[];
  authMode: "quick" | "register" | "login";
  authRequest: "idle" | "registering" | "logging_in";
  authError: string | null;
  justRegisteredUsername: string | null;

  setAuth: (userId: string, username: string, token: string) => void;
  startRegister: () => void;
  startLogin: () => void;
  markRegisterSuccess: (username: string) => void;
  markLoginSuccess: (userId: string, username: string, token: string) => void;
  setAuthError: (message: string) => void;
  clearAuthError: () => void;
  consumeRegisterSuccess: () => void;
  clearAuth: () => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  setAuthMode: (mode: "quick" | "register" | "login") => void;
  updateMyStatus: (roomCode?: string) => void;
}

const AUTH_STORAGE_KEY = "lexicon_auth_state";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      username: null,
      token: null,
      isAuthenticated: false,
      onlineUsers: [],
      authMode: "quick",
      authRequest: "idle",
      authError: null,
      justRegisteredUsername: null,

      setAuth: (userId, username, token) => {
        set({
          userId,
          username,
          token,
          isAuthenticated: true,
          authMode: "quick",
          authRequest: "idle",
          authError: null,
          justRegisteredUsername: null,
        });
      },

      startRegister: () => {
        set({
          authRequest: "registering",
          authError: null,
          justRegisteredUsername: null,
        });
      },

      startLogin: () => {
        set({
          authRequest: "logging_in",
          authError: null,
          justRegisteredUsername: null,
        });
      },

      markRegisterSuccess: (username) => {
        set({
          authRequest: "idle",
          authError: null,
          justRegisteredUsername: username,
        });
      },

      markLoginSuccess: (userId, username, token) => {
        set({
          userId,
          username,
          token,
          isAuthenticated: true,
          authMode: "quick",
          authRequest: "idle",
          authError: null,
          justRegisteredUsername: null,
        });
      },

      setAuthError: (message) => {
        set({
          authRequest: "idle",
          authError: message,
        });
      },

      clearAuthError: () => {
        set({ authError: null });
      },

      consumeRegisterSuccess: () => {
        set({ justRegisteredUsername: null });
      },

      clearAuth: () => {
        set({
          userId: null,
          username: null,
          token: null,
          isAuthenticated: false,
          authRequest: "idle",
          authError: null,
          justRegisteredUsername: null,
        });
      },

      setOnlineUsers: (users) => {
        set({ onlineUsers: users });
      },

      setAuthMode: (mode) => {
        set({ authMode: mode });
      },

      updateMyStatus: (roomCode) => {
        const { userId, onlineUsers } = get();
        if (!userId) return;

        const updated = onlineUsers.map((u) => {
          if (u.odispatchId === userId) {
            return {
              ...u,
              status: roomCode ? "lobby" : ("idle" as PlayerStatus),
              roomCode,
            };
          }
          return u;
        });
        set({ onlineUsers: updated });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        userId: state.userId,
        username: state.username,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
