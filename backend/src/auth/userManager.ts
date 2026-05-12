import type { User, Session, OnlineUser, PlayerStatus } from "../types";
import { sanitizeString } from "../lib/security";

const users = new Map<string, User>();
const usernameIndex = new Map<string, string>();
const sessions = new Map<string, Session>();
const socketToSession = new Map<string, string>();
const socketToUserId = new Map<string, string>();
const onlineUsers = new Map<string, OnlineUser>();

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_NAME_LENGTH = 20;

function simpleHash(password: string): string {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) + hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateUserId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function registerUser(
  username: string,
  password: string,
): { success: true; userId: string; token: string } | { success: false; error: string } {
  const name = sanitizeString(username).slice(0, MAX_NAME_LENGTH);

  if (name.length < 2) {
    return { success: false, error: "Username minimal 2 karakter" };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return { success: false, error: "Username hanya boleh huruf, angka, dan underscore" };
  }

  if (password.length < 4) {
    return { success: false, error: "Password minimal 4 karakter" };
  }

  const existingByName = usernameIndex.get(name.toLowerCase());
  if (existingByName) {
    return { success: false, error: "Username sudah terdaftar" };
  }

  const userId = generateUserId();
  const passwordHash = simpleHash(password);

  const user: User = {
    id: userId,
    username: name,
    passwordHash,
    createdAt: Date.now(),
  };

  users.set(userId, user);
  usernameIndex.set(name.toLowerCase(), userId);

  const token = generateToken();
  const now = Date.now();

  const session: Session = {
    token,
    userId,
    username: name,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };

  sessions.set(token, session);

  return { success: true, userId, token };
}

export function loginUser(
  username: string,
  password: string,
): { success: true; userId: string; token: string; username: string } | { success: false; error: string } {
  const name = sanitizeString(username).slice(0, MAX_NAME_LENGTH);

  const userId = usernameIndex.get(name.toLowerCase());
  if (!userId) {
    return { success: false, error: "Username atau password salah" };
  }

  const user = users.get(userId);
  if (!user) {
    return { success: false, error: "Username atau password salah" };
  }

  const passwordHash = simpleHash(password);
  if (passwordHash !== user.passwordHash) {
    return { success: false, error: "Username atau password salah" };
  }

  const existingToken = Array.from(sessions.values()).find(
    (s) => s.userId === userId && s.expiresAt > Date.now(),
  );

  if (existingToken) {
    return { success: true, userId: user.id, token: existingToken.token, username: user.username };
  }

  const token = generateToken();
  const now = Date.now();

  const session: Session = {
    token,
    userId: user.id,
    username: user.username,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };

  sessions.set(token, session);

  return { success: true, userId: user.id, token, username: user.username };
}

export function validateSession(
  token: string,
): { valid: true; session: Session } | { valid: false } {
  const session = sessions.get(token);
  if (!session) {
    return { valid: false };
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return { valid: false };
  }

  return { valid: true, session };
}

export function attachSessionToSocket(socketId: string, token: string): string | null {
  const result = validateSession(token);
  if (!result.valid) return null;

  const existingSessionToken = socketToSession.get(socketId);
  if (existingSessionToken) {
    socketToUserId.delete(existingSessionToken);
  }

  socketToSession.set(socketId, token);
  socketToUserId.set(socketId, result.session.userId);

  return result.session.userId;
}

export function detachSocket(socketId: string): void {
  const token = socketToSession.get(socketId);
  if (token) {
    socketToSession.delete(socketId);
    socketToUserId.delete(socketId);
  }
}

export function getUserIdBySocketId(socketId: string): string | null {
  return socketToUserId.get(socketId) ?? null;
}

export function getUserById(userId: string): User | null {
  return users.get(userId) ?? null;
}

export function updateOnlineStatus(
  socketId: string,
  status: PlayerStatus,
  roomCode?: string,
  playerName?: string,
): void {
  const userId = socketToUserId.get(socketId);

  if (userId || playerName) {
    const username = playerName || (userId ? users.get(userId)?.username : undefined);
    if (!username) return;

    const existing = onlineUsers.get(socketId);
    if (!existing) {
      onlineUsers.set(socketId, {
        odispatchId: socketId,
        username,
        status,
        roomCode,
        joinedAt: Date.now(),
      });
    } else {
      existing.status = status;
      existing.roomCode = roomCode;
      existing.username = username;
    }
  }
}

export function removeOnlineUser(socketId: string): void {
  onlineUsers.delete(socketId);
}

export function getOnlineUsers(): OnlineUser[] {
  return Array.from(onlineUsers.values());
}

export function isUsernameAvailable(username: string): boolean {
  const name = sanitizeString(username).slice(0, MAX_NAME_LENGTH).toLowerCase();
  return !usernameIndex.has(name);
}

export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

setInterval(cleanupExpiredSessions, 60 * 60 * 1000);