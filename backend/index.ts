import { Hono } from "hono";
import { Server } from "socket.io";
import { serve } from "@hono/node-server";
import { setupGameHandlers } from "./src/socket/gameHandler";
import roomRoutes from "./src/routes/room";

const app = new Hono();

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.route("/api/room", roomRoutes);

const PORT = parseInt(process.env.PORT || "3001");

const server = serve({
  fetch: app.fetch,
  port: PORT,
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

setupGameHandlers(io);

console.log(`Server running on http://localhost:${PORT}`);