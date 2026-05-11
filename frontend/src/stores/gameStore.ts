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
  setWinnerLoser: (winnerId: string | null, loserId: string | null) => void;
  reset: () => void;
  resetGameState: () => void;
}

const STORAGE_KEY = "lexicon_game_state";

function loadPersistedState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        roomCode: parsed.roomCode || null,
        myPlayerId: parsed.myPlayerId || null,
        isHost: parsed.isHost || false,
        gameStatus: parsed.gameStatus || "idle",
        players: parsed.players || [],
      };
    }
  } catch {
    // ignore
  }
  return null;
}

const persistedState = loadPersistedState();

function persistState(state: { roomCode?: string | null; myPlayerId?: string | null; players?: Player[]; isHost?: boolean; gameStatus?: string }) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        roomCode: state.roomCode ?? null,
        myPlayerId: state.myPlayerId ?? null,
        isHost: state.isHost ?? false,
        gameStatus: state.gameStatus ?? "idle",
        players: state.players ?? [],
      }),
    );
  } catch {
    // ignore
  }
}

const initialState = {
  roomCode: persistedState?.roomCode ?? null,
  myPlayerId: persistedState?.myPlayerId ?? null,
  players: persistedState?.players ?? [],
  isHost: persistedState?.isHost ?? false,
  gameStatus: persistedState?.gameStatus ?? ("idle" as const),
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
    set((state) => {
      const newState = {
        roomCode: code,
        myPlayerId: playerId,
        isHost,
        gameStatus: "waiting" as const,
      };
      persistState({ ...state, ...newState });
      return newState;
    }),

  setPlayers: (players) =>
    set((state) => {
      persistState({ ...state, players });
      return { players };
    }),

  setGameStatus: (status) =>
    set((state) => {
      persistState({ ...state, gameStatus: status });
      return { gameStatus: status };
    }),

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

  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    set(initialState);
  },

  resetGameState: () =>
    set((state) => {
      const newState = {
        currentWord: "",
        requiredLetter: "",
        wordHistory: [] as string[],
        currentPlayerId: null,
        scores: {} as Record<string, number>,
        timeLeft: 15,
        isMyTurn: false,
        errorMessage: null,
        isValidating: false,
        gameStatus: "waiting" as const,
        winnerId: null,
        loserId: null,
      };
      persistState({ ...state, gameStatus: "waiting" });
      return newState;
    }),
}));
