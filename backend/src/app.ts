import { Hono } from "hono";
import { getWordCount } from "./dictionary/words";
import roomRoutes from "./routes/room";
import dictionaryRoutes from "./routes/dictionary";

export function createApp(): Hono {
  const app = new Hono();

  app.use("*", async (c, next) => {
    c.res.headers.set("Access-Control-Allow-Origin", "*");
    c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    c.res.headers.set("Access-Control-Allow-Headers", "Content-Type");
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

  return app;
}