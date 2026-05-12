import type { Socket } from "socket.io";
import type { Server } from "socket.io";
import {
  createRoom,
  joinRoom,
  broadcastToRoom,
  getRoomByCode,
} from "../game/roomManager";
import {
  checkRateLimit,
  validatePayload,
  sanitizePlayerName,
} from "../lib/security";
import {
  createRoomSchema,
  joinRoomSchema,
  syncRoomSchema,
} from "../lib/validation";
import type {
  PlayerInfo,
  RoomCreatedPayload,
  RoomJoinedPayload,
  PlayerJoinedPayload,
  RoomErrorPayload,
} from "../types";
import {
  getUserIdBySocketId,
  updateOnlineStatus,
} from "../auth/userManager";
import { broadcastOnlineUsers } from "./authHandler";

export function setupRoomHandlers(io: Server, socket: Socket): void {
  socket.on("CREATE_ROOM", (data: unknown) => {
    if (!checkRateLimit(socket.id, "CREATE_ROOM")) {
      socket.emit("ROOM_ERROR", { message: "Terlalu banyak request. Coba beberapa saat lagi." });
      return;
    }

    const validation = validatePayload(createRoomSchema, data);
    if (!validation.valid) {
      socket.emit("ROOM_ERROR", { message: validation.error });
      return;
    }

    const { playerName, password } = validation.data;
    console.log(`CREATE_ROOM: ${playerName}${password ? " (with password)" : ""}`);

    const linkedUserId = getUserIdBySocketId(socket.id) || undefined;
    const room = createRoom(socket, playerName, password, linkedUserId);
    const player = room.players.get(socket.id);

    const payload: RoomCreatedPayload = {
      roomCode: room.code,
      playerId: player?.id ?? "",
      playerName: playerName,
      isHost: true,
    };
    socket.emit("ROOM_CREATED", payload);

    if (linkedUserId) {
      updateOnlineStatus(socket.id, "lobby", room.code);
    } else {
      updateOnlineStatus(socket.id, "lobby", room.code, playerName);
    }
    broadcastOnlineUsers(io);

    console.log(`Room ${room.code} created, host: ${playerName}`);
  });

  socket.on("JOIN_ROOM", (data: unknown) => {
    if (!checkRateLimit(socket.id, "JOIN_ROOM")) {
      socket.emit("ROOM_ERROR", { message: "Terlalu banyak request. Coba beberapa saat lagi." });
      return;
    }

    const validation = validatePayload(joinRoomSchema, data);
    if (!validation.valid) {
      socket.emit("ROOM_ERROR", { message: validation.error });
      return;
    }

    const { roomCode, playerName, password } = validation.data;
    console.log(`JOIN_ROOM: ${playerName} -> ${roomCode}`);

    const joinUserId = getUserIdBySocketId(socket.id) || undefined;
    const room = joinRoom(socket, roomCode.toUpperCase(), playerName, password, joinUserId);

    if (!room) {
      const errorPayload: RoomErrorPayload = {
        message: "Room tidak ditemukan atau password salah",
      };
      socket.emit("ROOM_ERROR", errorPayload);
      console.log(`JOIN_ROOM failed: room not found or wrong password`);
      return;
    }

    const player = room.players.get(socket.id);

    const payload: RoomJoinedPayload = {
      roomCode: room.code,
      playerId: player?.id ?? "",
      playerName: playerName,
      isHost: false,
    };
    socket.emit("ROOM_JOINED", payload);

    const players: PlayerInfo[] = Array.from(room.players.values()).map(
      (p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
      }),
    );

    const joinedPayload: PlayerJoinedPayload = { players };
    broadcastToRoom(io, room.code, "PLAYER_JOINED", joinedPayload);

    if (joinUserId) {
      updateOnlineStatus(socket.id, "lobby", room.code);
    } else {
      updateOnlineStatus(socket.id, "lobby", room.code, playerName);
    }
    broadcastOnlineUsers(io);

    console.log(
      `Player ${playerName} joined room ${room.code}, total players: ${players.length}`,
    );
  });

  socket.on("SYNC_ROOM", (data: unknown) => {
    const validation = validatePayload(syncRoomSchema, data);
    if (!validation.valid) {
      return;
    }

    const { roomCode, playerId } = validation.data;
    console.log(
      `SYNC_ROOM request for ${roomCode} from ${socket.id} (playerId: ${playerId ?? "unknown"})`,
    );

    const room = getRoomByCode(roomCode.toUpperCase());
    if (!room) return;

    if (playerId) {
      const previousSocketId = Array.from(room.players.entries()).find(
        ([, p]) => p.id === playerId,
      )?.[0];

      if (previousSocketId && previousSocketId !== socket.id) {
        const player = room.players.get(previousSocketId);
        if (player) {
          room.players.delete(previousSocketId);
          player.socketId = socket.id;
          room.players.set(socket.id, player);

          if (room.hostSocketId === previousSocketId) {
            room.hostSocketId = socket.id;
          }

          console.log(
            `SYNC_ROOM remapped player ${player.name} (${player.id}) from ${previousSocketId} to ${socket.id}`,
          );
        }
      }
    }

    socket.join(room.code);

    const players: PlayerInfo[] = Array.from(room.players.values()).map(
      (p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
      }),
    );

    broadcastToRoom(io, room.code, "PLAYER_JOINED", { players });
    console.log(`Synced room ${roomCode} state to socket ${socket.id}`);
  });
}