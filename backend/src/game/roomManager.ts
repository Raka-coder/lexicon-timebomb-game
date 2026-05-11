import type { Server, Socket } from "socket.io";
import type { Player, Room, GameState } from "../types";
import { CONFIG } from "../lib/constants";
import { sanitizePlayerName } from "../lib/security";

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < CONFIG.ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createRoom(
  socket: Socket,
  playerName: string,
  password?: string
): Room {
  const roomCode = generateRoomCode();
  const sanitizedName = sanitizePlayerName(playerName) || "Player";

  const player: Player = {
    id: crypto.randomUUID(),
    name: sanitizedName,
    socketId: socket.id,
    isHost: true,
  };

  const room: Room = {
    code: roomCode,
    players: new Map([[socket.id, player]]),
    hostSocketId: socket.id,
    status: "waiting",
    password: password || null,
  };

  rooms.set(roomCode, room);
  socket.join(roomCode);

  console.log(`Room created: ${roomCode} by ${sanitizedName}${password ? " (protected)" : ""}`);
  return room;
}

export function joinRoom(
  socket: Socket,
  roomCode: string,
  playerName: string,
  password?: string
): Room | null {
  const room = rooms.get(roomCode);
  if (!room) {
    console.log(`Room not found: ${roomCode}`);
    return null;
  }

  if (room.password && room.password !== password) {
    console.log(`Room password incorrect: ${roomCode}`);
    return null;
  }

  if (room.players.size >= CONFIG.MAX_PLAYERS) {
    console.log(`Room full: ${roomCode}`);
    return null;
  }
  if (room.status !== "waiting") {
    console.log(`Room already playing: ${roomCode}`);
    return null;
  }

  const sanitizedName = sanitizePlayerName(playerName) || "Player";

  const player: Player = {
    id: crypto.randomUUID(),
    name: sanitizedName,
    socketId: socket.id,
    isHost: false,
  };

  room.players.set(socket.id, player);
  socket.join(roomCode);

  console.log(`Player ${sanitizedName} joined room ${roomCode}`);
  return room;
}

export function removePlayer(socketId: string): Room | null {
  for (const [code, room] of rooms) {
    if (room.players.has(socketId)) {
      const playerName = room.players.get(socketId)?.name;
      room.players.delete(socketId);

      console.log(`Player ${playerName} left room ${code}`);

      if (room.players.size === 0) {
        rooms.delete(code);
        console.log(`Room ${code} deleted (empty)`);
        return null;
      }

      if (room.hostSocketId === socketId) {
        const newHost = room.players.values().next().value;
        if (newHost) {
          newHost.isHost = true;
          room.hostSocketId = newHost.socketId;
          console.log(`New host for room ${code}: ${newHost.name}`);
        }
      }

      return room;
    }
  }
  return null;
}

export function getRoomByCode(code: string): Room | undefined {
  return rooms.get(code);
}

export function getRoomBySocketId(socketId: string): Room | null {
  for (const room of rooms.values()) {
    if (room.players.has(socketId)) {
      return room;
    }
  }
  return null;
}

export function broadcastToRoom(
  io: Server,
  roomCode: string,
  event: string,
  data: unknown
) {
  io.to(roomCode).emit(event, data);
}

export function getAllRooms(): { code: string; players: number; status: string; hasPassword: boolean }[] {
  return Array.from(rooms.values()).map((room) => ({
    code: room.code,
    players: room.players.size,
    status: room.status,
    hasPassword: !!room.password,
  }));
}

export function isRoomPasswordProtected(roomCode: string): boolean {
  const room = rooms.get(roomCode);
  return !!room?.password;
}