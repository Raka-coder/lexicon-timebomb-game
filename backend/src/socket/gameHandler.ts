import type { Server, Socket } from "socket.io";
import {
  createRoom,
  joinRoom,
  removePlayer,
  getRoomByCode,
  getRoomBySocketId,
  broadcastToRoom,
} from "../game/roomManager";

export function setupGameHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("CREATE_ROOM", ({ playerName }: { playerName: string }) => {
      console.log(`CREATE_ROOM: ${playerName}`);
      
      const room = createRoom(socket, playerName);
      const player = room.players.get(socket.id);

      socket.emit("ROOM_CREATED", {
        roomCode: room.code,
        playerId: player?.id,
        isHost: true,
      });

      console.log(`Room ${room.code} created, host: ${playerName}`);
    });

    socket.on("JOIN_ROOM", ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
      console.log(`JOIN_ROOM: ${playerName} -> ${roomCode}`);
      
      const room = joinRoom(socket, roomCode.toUpperCase(), playerName);

      if (!room) {
        socket.emit("ROOM_ERROR", { message: "Room tidak ditemukan atau penuh" });
        console.log(`JOIN_ROOM failed: room not found or full`);
        return;
      }

      const player = room.players.get(socket.id);

      socket.emit("ROOM_JOINED", {
        roomCode: room.code,
        playerId: player?.id,
        isHost: false,
      });

      const players = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isConnected: true,
      }));

      broadcastToRoom(io, room.code, "PLAYER_JOINED", { players });
      console.log(`Player ${playerName} joined room ${room.code}, total players: ${players.length}`);
    });

    socket.on("START_GAME", () => {
      console.log(`START_GAME request from ${socket.id}`);
      
      const room = getRoomBySocketId(socket.id);
      if (!room) {
        console.log("START_GAME failed: room not found");
        return;
      }

      const player = room.players.get(socket.id);
      if (!player?.isHost) {
        console.log("START_GAME failed: not host");
        return;
      }

      if (room.players.size < 2) {
        socket.emit("ROOM_ERROR", { message: "Minimal 2 pemain untuk mulai" });
        console.log("START_GAME failed: not enough players");
        return;
      }

      room.status = "playing";

      const players = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
      }));

      broadcastToRoom(io, room.code, "GAME_STARTED", { players });
      console.log(`Game started in room ${room.code}`);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      const room = removePlayer(socket.id);
      if (room) {
        const players = Array.from(room.players.values()).map((p) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          isConnected: true,
        }));

        broadcastToRoom(io, room.code, "PLAYER_LEFT", {
          players,
          message: "Pemain lain meninggalkan room",
        });
        console.log(`Player left room ${room.code}, remaining: ${players.length}`);
      }
    });
  });
}