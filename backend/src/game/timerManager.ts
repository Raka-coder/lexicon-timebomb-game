import type { Server } from "socket.io";

export interface TurnTimer {
  timeout: ReturnType<typeof setTimeout>;
  interval: ReturnType<typeof setInterval>;
  timeLeft: number;
  currentPlayerId: string;
}

const TURN_DURATION = 15;

export class TimerManager {
  private io: Server;
  private roomTimers = new Map<string, TurnTimer>();

  constructor(io: Server) {
    this.io = io;
  }

  startTurn(roomCode: string, playerId: string, onTimeout: () => void) {
    this.stopTurn(roomCode);

    let timeLeft = TURN_DURATION;

    const interval = setInterval(() => {
      timeLeft--;
      this.io.to(roomCode).emit("TIMER_SYNC", { timeLeft });

      if (timeLeft <= 0) {
        this.stopTurn(roomCode);
        onTimeout();
      }
    }, 1000);

    const timeout = setTimeout(() => {
      this.stopTurn(roomCode);
      onTimeout();
    }, TURN_DURATION * 1000);

    this.roomTimers.set(roomCode, {
      timeout,
      interval,
      timeLeft,
      currentPlayerId: playerId,
    });

    this.io.to(roomCode).emit("TIMER_SYNC", { timeLeft: TURN_DURATION });
  }

  stopTurn(roomCode: string) {
    const timer = this.roomTimers.get(roomCode);
    if (timer) {
      clearTimeout(timer.timeout);
      clearInterval(timer.interval);
      this.roomTimers.delete(roomCode);
    }
  }

  getTimeLeft(roomCode: string): number | null {
    const timer = this.roomTimers.get(roomCode);
    return timer ? timer.timeLeft : null;
  }

  isTimerActive(roomCode: string): boolean {
    return this.roomTimers.has(roomCode);
  }
}