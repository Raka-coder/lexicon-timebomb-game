import type { Socket } from "socket.io";
import type { Server } from "socket.io";
import { getRoomBySocketId } from "../game/roomManager";
import {
  initGameState,
  validateWord as validateWordLogic,
  getNextPlayer,
  getHostFirstPlayerId,
} from "../game/gameLogic";
import { getRandomStartWord } from "../dictionary/words";
import { TimerManager } from "../game/timerManager";
import { CONFIG } from "../lib/constants";
import { checkRateLimit, validatePayload } from "../lib/security";
import { submitWordSchema } from "../lib/validation";
import type {
  PlayerInfo,
  GameStartedPayload,
  TurnStartPayload,
  WordValidPayload,
  WordInvalidPayload,
  GameOverPayload,
  RoomResetPayload,
  RoomErrorPayload,
} from "../types";
import { updateOnlineStatus } from "../auth/userManager";
import { broadcastOnlineUsers } from "./authHandler";

export function setupGameHandlers(
  io: Server,
  socket: Socket,
  timerManager: TimerManager,
): void {
  const startGameAgain = (
    socketId: string,
    ack?: (response: { ok: boolean; message?: string }) => void,
  ) => {
    console.log(`START_GAME_AGAIN request from ${socketId}`);

    const room = getRoomBySocketId(socketId);
    if (!room) {
      ack?.({ ok: false, message: "Room tidak ditemukan" });
      return;
    }

    if (room.status !== "finished") {
      console.log("START_GAME_AGAIN ignored: room not finished");
      ack?.({ ok: false, message: "Game belum selesai" });
      return;
    }

    const playerCount = room.players.size;
    if (playerCount < 2) {
      const message = "Minimal 2 pemain untuk mulai";
      socket.emit("ROOM_ERROR", { message });
      ack?.({ ok: false, message });
      return;
    }

    const playersArray = Array.from(room.players.values());
    const playerIds = playersArray.map((p) => p.id);

    const lastLoserId = room.gameState?.currentPlayerId ?? null;
    let firstPlayerId = playerIds[0];
    if (lastLoserId) {
      const loserIndex = playerIds.indexOf(lastLoserId);
      firstPlayerId =
        playerIds[(loserIndex + 1) % playerIds.length] ?? playerIds[0];
    } else {
      const hostPlayerId = room.players.get(room.hostSocketId)?.id ?? null;
      const hostFirst = getHostFirstPlayerId(playerIds, hostPlayerId);
      if (hostFirst) firstPlayerId = hostFirst;
    }

    if (!firstPlayerId) {
      console.log("START_GAME_AGAIN failed: no first player found");
      ack?.({ ok: false, message: "Gagal menentukan giliran pertama" });
      return;
    }

    const startWord = getRandomStartWord() || CONFIG.START_WORD;
    const gameState = initGameState(playerIds, startWord, firstPlayerId);

    room.gameState = gameState;
    room.status = "playing";

    const players: PlayerInfo[] = playersArray.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
    }));

    io.to(room.code).emit("GAME_RESTARTED", {
      players,
      currentWord: gameState.currentWord ?? "",
      requiredLetter: gameState.requiredLetter ?? "",
      currentPlayerId: firstPlayerId,
      scores: {},
    });

    const turnStartPayload: TurnStartPayload = {
      currentPlayerId: firstPlayerId,
      currentWord: gameState.currentWord ?? "",
      requiredLetter: gameState.requiredLetter ?? "",
      scores: {},
    };
    io.to(room.code).emit("TURN_START", turnStartPayload);

    for (const [sockId] of room.players) {
      updateOnlineStatus(sockId, "playing", room.code);
    }
    broadcastOnlineUsers(io);

    console.log(
      `Game restarted in room ${room.code}, first player: ${firstPlayerId}`,
    );

    timerManager.stopTurn(room.code);
    timerManager.startTurn(room.code, firstPlayerId, () => {
      room.status = "finished";
      const loserId = gameState.currentPlayerId ?? "";
      const winnerId = playerIds.find((id) => id !== loserId) ?? "";

      const gameOverPayload: GameOverPayload = {
        winnerId,
        loserId,
        reason: "timeout",
        scores: gameState.scores,
        wordHistory: gameState.wordHistory,
        roomStatus: "playing",
      };
      timerManager.stopTurn(room.code);
      io.to(room.code).emit("GAME_OVER", gameOverPayload);
    });

    ack?.({ ok: true });
  };

  socket.on("START_GAME", () => {
    const socketId = socket.id;
    console.log(`START_GAME request from ${socketId}`);

    const room = getRoomBySocketId(socketId);
    if (!room || room.status !== "waiting") {
      console.log(
        `START_GAME failed: room not found or not waiting for socket ${socketId}`,
      );
      return;
    }

    const player = room.players.get(socketId);
    if (!player?.isHost) {
      console.log(
        `START_GAME failed: socket ${socketId} is not host in room ${room.code}`,
      );
      return;
    }

    const playerCount = room.players.size;
    if (playerCount < 2) {
      const errorPayload: RoomErrorPayload = {
        message: "Minimal 2 pemain untuk mulai",
      };
      socket.emit("ROOM_ERROR", errorPayload);

      const players: PlayerInfo[] = Array.from(room.players.values()).map(
        (p) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
        }),
      );
      socket.emit("PLAYER_JOINED", { players });

      console.log(
        `START_GAME failed: not enough players in room ${room.code} (count: ${playerCount}). Synced back to client.`,
      );
      return;
    }

    console.log(
      `Room ${room.code} has ${playerCount} players. Proceeding to start...`,
    );

    const playersArray = Array.from(room.players.values());
    const playerIds = playersArray.map((p) => p.id);
    const hostPlayerId = room.players.get(room.hostSocketId)?.id ?? null;
    const firstPlayerId = getHostFirstPlayerId(playerIds, hostPlayerId);

    if (!firstPlayerId) {
      console.log("START_GAME failed: no first player found");
      return;
    }

    const startWord = getRandomStartWord() || CONFIG.START_WORD;
    const gameState = initGameState(playerIds, startWord, firstPlayerId);

    room.gameState = gameState;
    room.status = "playing";

    const players: PlayerInfo[] = Array.from(room.players.values()).map(
      (p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
      }),
    );

    const gameStartedPayload: GameStartedPayload = {
      players,
      currentWord: gameState.currentWord ?? "",
      requiredLetter: gameState.requiredLetter ?? "",
      currentPlayerId: firstPlayerId,
      scores: gameState.scores,
    };
    io.to(room.code).emit("GAME_STARTED", gameStartedPayload);

    const turnStartPayload: TurnStartPayload = {
      currentPlayerId: firstPlayerId,
      currentWord: gameState.currentWord ?? "",
      requiredLetter: gameState.requiredLetter ?? "",
      scores: gameState.scores,
    };
    io.to(room.code).emit("TURN_START", turnStartPayload);

    for (const [sockId] of room.players) {
      updateOnlineStatus(sockId, "playing", room.code);
    }
    broadcastOnlineUsers(io);

    console.log(
      `Game started in room ${room.code}, first player (host): ${firstPlayerId}`,
    );

    timerManager.startTurn(room.code, firstPlayerId, () => {
      room.status = "finished";
      const loserId = gameState.currentPlayerId ?? "";
      const winnerId = playerIds.find((id) => id !== loserId) ?? "";

      const gameOverPayload: GameOverPayload = {
        winnerId,
        loserId,
        reason: "timeout",
        scores: gameState.scores,
        wordHistory: gameState.wordHistory,
        roomStatus: "playing",
      };
      timerManager.stopTurn(room.code);
      io.to(room.code).emit("GAME_OVER", gameOverPayload);
    });
  });

  socket.on("SUBMIT_WORD", (data: unknown) => {
    if (!checkRateLimit(socket.id, "SUBMIT_WORD")) {
      socket.emit("WORD_INVALID", {
        word: "",
        reason: "rate_limit",
        message: "Terlalu banyak request. Tunggu sebentar.",
      });
      return;
    }

    const validation = validatePayload(submitWordSchema, data);
    if (!validation.valid) {
      socket.emit("WORD_INVALID", {
        word: "",
        reason: "validation_error",
        message: validation.error,
      });
      return;
    }

    const { word } = validation.data;

    const room = getRoomBySocketId(socket.id);
    if (!room || !room.gameState) {
      console.log("SUBMIT_WORD failed: room or gameState not found");
      return;
    }

    const player = room.players.get(socket.id);
    if (!player) return;

    const gameState = room.gameState;

    if (gameState.currentPlayerId !== player.id) {
      const invalidPayload: WordInvalidPayload = {
        word,
        reason: "not_your_turn",
      };
      socket.emit("WORD_INVALID", invalidPayload);
      console.log(`WORD_INVALID: not_your_turn by ${socket.id}`);
      return;
    }

    const localValidation = validateWordLogic(
      word,
      gameState.requiredLetter,
      gameState.wordHistory,
    );

    if (!localValidation.valid) {
      const invalidPayload: WordInvalidPayload = {
        word,
        reason: localValidation.reason ?? "invalid",
      };
      socket.emit("WORD_INVALID", invalidPayload);
      console.log(`WORD_INVALID: ${localValidation.reason} by ${socket.id}`);
      return;
    }

    const { validateWord } = require("../dictionary/words");
    const kbbiValidation = validateWord(word);

    if (!kbbiValidation.valid) {
      const invalidPayload: WordInvalidPayload = {
        word,
        reason: "not_in_dictionary",
        message: `Kata "${word.trim()}" tidak ditemukan di KBBI`,
      };
      socket.emit("WORD_INVALID", invalidPayload);
      console.log(`WORD_INVALID: not_in_dictionary by ${socket.id}`);
      return;
    }

    const normalizedWord = word.trim().toLowerCase();
    gameState.wordHistory.push(normalizedWord);
    gameState.scores[player.id] = (gameState.scores[player.id] || 0) + 1;

    const nextLetter = normalizedWord[normalizedWord.length - 1] || "";
    const playerIds = Array.from(room.players.values()).map((p) => p.id);
    const nextPlayerId = getNextPlayer(playerIds, player.id);

    gameState.currentWord = normalizedWord;
    gameState.requiredLetter = nextLetter;
    gameState.currentPlayerId = nextPlayerId;

    const wordValidPayload: WordValidPayload = {
      word: normalizedWord,
      playerId: player.id,
      playerName: player.name,
      currentPlayerId: nextPlayerId,
      scores: gameState.scores,
      nextLetter,
    };
    io.to(room.code).emit("WORD_VALID", wordValidPayload);

    const turnStartPayload: TurnStartPayload = {
      currentPlayerId: nextPlayerId,
      currentWord: gameState.currentWord ?? "",
      requiredLetter: gameState.requiredLetter ?? "",
      scores: gameState.scores,
    };
    io.to(room.code).emit("TURN_START", turnStartPayload);

    timerManager.startTurn(room.code, nextPlayerId, () => {
      room.status = "finished";
      const loserId = nextPlayerId;
      const winnerId = playerIds.find((id) => id !== loserId) ?? "";

      const gameOverPayload: GameOverPayload = {
        winnerId,
        loserId,
        reason: "timeout",
        scores: gameState.scores,
        wordHistory: gameState.wordHistory,
        roomStatus: "playing",
      };
      timerManager.stopTurn(room.code);
      io.to(room.code).emit("GAME_OVER", gameOverPayload);
    });

    console.log(
      `WORD_VALID: ${normalizedWord} by ${player.name}, next: ${nextPlayerId}`,
    );
  });

  socket.on(
    "START_GAME_AGAIN",
    (ack?: (response: { ok: boolean; message?: string }) => void) => {
      startGameAgain(socket.id, ack);
    },
  );

  socket.on("LEAVE_GAME", () => {
    const socketId = socket.id;
    console.log(`LEAVE_GAME request from ${socketId}`);

    const room = getRoomBySocketId(socketId);
    if (!room) return;

    const player = room.players.get(socketId);
    const isHost = player?.isHost ?? false;
    const wasInGame = room.status === "playing" || room.status === "finished";

    if (wasInGame) {
      room.gameState = undefined;
      timerManager.stopTurn(room.code);
    }

    room.players.delete(socketId);

    const remainingPlayers = Array.from(room.players.values());
    if (remainingPlayers.length === 0) {
      room.status = "waiting";
      room.code = "";
      room.players.clear();
    } else if (isHost && remainingPlayers.length > 0) {
      const newHost = remainingPlayers[0];
      if (newHost) {
        newHost.isHost = true;
        room.hostSocketId = newHost.socketId;
      }
    }

    const players: PlayerInfo[] = remainingPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
    }));

    if (remainingPlayers.length > 0) {
      io.to(room.code).emit("PLAYER_LEFT", {
        players,
        message: `${player?.name ?? "Pemain"} meninggalkan ruangan`,
      });
    }

    updateOnlineStatus(socketId, "idle");
    broadcastOnlineUsers(io);
    socket.emit("LEFT_GAME", { success: true });

    console.log(`Player ${socketId} left room ${room.code}`);
  });

  socket.on("RESTART_GAME", () => {
    if (!checkRateLimit(socket.id, "RESTART_GAME")) {
      return;
    }

    console.log(`RESTART_GAME request from ${socket.id}`);
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    if (room.status !== "finished") {
      console.log("RESTART_GAME ignored: room not finished");
      return;
    }

    room.status = "waiting";
    room.gameState = undefined;
    timerManager.stopTurn(room.code);

    const resetPayload: RoomResetPayload = { status: "waiting" };
    io.to(room.code).emit("ROOM_RESET", resetPayload);
    for (const [sockId] of room.players) {
      updateOnlineStatus(sockId, "lobby", room.code);
    }
    broadcastOnlineUsers(io);
    console.log(`Room ${room.code} reset by ${socket.id}`);
  });

  socket.on("EXIT_GAME", () => {
    console.log(`EXIT_GAME request from ${socket.id}`);
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    room.status = "waiting";
    room.gameState = undefined;
    timerManager.stopTurn(room.code);

    const resetPayload: RoomResetPayload = { status: "waiting" };
    io.to(room.code).emit("ROOM_RESET", resetPayload);
    updateOnlineStatus(socket.id, "idle");
    broadcastOnlineUsers(io);
  });
}
