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

  currentWord: string;
  requiredLetter: string;
  wordHistory: string[];
  currentPlayerId: string | null;
  scores: Record<string, number>;
  timeLeft: number;
  isMyTurn: boolean;

  errorMessage: string | null;
  isValidating: boolean;

  winnerId: string | null;
  loserId: string | null;

  setRoom: (code: string, playerId: string, isHost: boolean) => void;
  setPlayers: (players: Player[]) => void;
  setGameStatus: (status: "idle" | "waiting" | "playing" | "finished") => void;
  setCurrentWord: (word: string) => void;
  setRequiredLetter: (letter: string) => void;
  addWordToHistory: (word: string) => void;
  setCurrentPlayer: (playerId: string | null) => void;
  setScores: (scores: Record<string, number>) => void;
  incrementScore: (playerId: string) => void;
  setTimeLeft: (time: number) => void;
  setIsMyTurn: (isTurn: boolean) => void;
  setError: (message: string | null) => void;
  setIsValidating: (validating: boolean) => void;
  setWinnerLoser: (winnerId: string, loserId: string) => void;
  reset: () => void;
  resetGameState: () => void;
}

const initialState = {
  roomCode: null,
  myPlayerId: null,
  players: [],
  isHost: false,
  gameStatus: "idle" as const,
  currentWord: "",
  requiredLetter: "",
  wordHistory: [] as string[],
  currentPlayerId: null,
  scores: {} as Record<string, number>,
  timeLeft: 15,
  isMyTurn: false,
  errorMessage: null,
  isValidating: false,
  winnerId: null,
  loserId: null,
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

  incrementScore: (playerId) =>
    set((state) => ({
      scores: {
        ...state.scores,
        [playerId]: (state.scores[playerId] || 0) + 1,
      },
    })),

  setTimeLeft: (time) => set({ timeLeft: time }),

  setIsMyTurn: (isTurn) => set({ isMyTurn: isTurn }),

  setError: (message) => set({ errorMessage: message }),

  setIsValidating: (validating) => set({ isValidating: validating }),

  setWinnerLoser: (winnerId, loserId) => set({ winnerId, loserId }),

  reset: () => set(initialState),

  resetGameState: () => set({
    currentWord: "",
    requiredLetter: "",
    wordHistory: [],
    currentPlayerId: null,
    scores: {},
    timeLeft: 15,
    isMyTurn: false,
    errorMessage: null,
    isValidating: false,
    gameStatus: "waiting",
    winnerId: null,
    loserId: null,
  }),
}));
