import type { Socket } from "socket.io";
import type { Server } from "socket.io";
import { getRoomBySocketId } from "../game/roomManager";
import { initGameState, validateWord as validateWordLogic, getNextPlayer, getHostFirstPlayerId } from "../game/gameLogic";
import { getRandomStartWord } from "../dictionary/words";
import { TimerManager } from "../game/timerManager";
import { CONFIG } from "../lib/constants";
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

export function setupGameHandlers(io: Server, socket: Socket, timerManager: TimerManager): void {
  socket.on("START_GAME", () => {
    console.log(`START_GAME request from ${socket.id}`);
    
    const room = getRoomBySocketId(socket.id);
    if (!room || room.status !== "waiting") {
      console.log("START_GAME failed: room not found or not waiting");
      return;
    }

    const player = room.players.get(socket.id);
    if (!player?.isHost) {
      console.log("START_GAME failed: not host");
      return;
    }

    if (room.players.size < 2) {
      const errorPayload: RoomErrorPayload = { message: "Minimal 2 pemain untuk mulai" };
      socket.emit("ROOM_ERROR", errorPayload);
      console.log("START_GAME failed: not enough players");
      return;
    }

    const playerIds = Array.from(room.players.values()).map((p) => p.id);
    const hostSocketId = room.hostSocketId;
    const firstPlayerId = getHostFirstPlayerId(playerIds, hostSocketId);
    
    if (!firstPlayerId) {
      console.log("START_GAME failed: no first player found");
      return;
    }
    
    const startWord = getRandomStartWord() || CONFIG.START_WORD;
    const gameState = initGameState(playerIds, startWord, firstPlayerId);
    
    room.gameState = gameState;
    room.status = "playing";

    const players: PlayerInfo[] = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
    }));

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

    console.log(`Game started in room ${room.code}, first player (host): ${firstPlayerId}`);

    timerManager.startTurn(room.code, firstPlayerId, () => {
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
      io.to(room.code).emit("GAME_OVER", gameOverPayload);
    });
  });

  socket.on("SUBMIT_WORD", ({ word }: { word: string }) => {
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
      gameState.wordHistory
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
      io.to(room.code).emit("GAME_OVER", gameOverPayload);
    });

    console.log(`WORD_VALID: ${normalizedWord} by ${player.name}, next: ${nextPlayerId}`);
  });

  socket.on("RESTART_GAME", () => {
    console.log(`RESTART_GAME request from ${socket.id}`);
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    // Reset room to waiting state and notify all players
    room.status = "waiting";
    room.gameState = undefined;
    timerManager.stopTurn(room.code);

    const resetPayload: RoomResetPayload = { status: "waiting" };
    io.to(room.code).emit("ROOM_RESET", resetPayload);
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
  });
}
