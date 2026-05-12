import { Hono } from "hono";
import { getWordCount } from "./dictionary/words";
import roomRoutes from "./routes/room";
import dictionaryRoutes from "./routes/dictionary";
import authRoutes from "./routes/auth";
import { CONFIG } from "./lib/constants";

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self'",
};

export function createApp(): Hono {
  const app = new Hono();

  app.use("*", async (c, next) => {
    const origin = c.req.header("Origin");

    if (origin) {
      const isAllowed =
        CONFIG.CORS_ORIGINS.includes("*") ||
        CONFIG.CORS_ORIGINS.includes(origin);

      if (isAllowed) {
        c.res.headers.set("Access-Control-Allow-Origin", origin);
      }
    }

    c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    c.res.headers.set("Access-Control-Allow-Credentials", "true");
    c.res.headers.set("Access-Control-Max-Age", "86400");

    for (const [key, value] of Object.entries(securityHeaders)) {
      c.res.headers.set(key, value);
    }

    if (c.req.method === "OPTIONS") {
      return c.body(null, 204);
    }

    await next();
  });

  app.get("/api/health", (c) => {
    return c.json({
      status: "ok",
      wordCount: getWordCount(),
      timestamp: new Date().toISOString(),
    });
  });

  app.route("/api/room", roomRoutes);
  app.route("/api/dictionary", dictionaryRoutes);
  app.route("/api/auth", authRoutes);

  return app;
}
