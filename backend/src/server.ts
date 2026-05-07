import { createServer } from "http";
import { Server } from "socket.io";
import type { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app";
import { CONFIG } from "./lib/constants";

export function createHttpServer(): ReturnType<typeof createServer> {
  const app = createApp();

  const server = createServer((req, res) => {
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v) {
        const value = Array.isArray(v) ? v.join(", ") : v;
        headers.set(k, value);
      }
    }
    
    const protocol = (req.socket as any).encrypted ? "https" : "http";
    const fullUrl = `${protocol}://${req.headers.host}${req.url}`;
    
    const method = req.method || "GET";
    const bodyReader = ["GET", "HEAD"].includes(method) ? null : req;
    
    Promise.resolve(app.fetch(new Request(fullUrl, { method, headers, body: bodyReader as any })))
      .then((response: Response) => {
        res.writeHead(response.status, {
          ...Object.fromEntries(response.headers),
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        });
        return response.text();
      })
      .then((text: string) => res.end(text))
      .catch(() => { res.writeHead(500); res.end("Error"); });
  });

  return server;
}

export function createSocketIO(server: ReturnType<typeof createServer>): SocketIOServer {
  const io = new Server(server, {
    cors: {
      origin: CONFIG.CORS_ORIGINS,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  console.log(`Socket.IO initialized with origins: ${CONFIG.CORS_ORIGINS.join(", ")}`);

  return io;
}