import { Hono } from "hono";
import { z } from "zod";
import {
  isUsernameAvailable,
  loginUser,
  registerUser,
} from "../auth/userManager";

const authRoutes = new Hono();

const registerSchema = z.object({
  username: z.string().min(2).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(4).max(32),
});

const loginSchema = z.object({
  username: z.string().min(2).max(20),
  password: z.string().min(1).max(32),
});

authRoutes.get("/check-username/:username", (c) => {
  const username = c.req.param("username");
  const available = isUsernameAvailable(username);
  return c.json({ available, username });
});

authRoutes.post("/register", async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ ok: false, message: "Payload JSON tidak valid" }, 400);
  }

  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json(
      { ok: false, message: parsed.error.issues.map((i) => i.message).join(", ") },
      400,
    );
  }

  const result = registerUser(parsed.data.username, parsed.data.password);
  if (!result.success) {
    return c.json({ ok: false, message: result.error }, 400);
  }

  return c.json({
    ok: true,
    userId: result.userId,
    token: result.token,
    username: parsed.data.username.slice(0, 20),
  });
});

authRoutes.post("/login", async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ ok: false, message: "Payload JSON tidak valid" }, 400);
  }

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json(
      { ok: false, message: parsed.error.issues.map((i) => i.message).join(", ") },
      400,
    );
  }

  const result = loginUser(parsed.data.username, parsed.data.password);
  if (!result.success) {
    return c.json({ ok: false, message: result.error }, 401);
  }

  return c.json({
    ok: true,
    userId: result.userId,
    token: result.token,
    username: result.username,
  });
});

export default authRoutes;
