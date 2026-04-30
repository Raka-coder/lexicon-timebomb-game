# 🎮 Sambung Kata — Implementation Guide

> Pembagian fase pengembangan berdasarkan PRD yang sudah disesuaikan dengan kondisi project saat ini.

## Status Project Saat Ini

| Komponen | Status |
|----------|--------|
| Frontend (Vite + React + TS) | ✅ Siap (shadcn/ui terinstall) |
| Backend (Bun + Hono + TS) | ✅ Siap (project structure ada) |
| Socket.IO | ❌ Belum diintegrasikan |
| Game Components | ❌ Belum dibuat |

---

## Daftar Isi

1. [Fase 1: Room & Koneksi WebSocket](#fase-1-room--koneksi-websocket)
2. [Fase 2: Core Gameplay & Timer](#fase-2-core-gameplay--timer)
3. [Fase 3: Validasi KBBI Hybrid](#fase-3-validasi-kbbi-hybrid)
4. [Fase 4: Polish, Skor & SFX](#fase-4-polish-skor--sfx)
5. [Fase 5: Deploy](#fase-5-deploy)

---

## Fase 1: Room & Koneksi WebSocket

**Durasi**: 3-4 jam  
**Tujuan**: Dua browser bisa terhubung ke server yang sama dengan room system

### Prerequisites

- [Context7 Docs: Socket.IO Rooms](https://socket.io/docs/v4/rooms)
- [Context7 Docs: Zustand](https://zustand-demo.pmnd.rs/)

### Backend Implementation

#### 1. Install Dependencies

```bash
cd backend
bun add socket.io hono @hono/node-server uuid
bun add -D @types/node @types/uuid
```

#### 2. Setup Socket.IO Server (`backend/src/index.ts`)

```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createServer } from "http";
import { Server } from "socket.io";

const app = new Hono();
const httpServer = createServer(app.onRequest);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// Health check route
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = parseInt(process.env.PORT || "3001");
console.log(`Server running on http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT,
});
```

#### 3. Room Manager (`backend/src/game/roomManager.ts`)

```typescript
import { Server, Socket } from "socket.io";

interface Player {
  id: string;
  name: string;
  socketId: string;
  isHost: boolean;
}

export interface Room {
  code: string;
  players: Map<string, Player>;
  hostSocketId: string;
  status: "waiting" | "playing" | "finished";
}

const rooms = new Map<string, Room>();

const AVOID_LETTERS = ["0", "O", "1", "I"];

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createRoom(socket: Socket, playerName: string): Room {
  const roomCode = generateRoomCode();
  const player: Player = {
    id: crypto.randomUUID(),
    name: playerName,
    socketId: socket.id,
    isHost: true,
  };

  const room: Room = {
    code: roomCode,
    players: new Map([[socket.id, player]]),
    hostSocketId: socket.id,
    status: "waiting",
  };

  rooms.set(roomCode, room);
  socket.join(roomCode);

  return room;
}

export function joinRoom(
  socket: Socket,
  roomCode: string,
  playerName: string
): Room | null {
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.players.size >= 2) return null;

  const player: Player = {
    id: crypto.randomUUID(),
    name: playerName,
    socketId: socket.id,
    isHost: false,
  };

  room.players.set(socket.id, player);
  socket.join(roomCode);

  return room;
}

export function removePlayer(socketId: string): Room | null {
  for (const [code, room] of rooms) {
    if (room.players.has(socketId)) {
      room.players.delete(socketId);

      if (room.players.size === 0) {
        rooms.delete(code);
        return null;
      }

      if (room.hostSocketId === socketId) {
        const newHost = room.players.values().next().value;
        if (newHost) newHost.isHost = true;
        room.hostSocketId = newHost.socketId;
      }

      return room;
    }
  }
  return null;
}

export function getRoomByCode(code: string): Room | undefined {
  return rooms.get(code);
}

export function getRoomBySocketId(socketId: string): Room | null {
  for (const room of rooms.values()) {
    if (room.players.has(socketId)) {
      return room;
    }
  }
  return null;
}

export function broadcastToRoom(
  io: Server,
  roomCode: string,
  event: string,
  data: any
) {
  io.to(roomCode).emit(event, data);
}
```

#### 4. Socket Event Handlers (`backend/src/socket/gameHandler.ts`)

```typescript
import { Server, Socket } from "socket.io";
import {
  createRoom,
  joinRoom,
  removePlayer,
  getRoomByCode,
  getRoomBySocketId,
  broadcastToRoom,
} from "../game/roomManager";

export function setupGameHandlers(io: Server) {
  io.on("connection", (socket) => {
    // CREATE_ROOM
    socket.on("CREATE_ROOM", ({ playerName }) => {
      const room = createRoom(socket, playerName);
      const player = room.players.get(socket.id);

      socket.emit("ROOM_CREATED", {
        roomCode: room.code,
        playerId: player?.id,
        isHost: true,
      });
    });

    // JOIN_ROOM
    socket.on("JOIN_ROOM", ({ roomCode, playerName }) => {
      const room = joinRoom(socket, roomCode.toUpperCase(), playerName);

      if (!room) {
        socket.emit("ROOM_ERROR", { message: "Room tidak ditemukan atau penuh" });
        return;
      }

      const player = room.players.get(socket.id);

      // Notify the joiner
      socket.emit("ROOM_JOINED", {
        roomCode: room.code,
        playerId: player?.id,
        isHost: false,
      });

      // Notify everyone in room
      const players = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isConnected: true,
      }));

      broadcastToRoom(io, room.code, "PLAYER_JOINED", { players });
    });

    // START_GAME
    socket.on("START_GAME", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "waiting") return;

      const socketIds = Array.from(room.players.keys());
      if (socketIds.length < 2) return;

      room.status = "playing";

      io.to(room.code).emit("GAME_STARTED", {
        players: Array.from(room.players.values()).map((p) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
        })),
      });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      const room = removePlayer(socket.id);
      if (room) {
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
    });
  });
}
```

#### 5. REST Route untuk Room (`backend/src/routes/room.ts`)

```typescript
import { Hono } from "hono";
import { getRoomByCode } from "../game/roomManager";

const roomRoutes = new Hono();

roomRoutes.get("/:code", (c) => {
  const code = c.req.param("code").toUpperCase();
  const room = getRoomByCode(code);

  if (!room) {
    return c.json({ exists: false, playerCount: 0, status: "not_found" });
  }

  return c.json({
    exists: true,
    playerCount: room.players.size,
    status: room.status,
  });
});

export default roomRoutes;
```

---

### Frontend Implementation

#### 1. Install Dependencies

```bash
cd frontend
bun add socket.io-client zustand @tanstack/react-query react-router-dom
```

#### 2. Setup Socket Client (`frontend/src/hooks/useSocket.ts`)

```typescript
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
    });
  }
  return socket;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();

    s.on("connect", () => setIsConnected(true));
    s.on("disconnect", () => setIsConnected(false));

    if (!s.connected) {
      s.connect();
    }

    return () => {
      s.off("connect", () => setIsConnected(true));
      s.off("disconnect", () => setIsConnected(false));
    };
  }, []);

  return { socket: getSocket(), isConnected };
}
```

#### 3. Zustand Store (`frontend/src/stores/gameStore.ts`)

```typescript
import { create } from "zustand";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected?: boolean;
}

interface GameState {
  // Room
  roomCode: string | null;
  myPlayerId: string | null;
  players: Player[];
  isHost: boolean;

  // Game
  gameStatus: "idle" | "waiting" | "playing" | "finished";

  // UI
  errorMessage: string | null;

  // Actions
  setRoom: (code: string, playerId: string, isHost: boolean) => void;
  setPlayers: (players: Player[]) => void;
  setGameStatus: (status: "idle" | "waiting" | "playing" | "finished") => void;
  setError: (message: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  roomCode: null,
  myPlayerId: null,
  players: [],
  isHost: false,
  gameStatus: "idle",
  errorMessage: null,

  setRoom: (code, playerId, isHost) =>
    set({ roomCode: code, myPlayerId: playerId, isHost, gameStatus: "waiting" }),

  setPlayers: (players) => set({ players }),

  setGameStatus: (status) => set({ gameStatus: status }),

  setError: (message) => set({ errorMessage: message }),

  reset: () =>
    set({
      roomCode: null,
      myPlayerId: null,
      players: [],
      isHost: false,
      gameStatus: "idle",
      errorMessage: null,
    }),
}));
```

#### 4. Game Socket Hook (`frontend/src/hooks/useGameSocket.ts`)

```typescript
import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { useGameStore } from "../stores/gameStore";

export function useGameSocket(socket: Socket) {
  const { setRoom, setPlayers, setGameStatus, setError } = useGameStore();

  useEffect(() => {
    socket.on("ROOM_CREATED", ({ roomCode, playerId, isHost }) => {
      setRoom(roomCode, playerId, isHost);
    });

    socket.on("ROOM_JOINED", ({ roomCode, playerId, isHost }) => {
      setRoom(roomCode, playerId, isHost);
    });

    socket.on("PLAYER_JOINED", ({ players }) => {
      setPlayers(players);
    });

    socket.on("PLAYER_LEFT", ({ players, message }) => {
      setPlayers(players);
      if (message) setError(message);
    });

    socket.on("ROOM_ERROR", ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off("ROOM_CREATED");
      socket.off("ROOM_JOINED");
      socket.off("PLAYER_JOINED");
      socket.off("PLAYER_LEFT");
      socket.off("ROOM_ERROR");
    };
  }, [socket, setRoom, setPlayers, setError]);
}
```

#### 5. Create Room Form (`frontend/src/components/room/CreateRoomForm.tsx`)

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  onCreateRoom: (playerName: string) => void;
}

export function CreateRoomForm({ onCreateRoom }: Props) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateRoom(name.trim());
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Buat Room Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Masukkan nama kamu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Buat Room
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

#### 6. Join Room Form (`frontend/src/components/room/JoinRoomForm.tsx`)

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  onJoinRoom: (roomCode: string, playerName: string) => void;
}

export function JoinRoomForm({ onJoinRoom }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && code.trim()) {
      onJoinRoom(code.trim().toUpperCase(), name.trim());
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Gabung ke Room</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Nama kamu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              placeholder="Kode Room"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={5}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Gabung
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

#### 7. Waiting Lobby (`frontend/src/components/room/WaitingLobby.tsx`)

```typescript
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function WaitingLobby() {
  const { roomCode, players, isHost, gameStatus } = useGameStore();

  const handleStartGame = () => {
    const socket = (window as any).__socket;
    socket?.emit("START_GAME");
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || "");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Room</span>
          <Badge variant="secondary" className="text-lg font-mono">
            {roomCode}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" onClick={copyRoomCode} className="w-full">
          Copy Kode Room
        </Button>

        <div className="space-y-2">
          <h3 className="font-semibold">Pemain:</h3>
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted"
            >
              <span>{player.name}</span>
              {player.isHost && <Badge>Host</Badge>}
            </div>
          ))}
        </div>

        {isHost ? (
          <Button
            onClick={handleStartGame}
            disabled={players.length < 2}
            className="w-full"
          >
            {players.length < 2 ? "Menunggu pemain lain..." : "Mulai Game"}
          </Button>
        ) : (
          <p className="text-center text-muted-foreground">
            Menunggu host memulai game...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 8. Landing Page (`frontend/src/pages/LandingPage.tsx`)

```typescript
import { useSocket } from "@/hooks/useSocket";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useGameStore } from "@/stores/gameStore";
import { CreateRoomForm } from "@/components/room/CreateRoomForm";
import { JoinRoomForm } from "@/components/room/JoinRoomForm";
import { WaitingLobby } from "@/components/room/WaitingLobby";
import { useNavigate } from "react-router-dom";

export function LandingPage() {
  const { socket } = useSocket();
  const { roomCode, gameStatus } = useGameStore();
  const navigate = useNavigate();

  useGameSocket(socket);

  const handleCreateRoom = (playerName: string) => {
    socket.emit("CREATE_ROOM", { playerName });
    navigate("/lobby");
  };

  const handleJoinRoom = (roomCode: string, playerName: string) => {
    socket.emit("JOIN_ROOM", { roomCode, playerName });
    navigate("/lobby");
  };

  if (roomCode && gameStatus === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <WaitingLobby />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8">
      <h1 className="text-4xl font-bold text-doom-purple glow-purple">
        Sambung Kata
      </h1>
      <p className="text-muted-foreground">
        Game kata real-time dengan teman!
      </p>
      <div className="flex flex-col md:flex-row gap-8">
        <CreateRoomForm onCreateRoom={handleCreateRoom} />
        <JoinRoomForm onJoinRoom={handleJoinRoom} />
      </div>
    </div>
  );
}
```

---

### Test Walkthrough Fase 1

1. **Start Backend**:
   ```bash
   cd backend
   bun run src/index.ts
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   bun run dev
   ```

3. **Test Room Creation**:
   - Buka http://localhost:5173 di browser
   - Masukkan nama dan klik "Buat Room"
   - Kamu akan diarahkan ke lobby dan melihat kode room

4. **Test Room Joining**:
   - Buka tab baru browser
   - Masukkan nama dan kode room dari tab pertama
   - Klik "Gabung"
   - Kedua tab akan melihat 2 pemain

5. **Test Disconnect**:
   - Tutup salah satu tab
   - Tab lain akan melihat notifikasi pemain keluar

6. **Test Start Game**:
   - Klik "Mulai Game" (hanya muncul di tab host)
   - Kedua tab akan menerima event `GAME_STARTED`

---

## Fase 2: Core Gameplay & Timer

**Durasi**: 4-5 jam  
**Tujuan**: Game bisa dimainkan dengan timer dan word chain logic

### Prerequisites

- Socket.IO event broadcasting documentation
- Zustand state management

### Backend Implementation

#### 1. Timer Manager (`backend/src/game/timerManager.ts`)

```typescript
import { Server } from "socket.io";

interface TurnTimer {
  timeout: ReturnType<typeof setTimeout>;
  interval: ReturnType<typeof setInterval>;
  timeLeft: number;
  currentPlayerId: string;
}

const TURN_DURATION = 15; // seconds

export class TimerManager {
  private io: Server;
  private roomTimers = new Map<string, TurnTimer>();

  constructor(io: Server) {
    this.io = io;
  }

  startTurn(
    roomCode: string,
    playerId: string,
    onTimeout: () => void
  ) {
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
}
```

#### 2. Game Logic (`backend/src/game/gameLogic.ts`)

```typescript
export interface GameState {
  currentWord: string;
  requiredLetter: string;
  wordHistory: string[];
  currentPlayerId: string | null;
  scores: Record<string, number>;
}

const HARDCODED_START_WORDS = [
  "rumah",
  "kucing",
  "pantai",
  "musik",
  "buku",
  "anjing",
];

export function initGameState(
  playerIds: string[]
): GameState {
  const startWord =
    HARDCODED_START_WORDS[
      Math.floor(Math.random() * HARDCODED_START_WORDS.length)
    ];

  const firstPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];

  return {
    currentWord: startWord,
    requiredLetter: startWord[startWord.length - 1],
    wordHistory: [startWord],
    currentPlayerId: firstPlayerId,
    scores: playerIds.reduce(
      (acc, id) => ({ ...acc, [id]: 0 }),
      {} as Record<string, number>
    ),
  };
}

export function validateWord(
  word: string,
  requiredLetter: string,
  wordHistory: string[]
): { valid: boolean; reason?: string } {
  const normalizedWord = word.trim().toLowerCase();

  // Check minimum length
  if (normalizedWord.length < 3) {
    return { valid: false, reason: "too_short" };
  }

  // Check starting letter
  if (normalizedWord[0] !== requiredLetter) {
    return { valid: false, reason: "wrong_start_letter" };
  }

  // Check duplicate
  if (wordHistory.includes(normalizedWord)) {
    return { valid: false, reason: "duplicate_word" };
  }

  return { valid: true };
}

export function getNextPlayer(
  playerIds: string[],
  currentPlayerId: string
): string {
  const currentIndex = playerIds.indexOf(currentPlayerId);
  const nextIndex = (currentIndex + 1) % playerIds.length;
  return playerIds[nextIndex];
}
```

#### 3. Update gameHandler.ts

Tambahkan handler START_GAME dan SUBMIT_WORD:

```typescript
// Di gameHandler.ts, tambahkan:

let timerManager: TimerManager;

export function initGameHandlers(io: Server) {
  timerManager = new TimerManager(io);

  io.on("connection", (socket) => {
    // ... existing handlers ...

    socket.on("START_GAME", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "waiting") return;
      if (room.players.size < 2) return;

      // Check if socket is host
      const player = room.players.get(socket.id);
      if (!player?.isHost) return;

      const playerIds = Array.from(room.players.keys());
      const gameState = initGameState(playerIds);
      (room as any).gameState = gameState;
      room.status = "playing";

      const firstPlayer = Array.from(room.players.values())[0];

      io.to(room.code).emit("TURN_START", {
        currentPlayerId: firstPlayer.id,
        currentWord: gameState.currentWord,
        requiredLetter: gameState.requiredLetter,
        scores: gameState.scores,
      });

      timerManager.startTurn(room.code, firstPlayer.id, () => {
        const loserId = gameState.currentPlayerId;
        const winner = playerIds.find((id) => id !== loserId);

        io.to(room.code).emit("GAME_OVER", {
          winnerId: winner,
          loserId,
          reason: "timeout",
          scores: gameState.scores,
          wordHistory: gameState.wordHistory,
        });

        room.status = "finished";
      });
    });

    socket.on("SUBMIT_WORD", ({ word }: { word: string }) => {
      const room = getRoomBySocketId(socket.id);
      if (!room || !room.gameState) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      const gameState = room.gameState;

      // Check if it's player's turn
      if (gameState.currentPlayerId !== player.id) {
        socket.emit("WORD_INVALID", {
          word,
          reason: "not_your_turn",
        });
        return;
      }

      // Validate word
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

      // Word is valid - update game state
      const normalizedWord = word.trim().toLowerCase();
      gameState.wordHistory.push(normalizedWord);
      gameState.scores[player.id] = (gameState.scores[player.id] || 0) + 1;

      const nextLetter = normalizedWord[normalizedWord.length - 1];
      const playerIds = Array.from(room.players.keys());
      const nextPlayerId = getNextPlayer(playerIds, player.id);

      gameState.currentWord = normalizedWord;
      gameState.requiredLetter = nextLetter;
      gameState.currentPlayerId = nextPlayerId;

      // Broadcast to all
      io.to(room.code).emit("WORD_VALID", {
        word: normalizedWord,
        playerId: player.id,
        playerName: player.name,
        scores: gameState.scores,
        nextLetter,
      });

      // Start timer for next player
      timerManager.startTurn(room.code, nextPlayerId, () => {
        const loserId = nextPlayerId;
        const winner = playerIds.find((id) => id !== loserId);

        io.to(room.code).emit("GAME_OVER", {
          winnerId: winner,
          loserId,
          reason: "timeout",
          scores: gameState.scores,
          wordHistory: gameState.wordHistory,
        });

        room.status = "finished";
      });
    });
  });
}
```

---

### Frontend Implementation

#### 1. Update Zustand Store (`frontend/src/stores/gameStore.ts`)

```typescript
import { create } from "zustand";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected?: boolean;
}

interface GameState {
  roomCode: string | null;
  myPlayerId: string | null;
  players: Player[];
  isHost: boolean;
  gameStatus: "idle" | "waiting" | "playing" | "finished";

  // Game specific
  currentWord: string;
  requiredLetter: string;
  wordHistory: string[];
  currentPlayerId: string | null;
  scores: Record<string, number>;
  timeLeft: number;
  isMyTurn: boolean;

  // UI
  errorMessage: string | null;
  isValidating: boolean;

  setRoom: (code: string, playerId: string, isHost: boolean) => void;
  setPlayers: (players: Player[]) => void;
  setGameStatus: (status: "idle" | "waiting" | "playing" | "finished") => void;
  setCurrentWord: (word: string) => void;
  setRequiredLetter: (letter: string) => void;
  addWordToHistory: (word: string) => void;
  setCurrentPlayer: (playerId: string | null) => void;
  setScores: (scores: Record<string, number>) => void;
  setTimeLeft: (time: number) => void;
  setIsMyTurn: (isTurn: boolean) => void;
  setError: (message: string | null) => void;
  setIsValidating: (validating: boolean) => void;
  reset: () => void;
}

const initialState = {
  roomCode: null,
  myPlayerId: null,
  players: [],
  isHost: false,
  gameStatus: "idle",
  currentWord: "",
  requiredLetter: "",
  wordHistory: [],
  currentPlayerId: null,
  scores: {},
  timeLeft: 15,
  isMyTurn: false,
  errorMessage: null,
  isValidating: false,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setRoom: (code, playerId, isHost) =>
    set({
      roomCode: code,
      myPlayerId: playerId,
      isHost,
      gameStatus: "waiting",
    }),

  setPlayers: (players) => set({ players }),
  setGameStatus: (status) => set({ gameStatus: status }),
  setCurrentWord: (word) => set({ currentWord: word }),
  setRequiredLetter: (letter) => set({ requiredLetter: letter }),
  addWordToHistory: (word) =>
    set((state) => ({ wordHistory: [word, ...state.wordHistory] })),
  setCurrentPlayer: (playerId) => set({ currentPlayerId: playerId }),
  setScores: (scores) => set({ scores }),
  setTimeLeft: (time) => set({ timeLeft: time }),
  setIsMyTurn: (isTurn) => set({ isMyTurn: isTurn }),
  setError: (message) => set({ errorMessage: message }),
  setIsValidating: (validating) => set({ isValidating: validating }),
  reset: () => set(initialState),
}));
```

#### 2. Update useGameSocket.ts

```typescript
import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { useGameStore } from "../stores/gameStore";

export function useGameSocket(socket: Socket) {
  const {
    setRoom,
    setPlayers,
    setGameStatus,
    setCurrentWord,
    setRequiredLetter,
    addWordToHistory,
    setCurrentPlayer,
    setScores,
    setTimeLeft,
    setIsMyTurn,
    setError,
    myPlayerId,
  } = useGameStore();

  useEffect(() => {
    // ... existing handlers ...

    socket.on("GAME_STARTED", ({ players }) => {
      setGameStatus("playing");
      setPlayers(players);
    });

    socket.on("TURN_START", ({ currentPlayerId, currentWord, requiredLetter, scores }) => {
      setCurrentWord(currentWord);
      setRequiredLetter(requiredLetter);
      setCurrentPlayer(currentPlayerId);
      setScores(scores);
      setIsMyTurn(currentPlayerId === myPlayerId);
    });

    socket.on("WORD_VALID", ({ word, playerId, nextLetter, scores }) => {
      addWordToHistory(word);
      setRequiredLetter(nextLetter);
      setScores(scores);
    });

    socket.on("WORD_INVALID", ({ word, reason }) => {
      const messages: Record<string, string> = {
        not_your_turn: "Belum giliranmu!",
        too_short: "Kata minimal 3 huruf",
        wrong_start_letter: `Kata harus dimulai dengan huruf ${useGameStore.getState().requiredLetter}`,
        duplicate_word: "Kata sudah digunakan",
      };
      setError(messages[reason] || "Kata tidak valid");
    });

    socket.on("TIMER_SYNC", ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on("GAME_OVER", ({ winnerId, scores, wordHistory }) => {
      setGameStatus("finished");
      setScores(scores);
    });

    return () => {
      socket.off("GAME_STARTED");
      socket.off("TURN_START");
      socket.off("WORD_VALID");
      socket.off("WORD_INVALID");
      socket.off("TIMER_SYNC");
      socket.off("GAME_OVER");
    };
  }, [socket, myPlayerId, setGameStatus, setPlayers]);
}
```

#### 3. BombTimer Component (`frontend/src/components/game/BombTimer.tsx`)

```typescript
import { useGameStore } from "@/stores/gameStore";

export function BombTimer() {
  const { timeLeft, isMyTurn } = useGameStore();

  const percentage = (timeLeft / 15) * 100;

  let colorClass = "text-green-500";
  if (timeLeft <= 4) colorClass = "text-red-500 animate-pulse";
  else if (timeLeft <= 8) colorClass = "text-yellow-500";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={351.86}
            strokeDashoffset={351.86 * (1 - percentage / 100)}
            className={`transition-all duration-1000 ${colorClass}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-4xl font-bold font-mono ${colorClass}`}>
            {timeLeft}
          </span>
        </div>
      </div>
      {isMyTurn && (
        <span className="text-sm text-muted-foreground animate-pulse">
          Giliranmu!
        </span>
      )}
    </div>
  );
}
```

#### 4. WordInput Component (`frontend/src/components/game/WordInput.tsx`)

```typescript
import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function WordInput() {
  const [word, setWord] = useState("");
  const { isMyTurn, isValidating, requiredLetter, errorMessage, setError } =
    useGameStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !isMyTurn || isValidating) return;

    const socket = (window as any).__socket;
    socket?.emit("SUBMIT_WORD", { word: word.trim() });
    setWord("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder={`Awali dengan huruf ${requiredLetter}`}
          disabled={!isMyTurn || isValidating}
          className={errorMessage ? "border-red-500" : ""}
        />
        <Button type="submit" disabled={!isMyTurn || isValidating || !word.trim()}>
          {isValidating ? "..." : "Kirim"}
        </Button>
      </div>
      {errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </form>
  );
}
```

#### 5. WordHistory Component (`frontend/src/components/game/WordHistory.tsx`)

```typescript
import { useGameStore } from "@/stores/gameStore";

export function WordHistory() {
  const { wordHistory } = useGameStore();

  if (wordHistory.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        belum ada kata...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {wordHistory.map((word, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 rounded bg-muted animate-in slide-in-from-top"
        >
          <span>{word}</span>
          <span className="text-xs text-muted-foreground">
            {word[word.length - 1]}→
          </span>
        </div>
      ))}
    </div>
  );
}
```

#### 6. PlayerCard Component (`frontend/src/components/game/PlayerCard.tsx`)

```typescript
import { useGameStore } from "@/stores/gameStore";

interface PlayerCardProps {
  playerId: string;
  name: string;
  isHost: boolean;
}

export function PlayerCard({ playerId, name, isHost }: PlayerCardProps) {
  const { currentPlayerId, scores, myPlayerId } = useGameStore();
  const isActive = currentPlayerId === playerId;
  const score = scores[playerId] || 0;

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isActive
          ? "border-doom-purple glow-purple bg-doom-card"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{name}</p>
          {isHost && <span className="text-xs text-muted">Host</span>}
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-doom-cyan">{score}</span>
        </div>
      </div>
      {isActive && (
        <div className="mt-2 text-center text-xs text-doom-purple animate-pulse">
          ⏰ Giliran
        </div>
      )}
    </div>
  );
}
```

#### 7. GamePage (`frontend/src/pages/GamePage.tsx`)

```typescript
import { useGameStore } from "@/stores/gameStore";
import { BombTimer } from "@/components/game/BombTimer";
import { WordInput } from "@/components/game/WordInput";
import { WordHistory } from "@/components/game/WordHistory";
import { PlayerCard } from "@/components/game/PlayerCard";

export function GamePage() {
  const { gameStatus, players } = useGameStore();

  if (gameStatus !== "playing") {
    return <div className="p-8">Memuat...</div>;
  }

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto space-y-6">
      {/* Header with players */}
      <div className="grid grid-cols-2 gap-4">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            playerId={player.id}
            name={player.name}
            isHost={player.isHost}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="flex justify-center">
        <BombTimer />
      </div>

      {/* Input */}
      <div className="max-w-md mx-auto">
        <WordInput />
      </div>

      {/* Word History */}
      <div className="max-w-md mx-auto">
        <h3 className="font-semibold mb-2">Riwayat Kata:</h3>
        <WordHistory />
      </div>
    </div>
  );
}
```

---

### Test Walkthrough Fase 2

1. **Test Start Game**:
   - Di lobby, klik "Mulai Game"
   - Kedua tab akan masuk ke halaman game

2. **Test Turn System**:
   - Setiap pemain melihat tombol disabled saat bukan giliran
   - Giliran ditunjukkan dengan border glow dan "Giliranmu!" indicator

3. **Test Word Submission**:
   - Ketik kata dengan huruf yang benar
   - Kata masuk ke history dan giliran pindah

4. **Test Invalid Words**:
   - Ketik kata dengan huruf salah → error message
   - Ketik kata pendek (<3) → error message

5. **Test Timer**:
   - Timer countdown 15 detik
   - Saat timeout, popup game over muncul

---

## Fase 3: Validasi KBBI Hybrid

**Durasi**: 3-4 jam  
**Tujuan**: Validasi kata menggunakan KBBI dataset offline + API fallback

### Prerequisites

- KBBI API: https://kbbi.raf555.dev/
- Dataset: https://github.com/damzaky/kumpulan-kata-bahasa-indonesia-KBBI

### Backend Implementation

#### 1. Download Dataset

```bash
cd backend
mkdir -p src/data
# Download dari https://github.com/damzaky/kumpulan-kata-bahasa-indonesia-KBBI
# Simpan ke src/data/kbbi-words.txt
```

#### 2. Dictionary Module (`backend/src/dictionary/words.ts`)

```typescript
import { readFileSync, existsSync } from "fs";
import { join } from "path";

let wordSet: Set<string> | null = null;

function loadWordSet(): Set<string> {
  if (wordSet) return wordSet;

  const filePath = join(__dirname, "../data/kbbi-words.txt");

  if (!existsSync(filePath)) {
    console.warn("KBBI data file not found, using empty set");
    return new Set();
  }

  const raw = readFileSync(filePath, "utf-8");
  wordSet = new Set(
    raw
      .split("\n")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
  );

  console.log(`Loaded ${wordSet.size} words from KBBI dataset`);
  return wordSet;
}

export type ValidationResult = {
  valid: boolean;
  source: "offline" | "api" | "timeout" | "not_found";
};

export async function validateWord(
  word: string
): Promise<ValidationResult> {
  const w = word.trim().toLowerCase().replace(/[^a-z]/g, "");

  if (w.length < 3) {
    return { valid: false, source: "not_found" };
  }

  // Layer 1: offline check
  const words = loadWordSet();
  if (words.has(w)) {
    return { valid: true, source: "offline" };
  }

  // Layer 2: API fallback
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`https://kbbi.raf555.dev/api/${w}`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      // Add to cache
      if (wordSet) wordSet.add(w);
      return { valid: true, source: "api" };
    }

    return { valid: false, source: "not_found" };
  } catch {
    return { valid: false, source: "timeout" };
  }
}

export function getRandomStartWord(): string {
  const words = loadWordSet();
  const candidates = [...words].filter(
    (w) => w.length >= 4 && w.length <= 8 && /^[a-z]+$/.test(w)
  );

  if (candidates.length === 0) {
    return "rumah"; // fallback
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function getWordCount(): number {
  return loadWordSet().size;
}
```

#### 3. Update gameHandler.ts untuk KBBI validation

```typescript
import { validateWord, getRandomStartWord } from "../dictionary/words";

// Di handler SUBMIT_WORD, tambahkan:
socket.on("SUBMIT_WORD", async ({ word }: { word: string }) => {
  // ... existing checks ...

  // Validate with KBBI
  const result = await validateWord(word);

  if (!result.valid) {
    const message =
      result.source === "timeout"
        ? "Koneksi timeout, coba lagi"
        : `Kata "${word.trim()}" tidak ditemukan di KBBI`;

    socket.emit("WORD_INVALID", {
      word,
      reason: "not_in_dictionary",
      message,
    });
    return;
  }

  // Continue with valid word logic...
});
```

#### 4. Update START_GAME untuk random start word

```typescript
// Di handler START_GAME:
const startWord = getRandomStartWord();
const gameState = {
  currentWord: startWord,
  requiredLetter: startWord[startWord.length - 1],
  // ...
};
```

#### 5. Update Health Check

```typescript
import { getWordCount } from "../dictionary/words";

app.get("/api/health", (c) => {
  const uptime = process.uptime();
  return c.json({
    status: "ok",
    wordCount: getWordCount(),
    uptime,
    timestamp: new Date().toISOString(),
  });
});
```

#### 6. Dictionary Route (`backend/src/routes/dictionary.ts`)

```typescript
import { Hono } from "hono";
import { validateWord } from "../dictionary/words";

const dictionaryRoutes = new Hono();

dictionaryRoutes.get("/check/:word", async (c) => {
  const word = c.req.param("word");
  const result = await validateWord(word);

  return c.json({
    word,
    valid: result.valid,
    source: result.source,
  });
});

export default dictionaryRoutes;
```

---

### Frontend Implementation

#### 1. Update WordInput untuk KBBI error

```typescript
// Di WordInput.tsx
socket.on("WORD_INVALID", ({ word, reason, message }) => {
  const messages: Record<string, string> = {
    // ... existing
    not_in_dictionary: message || `Kata "${word}" tidak ditemukan di KBBI`,
  };
  setError(messages[reason] || "Kata tidak valid");
});
```

---

### Test Walkthrough Fase 3

1. **Test API Endpoint**:
   ```bash
   curl http://localhost:3001/api/health
   # Should return: { status: "ok", wordCount: 112000, ... }

   curl http://localhost:3001/api/dictionary/check/kucing
   # Should return: { word: "kucing", valid: true, source: "offline" }
   ```

2. **Test Valid KBBI Words**:
   - Submit kata yang ada di KBBI → accepted

3. **Test Invalid KBBI Words**:
   - Submit kata acak (misal "asdfgh") → rejected dengan message KBBI

4. **Test Start Word**:
   - Setiap game baru dimulai dengan kata berbeda dari KBBI

---

## Fase 4: Polish, Skor & SFX

**Durasi**: 3-4 jam  
**Tujuan**: UX yang lebih baik dengan skor real-time, efek suara, dan animasi

### Frontend Implementation

#### 1. SFX Manager (`frontend/src/lib/sfx.ts`)

```typescript
class SFXManager {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  playPing() {
    if (this.muted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  playTick() {
    if (this.muted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 440;
    osc.type = "square";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  playBoom() {
    if (this.muted) return;
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.6;
    source.start();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }
}

export const sfx = new SFXManager();
```

#### 2. Update useGameSocket untuk SFX

```typescript
import { sfx } from "@/lib/sfx";

// Di useGameSocket.ts
socket.on("WORD_VALID", () => {
  sfx.playPing();
});

socket.on("TIMER_SYNC", ({ timeLeft }) => {
  if (timeLeft <= 4 && useGameStore.getState().isMyTurn) {
    sfx.playTick();
  }
});

socket.on("GAME_OVER", () => {
  sfx.playBoom();
});
```

#### 3. Add Mute Button

```typescript
// Di GamePage.tsx
import { sfx } from "@/lib/sfx";

const toggleMute = () => {
  const muted = sfx.toggleMute();
  setMuted(muted);
};

// Add button di UI
<Button variant="ghost" size="icon" onClick={toggleMute}>
  {muted ? <VolumeX /> : <Volume2 />}
</Button>
```

#### 4. Animations

Tambahkan animasi di `index.css`:

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slideInFromTop 0.3s ease-out;
}
```

---

## Fase 5: Deploy

**Durasi**: 1-2 jam  
**Tujuan**: Game bisa diakses dari URL publik

### Backend - Railway

```bash
cd backend

# Install Railway CLI
bun add -g @railway/cli

# Login
railway login

# Init project
railway init

# Create railway.json
cat > railway.json <<EOF
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "bun run src/index.ts",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
EOF

# Deploy
railway up
```

### Frontend - Vercel

```bash
cd frontend

# Create .env.production
echo "VITE_WS_URL=wss://your-railway-app.railway.app" > .env.production

# Deploy
bunx vercel

# Atau via CLI
vercel --prod
```

---

## Checklist Final

| Fitur | Status |
|-------|--------|
| F01 Buat room dengan kode unik | ⬜ |
| F02 Gabung room dengan kode | ⬜ |
| F03 UI menampilkan nama + status pemain | ⬜ |
| F04 Tombol mulai hanya untuk host | ⬜ |
| F05 Kata awal random dari KBBI | ⬜ |
| F06 Giliran bergantian otomatis | ⬜ |
| F07 Input kata + tombol kirim | ⬜ |
| F08 Validasi huruf sambung | ⬜ |
| F09 Validasi kata unik | ⬜ |
| F10 Validasi minimal 3 huruf | ⬜ |
| F11 Riwayat kata scrollable | ⬜ |
| F12 Timer 15 detik per giliran | ⬜ |
| F13 Visual countdown | ⬜ |
| F14 Timer berpindah setelah jawab benar | ⬜ |
| F15 Hanya satu timer aktif | ⬜ |
| F16 Game over jika timer habis | ⬜ |
| F17 Validasi KBBI | ⬜ |
| F18 Pesan error spesifik | ⬜ |
| F19 Popup winner + skor akhir | ⬜ |
| F20 Tombol Main Lagi | ⬜ |
| F21 Sistem skor real-time | ⬜ |
| F22 SFX: detak, bom, kata valid | ⬜ |