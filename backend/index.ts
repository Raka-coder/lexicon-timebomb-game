import { Hono } from "hono";
import { createServer } from "http";
import { Server } from "socket.io";
import { TimerManager } from "./src/game/timerManager";
import { initGameState, validateWord as validateWordLogic, getNextPlayer } from "./src/game/gameLogic";
import { validateWord, getRandomStartWord, getWordCount } from "./src/dictionary/words";
import {
  createRoom,
  joinRoom,
  removePlayer,
  getRoomBySocketId,
  broadcastToRoom,
} from "./src/game/roomManager";
import roomRoutes from "./src/routes/room";
import dictionaryRoutes from "./src/routes/dictionary";

const app = new Hono();

app.use("*", async (c, next) => {
  c.res.headers.set("Access-Control-Allow-Origin", "*");
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  await next();
});

const server = createServer((req, res) => {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v) {
      const value = Array.isArray(v) ? v.join(", ") : v;
      headers.set(k, value);
    }
  }
  
  const protocol = (req.socket as any).encrypted ? "https" : "http";
  const fullUrl = `${protocol}://${req.headers.host}${req.url}`;
  
  const method = req.method || "GET";
  const bodyReader = ["GET", "HEAD"].includes(method) ? null : req;
  
  Promise.resolve(app.fetch(new Request(fullUrl, { method, headers, body: bodyReader as any })))
    .then((response: Response) => {
      res.writeHead(response.status, {
        ...Object.fromEntries(response.headers),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return response.text();
    })
    .then((text: string) => res.end(text))
    .catch(() => { res.writeHead(500); res.end("Error"); });
});

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const timerManager = new TimerManager(io);

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    wordCount: getWordCount(),
    timestamp: new Date().toISOString(),
  });
});

app.route("/api/room", roomRoutes);
app.route("/api/dictionary", dictionaryRoutes);

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
    const startWord = getRandomStartWord();
    const gameState = initGameState(playerIds, startWord);
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

    io.to(room.code).emit("TURN_START", {
      currentPlayerId: firstPlayer.id,
      currentWord: gameState.currentWord,
      requiredLetter: gameState.requiredLetter,
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

      room.status = "waiting";
      room.gameState = undefined;
      timerManager.stopTurn(room.code);
      
      io.to(room.code).emit("ROOM_RESET", { status: "waiting" });
    });

    console.log(`Game started in room ${room.code} with word: ${startWord}`);
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

    const localValidation = validateWordLogic(
      word,
      gameState.requiredLetter,
      gameState.wordHistory
    );

    if (!localValidation.valid) {
      socket.emit("WORD_INVALID", {
        word,
        reason: localValidation.reason,
      });
      return;
    }

    const kbbiValidation = validateWord(word);

    if (!kbbiValidation.valid) {
      socket.emit("WORD_INVALID", {
        word,
        reason: "not_in_dictionary",
        message: `Kata "${word.trim()}" tidak ditemukan di KBBI`,
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

    io.to(room.code).emit("TURN_START", {
      currentPlayerId: nextPlayerId,
      currentWord: gameState.currentWord,
      requiredLetter: gameState.requiredLetter,
      scores: gameState.scores,
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

      room.status = "waiting";
      room.gameState = undefined;
      timerManager.stopTurn(room.code);
      
      io.to(room.code).emit("ROOM_RESET", { status: "waiting" });
    });
  });

  socket.on("RESET_ROOM", () => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    
    room.status = "waiting";
    room.gameState = undefined;
    timerManager.stopTurn(room.code);
    
    io.to(room.code).emit("ROOM_RESET", { status: "waiting" });
    console.log(`Room ${room.code} reset to waiting`);
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
          room.status = "waiting";
          room.gameState = undefined;
          io.to(room.code).emit("ROOM_RESET", { status: "waiting" });
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

const PORT = parseInt(process.env.PORT || "3001");

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO ready`);
});