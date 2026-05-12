import type { Server, Socket } from "socket.io";
import { setupRoomHandlers } from "./roomHandler";
import { setupGameHandlers } from "./gameHandler";
import { setupDisconnectHandler } from "./disconnectHandler";
import { setupAuthHandlers, broadcastOnlineUsers } from "./authHandler";
import { TimerManager } from "../game/timerManager";
import { updateOnlineStatus } from "../auth/userManager";

export function setupSocketHandlers(io: Server, timerManager: TimerManager): void {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    updateOnlineStatus(socket.id, "idle");
    broadcastOnlineUsers(io);

    setupAuthHandlers(io, socket);
    setupRoomHandlers(io, socket);
    setupGameHandlers(io, socket, timerManager);
    setupDisconnectHandler(io, socket, timerManager);
  });
}