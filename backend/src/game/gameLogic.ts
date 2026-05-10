export interface GameState {
  currentWord: string;
  requiredLetter: string;
  wordHistory: string[];
  currentPlayerId: string | null;
  scores: Record<string, number>;
}

export function initGameState(
  playerIds: string[],
  startWord: string = "rumah",
  firstPlayerIdOverride?: string | null
): GameState {
  let firstPlayerId: string | null;
  
  if (firstPlayerIdOverride && playerIds.includes(firstPlayerIdOverride)) {
    firstPlayerId = firstPlayerIdOverride;
  } else {
    firstPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)] || null;
  }

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

export function getHostFirstPlayerId(playerIds: string[], hostPlayerId?: string | null): string | null {
  if (playerIds.length === 0) return null;
  if (hostPlayerId && playerIds.includes(hostPlayerId)) {
    return hostPlayerId;
  }
  return playerIds[0] ?? null;
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
