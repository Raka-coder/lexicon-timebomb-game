import { Hono } from "hono";
import { Server } from "socket.io";
import { serve } from "@hono/node-server";
import { TimerManager } from "./src/game/timerManager";
import { initGameState, validateWord, getNextPlayer } from "./src/game/gameLogic";
import {
  createRoom,
  joinRoom,
  removePlayer,
  getRoomByCode,
  getRoomBySocketId,
  broadcastToRoom,
} from "./src/game/roomManager";
import roomRoutes from "./src/routes/room";

const app = new Hono();

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.route("/api/room", roomRoutes);

const PORT = parseInt(process.env.PORT || "3001");

const server = serve({
  fetch: app.fetch,
  port: PORT,
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const timerManager = new TimerManager(io);

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("CREATE_ROOM", ({ playerName }: { playerName: string }) => {
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
    const room = joinRoom(socket, roomCode.toUpperCase(), playerName);

    if (!room) {
      socket.emit("ROOM_ERROR", { message: "Room tidak ditemukan atau penuh" });
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
  });

  socket.on("START_GAME", () => {
    const room = getRoomBySocketId(socket.id);
    if (!room || room.status !== "waiting") return;

    const player = room.players.get(socket.id);
    if (!player?.isHost) return;

    if (room.players.size < 2) {
      socket.emit("ROOM_ERROR", { message: "Minimal 2 pemain untuk mulai" });
      return;
    }

    const playerIds = Array.from(room.players.values()).map((p) => p.id);
    const gameState = initGameState(playerIds);
    room.gameState = gameState;
    room.status = "playing";

    const firstPlayer = Array.from(room.players.values())[0];
    if (!firstPlayer) return;

    io.to(room.code).emit("GAME_STARTED", {
      players: Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
      })),
      currentWord: gameState.currentWord,
      requiredLetter: gameState.requiredLetter,
      currentPlayerId: gameState.currentPlayerId,
      scores: gameState.scores,
    });

    timerManager.startTurn(room.code, firstPlayer.id, () => {
      const loserId = gameState.currentPlayerId;
      const winnerId = playerIds.find((id) => id !== loserId);

      io.to(room.code).emit("GAME_OVER", {
        winnerId,
        loserId,
        reason: "timeout",
        scores: gameState.scores,
        wordHistory: gameState.wordHistory,
      });

      room.status = "finished";
      timerManager.stopTurn(room.code);
    });

    console.log(`Game started in room ${room.code}`);
  });

  socket.on("SUBMIT_WORD", ({ word }: { word: string }) => {
    const room = getRoomBySocketId(socket.id);
    if (!room || !room.gameState) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const gameState = room.gameState;

    if (gameState.currentPlayerId !== player.id) {
      socket.emit("WORD_INVALID", {
        word,
        reason: "not_your_turn",
      });
      return;
    }

    const validation = validateWord(
      word,
      gameState.requiredLetter,
      gameState.wordHistory
    );

    if (!validation.valid) {
      socket.emit("WORD_INVALID", {
        word,
        reason: validation.reason,
      });
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

    io.to(room.code).emit("WORD_VALID", {
      word: normalizedWord,
      playerId: player.id,
      playerName: player.name,
      scores: gameState.scores,
      nextLetter,
    });

    timerManager.startTurn(room.code, nextPlayerId, () => {
      const loserId = nextPlayerId;
      const winnerId = playerIds.find((id) => id !== loserId);

      io.to(room.code).emit("GAME_OVER", {
        winnerId,
        loserId,
        reason: "timeout",
        scores: gameState.scores,
        wordHistory: gameState.wordHistory,
      });

      room.status = "finished";
    });
  });

  socket.on("disconnect", () => {
    const room = removePlayer(socket.id);
    if (room) {
      if (room.status === "playing") {
        timerManager.stopTurn(room.code);
        const playerIds = Array.from(room.players.values()).map((p) => p.id);
        if (playerIds.length > 0) {
          io.to(room.code).emit("GAME_OVER", {
            winnerId: playerIds[0],
            loserId: socket.id,
            reason: "disconnect",
            scores: room.gameState?.scores || {},
            wordHistory: room.gameState?.wordHistory || [],
          });
          room.status = "finished";
        }
      } else {
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
      }
    }
  });
});

console.log(`Server running on http://localhost:${PORT}`);