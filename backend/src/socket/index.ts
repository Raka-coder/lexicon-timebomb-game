import type { Server, Socket } from "socket.io";
import { setupRoomHandlers } from "./roomHandler";
import { setupGameHandlers } from "./gameHandler";
import { setupDisconnectHandler } from "./disconnectHandler";
import { TimerManager } from "../game/timerManager";

export function setupSocketHandlers(io: Server, timerManager: TimerManager): void {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    setupRoomHandlers(io, socket);
    setupGameHandlers(io, socket, timerManager);
    setupDisconnectHandler(io, socket, timerManager);
  });
}