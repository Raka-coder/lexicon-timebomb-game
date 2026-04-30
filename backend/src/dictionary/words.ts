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
  source: "offline";
};

export function validateWord(word: string): ValidationResult {
  const w = word.trim().toLowerCase().replace(/[^a-z]/g, "");

  if (w.length < 3) {
    return { valid: false, source: "offline" };
  }

  const words = loadWordSet();
  if (words.has(w)) {
    return { valid: true, source: "offline" };
  }

  return { valid: false, source: "offline" };
}

export function getRandomStartWord(): string {
  const words = loadWordSet();
  const candidates = [...words].filter(
    (w) => w.length >= 4 && w.length <= 8 && /^[a-z]+$/.test(w)
  );

  if (candidates.length === 0) {
    return "rumah";
  }

  return candidates[Math.floor(Math.random() * candidates.length)] || "rumah";
}

export function getWordCount(): number {
  return loadWordSet().size;
}