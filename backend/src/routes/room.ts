import { Hono } from "hono";
import { getRoomByCode } from "../game/roomManager";

const roomRoutes = new Hono();

roomRoutes.get("/:code", (c) => {
  const code = c.req.param("code").toUpperCase();
  const room = getRoomByCode(code);

  if (!room) {
    return c.json({ exists: false, playerCount: 0, status: "not_found" });
  }

  return c.json({
    exists: true,
    playerCount: room.players.size,
    status: room.status,
  });
});

export default roomRoutes;