import { Hono } from "hono";
import type { AuthEnv } from "./middleware.js";

const app = new Hono<AuthEnv>().get("/", async (c) => {
  return c.json(c.var.clientPrincipal, 200);
});

export default app;
