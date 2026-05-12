export interface Player {
  id: string;
  name: string;
  socketId: string;
  isHost: boolean;
  userId?: string;
}

export type PlayerStatus = "idle" | "lobby" | "playing";

export interface OnlineUser {
  odispatchId: string;
  username: string;
  status: PlayerStatus;
  roomCode?: string;
  joinedAt: number;
}

export interface Session {
  token: string;
  userId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: number;
}

export interface Room {
  code: string;
  players: Map<string, Player>;
  hostSocketId: string;
  status: RoomStatus;
  gameState?: GameState;
  password?: string | null;
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

export interface RegisterPayload {
  username: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface UserRegisteredPayload {
  token: string;
  userId: string;
  username: string;
}

export interface UserLoggedInPayload {
  token: string;
  userId: string;
  username: string;
}

export interface AuthErrorPayload {
  message: string;
}

export interface OnlineUsersPayload {
  users: OnlineUser[];
}

export interface AuthSuccessPayload {
  success: boolean;
}

export interface CheckUsernameResponse {
  available: boolean;
  username: string;
}