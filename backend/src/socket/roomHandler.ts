import type { Socket } from "socket.io";
import type { Server } from "socket.io";
import {
  createRoom,
  joinRoom,
  broadcastToRoom,
} from "../game/roomManager";
import type { PlayerInfo, RoomCreatedPayload, RoomJoinedPayload, PlayerJoinedPayload, RoomErrorPayload } from "../types";

export function setupRoomHandlers(io: Server, socket: Socket): void {
  socket.on("CREATE_ROOM", ({ playerName }: { playerName: string }) => {
    console.log(`CREATE_ROOM: ${playerName}`);
    
    const room = createRoom(socket, playerName);
    const player = room.players.get(socket.id);

    const payload: RoomCreatedPayload = {
      roomCode: room.code,
      playerId: player?.id ?? "",
      isHost: true,
    };
    socket.emit("ROOM_CREATED", payload);

    console.log(`Room ${room.code} created, host: ${playerName}`);
  });

  socket.on("JOIN_ROOM", ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
    console.log(`JOIN_ROOM: ${playerName} -> ${roomCode}`);
    
    const room = joinRoom(socket, roomCode.toUpperCase(), playerName);

    if (!room) {
      const errorPayload: RoomErrorPayload = { message: "Room tidak ditemukan atau penuh" };
      socket.emit("ROOM_ERROR", errorPayload);
      console.log(`JOIN_ROOM failed: room not found or full`);
      return;
    }

    const player = room.players.get(socket.id);

    const payload: RoomJoinedPayload = {
      roomCode: room.code,
      playerId: player?.id ?? "",
      isHost: false,
    };
    socket.emit("ROOM_JOINED", payload);

    const players: PlayerInfo[] = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
    }));

    const joinedPayload: PlayerJoinedPayload = { players };
    broadcastToRoom(io, room.code, "PLAYER_JOINED", joinedPayload);
    console.log(`Player ${playerName} joined room ${room.code}, total players: ${players.length}`);
  });
}