import { Hono } from "hono";
import { isUsernameAvailable } from "../auth/userManager";

const authRoutes = new Hono();

authRoutes.get("/check-username/:username", (c) => {
  const username = c.req.param("username");
  const available = isUsernameAvailable(username);
  return c.json({ available, username });
});

export default authRoutes;