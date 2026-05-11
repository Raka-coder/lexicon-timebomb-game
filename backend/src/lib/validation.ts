import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(20, "Nama maksimal 20 karakter")
    .regex(/^[a-zA-Z0-9\s]+$/, "Nama hanya boleh huruf, angka, dan spasi"),
  password: z.string().max(20).optional(),
});

export const joinRoomSchema = z.object({
  roomCode: z
    .string()
    .length(5, "Kode room harus 5 karakter")
    .regex(/^[A-Z0-9]+$/, "Kode room tidak valid"),
  playerName: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(20, "Nama maksimal 20 karakter")
    .regex(/^[a-zA-Z0-9\s]+$/, "Nama hanya boleh huruf, angka, dan spasi"),
  password: z.string().max(20).optional(),
});

export const submitWordSchema = z.object({
  word: z
    .string()
    .min(3, "Kata minimal 3 karakter")
    .max(50, "Kata maksimal 50 karakter")
    .regex(/^[a-zA-Z]+$/, "Kata hanya boleh huruf"),
});

export const syncRoomSchema = z.object({
  roomCode: z
    .string()
    .length(5, "Kode room harus 5 karakter")
    .regex(/^[A-Z0-9]+$/, "Kode room tidak valid"),
  playerId: z.string().uuid().optional().nullable(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type SubmitWordInput = z.infer<typeof submitWordSchema>;
export type SyncRoomInput = z.infer<typeof syncRoomSchema>;