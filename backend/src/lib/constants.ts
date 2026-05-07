import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const CONFIG = {
  PORT: parseInt(process.env.PORT || "3001"),
  
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim()),
  
  TIMER_DURATION: parseInt(process.env.TIMER_DURATION || "15"),
  
  START_WORD: process.env.START_WORD || "rumah",
  
  WORD_MIN_LENGTH: 3,
  WORD_MAX_LENGTH: 20,
  
  ROOM_CODE_LENGTH: parseInt(process.env.ROOM_CODE_LENGTH || "5"),
  
  AVOID_LETTERS: ["0", "O", "1", "I"],
} as const;

export function loadEnvFile(): void {
  const envPath = join(__dirname, "../../.env");
  
  if (!existsSync(envPath)) {
    return;
  }
  
  const envContent = readFileSync(envPath, "utf-8");
  const envLines = envContent.split("\n");
  
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  }
}

loadEnvFile();