import type { Socket } from "socket.io";
import type { Server } from "socket.io";
import {
  registerUser,
  loginUser,
  attachSessionToSocket,
  detachSocket,
  updateOnlineStatus,
  removeOnlineUser,
  getOnlineUsers,
  isUsernameAvailable,
  getUserIdBySocketId,
} from "../auth/userManager";
import { checkRateLimit } from "../lib/security";
import { z } from "zod";
import { validatePayload } from "../lib/security";

const registerSchema = z.object({
  username: z.string().min(2).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(4).max(32),
});

const loginSchema = z.object({
  username: z.string().min(2).max(20),
  password: z.string().min(1),
});

function broadcastOnlineUsers(io: Server) {
  const users = getOnlineUsers();
  io.emit("ONLINE_USERS", { users });
}

type AuthAck = {
  ok: boolean;
  code: string;
  message?: string;
};

function invokeAck(ack: unknown, response: AuthAck) {
  if (typeof ack !== "function") return;
  try {
    (ack as (payload: AuthAck) => void)(response);
  } catch (error) {
    console.error("[auth] failed to send ack", { error });
  }
}

export function setupAuthHandlers(io: Server, socket: Socket): void {
  socket.on(
    "REGISTER",
    (data: unknown, ack?: (response: AuthAck) => void) => {
      try {
      console.info("[auth/register] incoming", { socketId: socket.id, data });
        if (!checkRateLimit(socket.id, "REGISTER")) {
          console.warn("[auth/register] blocked by rate limit", { socketId: socket.id });
          const message = "Terlalu banyak request. Coba beberapa saat lagi.";
          socket.emit("AUTH_ERROR", { message });
          invokeAck(ack, { ok: false, code: "rate_limited", message });
          return;
        }

        const validation = validatePayload(registerSchema, data);
        if (!validation.valid) {
          console.warn("[auth/register] payload invalid", {
            socketId: socket.id,
            error: validation.error,
          });
          socket.emit("AUTH_ERROR", { message: validation.error });
          invokeAck(ack, { ok: false, code: "invalid_payload", message: validation.error });
          return;
        }

        const { username, password } = validation.data;
        const result = registerUser(username, password);

        if (!result.success) {
          console.warn("[auth/register] register failed", {
            socketId: socket.id,
            username,
            error: result.error,
          });
          socket.emit("AUTH_ERROR", { message: result.error });
          invokeAck(ack, { ok: false, code: "register_failed", message: result.error });
          return;
        }

        attachSessionToSocket(socket.id, result.token);
        updateOnlineStatus(socket.id, "idle", undefined, username);

        socket.emit("USER_REGISTERED", {
          token: result.token,
          userId: result.userId,
          username: username.slice(0, 20),
        });

        broadcastOnlineUsers(io);
        console.log(`User registered: ${username} (${result.userId})`);
        invokeAck(ack, { ok: true, code: "registered" });
      } catch (error) {
        console.error("[auth/register] unexpected error", { socketId: socket.id, error });
        const message = "Terjadi kesalahan server saat register.";
        socket.emit("AUTH_ERROR", { message });
        invokeAck(ack, { ok: false, code: "server_error", message });
      }
    },
  );

  socket.on("LOGIN", (data: unknown, ack?: (response: AuthAck) => void) => {
    try {
      console.info("[auth/login] incoming", { socketId: socket.id, data });
      if (!checkRateLimit(socket.id, "LOGIN")) {
        console.warn("[auth/login] blocked by rate limit", { socketId: socket.id });
        const message = "Terlalu banyak request. Coba beberapa saat lagi.";
        socket.emit("AUTH_ERROR", { message });
        invokeAck(ack, { ok: false, code: "rate_limited", message });
        return;
      }

      const validation = validatePayload(loginSchema, data);
      if (!validation.valid) {
        console.warn("[auth/login] payload invalid", {
          socketId: socket.id,
          error: validation.error,
        });
        socket.emit("AUTH_ERROR", { message: validation.error });
        invokeAck(ack, { ok: false, code: "invalid_payload", message: validation.error });
        return;
      }

      const { username, password } = validation.data;
      const result = loginUser(username, password);

      if (!result.success) {
        console.warn("[auth/login] login failed", {
          socketId: socket.id,
          username,
          error: result.error,
        });
        socket.emit("AUTH_ERROR", { message: result.error });
        invokeAck(ack, { ok: false, code: "login_failed", message: result.error });
        return;
      }

      attachSessionToSocket(socket.id, result.token);
      updateOnlineStatus(socket.id, "idle", undefined, result.username);

      socket.emit("USER_LOGGED_IN", {
        token: result.token,
        userId: result.userId,
        username: result.username,
      });

      broadcastOnlineUsers(io);
      console.log(`User logged in: ${result.username} (${result.userId})`);
      invokeAck(ack, { ok: true, code: "logged_in" });
    } catch (error) {
      console.error("[auth/login] unexpected error", { socketId: socket.id, error });
      const message = "Terjadi kesalahan server saat login.";
      socket.emit("AUTH_ERROR", { message });
      invokeAck(ack, { ok: false, code: "server_error", message });
    }
  });

  socket.on("LOGOUT", () => {
    const userId = getUserIdBySocketId(socket.id);
    removeOnlineUser(socket.id);
    detachSocket(socket.id);

    socket.emit("USER_LOGGED_OUT", { success: true });
    broadcastOnlineUsers(io);

    if (userId) {
      console.log(`User logged out: ${userId}`);
    }
  });

  socket.on("UPDATE_STATUS", (data: unknown) => {
    const schema = z.object({
      status: z.enum(["idle", "lobby", "playing"]),
      roomCode: z.string().max(5).optional(),
    });

    const validation = validatePayload(schema, data);
    if (!validation.valid) return;

    const { status, roomCode } = validation.data;
    updateOnlineStatus(socket.id, status, roomCode);
    broadcastOnlineUsers(io);
  });

  socket.on("CHECK_USERNAME", (data: unknown) => {
    const schema = z.object({ username: z.string().min(2).max(20) });
    const validation = validatePayload(schema, data);
    if (!validation.valid) {
      socket.emit("CHECK_USERNAME_RESULT", { available: false, username: "" });
      return;
    }

    const available = isUsernameAvailable(validation.data.username);
    socket.emit("CHECK_USERNAME_RESULT", {
      available,
      username: validation.data.username,
    });
  });

  socket.on("disconnect", () => {
    removeOnlineUser(socket.id);
    detachSocket(socket.id);
    broadcastOnlineUsers(io);
  });
}

export { broadcastOnlineUsers };
