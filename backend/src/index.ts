import { createHttpServer, createSocketIO } from "./server";
import { setupSocketHandlers } from "./socket";
import { TimerManager } from "./game/timerManager";
import { CONFIG } from "./lib/constants";

const server = createHttpServer();
const io = createSocketIO(server);
const timerManager = new TimerManager(io);

setupSocketHandlers(io, timerManager);

server.listen(CONFIG.PORT, () => {
  console.log(`Server running on http://localhost:${CONFIG.PORT}`);
  console.log(`Socket.IO ready`);
  console.log(`Allowed origins: ${CONFIG.ALLOWED_ORIGINS.join(", ")}`);
});