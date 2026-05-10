export interface Player {
  id: string;
  name: string;
  socketId: string;
  isHost: boolean;
}

export interface Room {
  code: string;
  players: Map<string, Player>;
  hostSocketId: string;
  status: RoomStatus;
  gameState?: GameState;
}

export type RoomStatus = "waiting" | "playing" | "finished";

export interface GameState {
  currentWord: string;
  requiredLetter: string;
  wordHistory: string[];
  currentPlayerId: string | null;
  scores: Record<string, number>;
}

export interface GameStartedPayload {
  players: PlayerInfo[];
  currentWord: string;
  requiredLetter: string;
  currentPlayerId: string;
  scores: Record<string, number>;
}

export interface TurnStartPayload {
  currentPlayerId: string;
  currentWord: string;
  requiredLetter: string;
  scores: Record<string, number>;
}

export interface WordValidPayload {
  word: string;
  playerId: string;
  playerName: string;
  currentPlayerId: string;
  scores: Record<string, number>;
  nextLetter: string;
}

export interface WordInvalidPayload {
  word: string;
  reason: string;
  message?: string;
}

export interface GameOverPayload {
  winnerId: string;
  loserId: string;
  reason: "timeout" | "disconnect";
  scores: Record<string, number>;
  wordHistory: string[];
  roomStatus?: RoomStatus;
}

export interface RoomResetPayload {
  status: RoomStatus;
}

export interface PlayerJoinedPayload {
  players: PlayerInfo[];
}

export interface PlayerLeftPayload {
  players: PlayerInfo[];
  message: string;
}

export interface RoomErrorPayload {
  message: string;
}

export interface RoomCreatedPayload {
  roomCode: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
}

export interface RoomJoinedPayload {
  roomCode: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
}

export interface TimerSyncPayload {
  timeLeft: number;
}

export type PlayerInfo = Pick<Player, "id" | "name" | "isHost">;

export interface RoomAPIResponse {
  exists: boolean;
  playerCount: number;
  status: RoomStatus;
}

export interface HealthAPIResponse {
  status: string;
  wordCount: number;
  timestamp: string;
}

export interface DictionaryCheckResponse {
  valid: boolean;
  source: string;
}