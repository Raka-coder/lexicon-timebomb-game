import type { Socket } from "socket.io";
import type { Server } from "socket.io";
import {
  createRoom,
  joinRoom,
  broadcastToRoom,
  getRoomByCode,
} from "../game/roomManager";
import type {
  PlayerInfo,
  RoomCreatedPayload,
  RoomJoinedPayload,
  PlayerJoinedPayload,
  RoomErrorPayload,
} from "../types";

export function setupRoomHandlers(io: Server, socket: Socket): void {
  socket.on("CREATE_ROOM", ({ playerName }: { playerName: string }) => {
    console.log(`CREATE_ROOM: ${playerName}`);

    const room = createRoom(socket, playerName);
    const player = room.players.get(socket.id);

    const payload: RoomCreatedPayload = {
      roomCode: room.code,
      playerId: player?.id ?? "",
      playerName: playerName,
      isHost: true,
    };
    socket.emit("ROOM_CREATED", payload);

    console.log(`Room ${room.code} created, host: ${playerName}`);
  });

  socket.on(
    "JOIN_ROOM",
    ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
      console.log(`JOIN_ROOM: ${playerName} -> ${roomCode}`);

      const room = joinRoom(socket, roomCode.toUpperCase(), playerName);

      if (!room) {
        const errorPayload: RoomErrorPayload = {
          message: "Room tidak ditemukan atau penuh",
        };
        socket.emit("ROOM_ERROR", errorPayload);
        console.log(`JOIN_ROOM failed: room not found or full`);
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
      console.log(
        `Player ${playerName} joined room ${room.code}, total players: ${players.length}`,
      );
    },
  );

  socket.on(
    "SYNC_ROOM",
    ({ roomCode, playerId }: { roomCode: string; playerId?: string | null }) => {
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

      // Put socket back in room just in case it reconnected
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
    },
  );
}
