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
  "uang",
  "makan",
  "jalan",
  "belajar",
];

export function initGameState(playerIds: string[]): GameState {
  const startWord =
    HARDCODED_START_WORDS[
      Math.floor(Math.random() * HARDCODED_START_WORDS.length)
    ] || "rumah";

  const firstPlayerId =
    playerIds[Math.floor(Math.random() * playerIds.length)] || null;

  return {
    currentWord: startWord,
    requiredLetter: startWord[startWord.length - 1] || "",
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

  if (normalizedWord.length < 3) {
    return { valid: false, reason: "too_short" };
  }

  if (normalizedWord[0] !== requiredLetter) {
    return { valid: false, reason: "wrong_start_letter" };
  }

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
  return playerIds[nextIndex] || playerIds[0] || "";
}