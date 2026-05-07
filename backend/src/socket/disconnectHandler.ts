import type { Socket } from "socket.io";
import type { Server } from "socket.io";
import { removePlayer, getRoomBySocketId, broadcastToRoom } from "../game/roomManager";
import { TimerManager } from "../game/timerManager";
import type { PlayerInfo, PlayerLeftPayload, GameOverPayload, RoomResetPayload } from "../types";

export function setupDisconnectHandler(io: Server, socket: Socket, timerManager: TimerManager): void {
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    const room = removePlayer(socket.id);
    if (!room) return;

    if (room.status === "playing") {
      timerManager.stopTurn(room.code);
      const playerIds = Array.from(room.players.values()).map((p) => p.id);
      
      if (playerIds.length > 0) {
        const gameOverPayload: GameOverPayload = {
          winnerId: playerIds[0] ?? "",
          loserId: socket.id,
          reason: "disconnect",
          scores: room.gameState?.scores || {},
          wordHistory: room.gameState?.wordHistory || [],
        };
        io.to(room.code).emit("GAME_OVER", gameOverPayload);
        
        room.status = "waiting";
        room.gameState = undefined;
        
        const resetPayload: RoomResetPayload = { status: "waiting" };
        io.to(room.code).emit("ROOM_RESET", resetPayload);
      }
    } else {
      const players: PlayerInfo[] = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
      }));

      const leftPayload: PlayerLeftPayload = {
        players,
        message: "Pemain lain meninggalkan room",
      };
      broadcastToRoom(io, room.code, "PLAYER_LEFT", leftPayload);
      console.log(`Player left room ${room.code}, remaining: ${players.length}`);
    }
  });
}