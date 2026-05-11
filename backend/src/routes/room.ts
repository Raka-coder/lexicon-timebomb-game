import { Hono } from "hono";
import { getRoomByCode, isRoomPasswordProtected } from "../game/roomManager";

const roomRoutes = new Hono();

roomRoutes.get("/:code", (c) => {
  const code = c.req.param("code").toUpperCase();
  const room = getRoomByCode(code);

  if (!room) {
    return c.json({
      exists: false,
      playerCount: 0,
      status: "not_found",
      hasPassword: false,
    });
  }

  return c.json({
    exists: true,
    playerCount: room.players.size,
    status: room.status,
    hasPassword: isRoomPasswordProtected(code),
  });
});

roomRoutes.post("/check-password", async (c) => {
  const body = await c.req.json();
  const { roomCode, password } = body;

  if (!roomCode || !password) {
    return c.json({ valid: false, message: "Kode room dan password diperlukan" }, 400);
  }

  const room = getRoomByCode(roomCode.toUpperCase());
  if (!room) {
    return c.json({ valid: false, message: "Room tidak ditemukan" }, 404);
  }

  if (!room.password) {
    return c.json({ valid: true, message: "Room tidak memiliki password" });
  }

  const isValid = room.password === password;
  return c.json({
    valid: isValid,
    message: isValid ? "Password benar" : "Password salah",
  });
});

export default roomRoutes;