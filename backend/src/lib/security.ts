import type { Socket } from "socket.io";
import { z } from "zod";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

export function checkRateLimit(socketId: string, event: string): boolean {
  const key = `${socketId}:${event}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

export function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

setInterval(cleanupRateLimitMap, 60000);

export function validatePayload<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { valid: true; data: T } | { valid: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  const errorMessage = result.error.issues
    .map((e) => e.message)
    .join(", ");

  return { valid: false, error: errorMessage };
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, "")
    .slice(0, 100);
}

export function sanitizePlayerName(name: string): string {
  return sanitizeString(name).slice(0, 20);
}