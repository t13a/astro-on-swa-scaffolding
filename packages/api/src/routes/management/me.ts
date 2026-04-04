import { Hono } from "hono";
import type { AuthEnv } from "../../auth/middleware.js";
import { AzureEnv } from "../../lib/hono-azurefunc-adapter.js";

type Env = AzureEnv & AuthEnv;

const app = new Hono<Env>().get("/", async (c) => {
  return c.json(c.var.clientPrincipal, 200);
});

export default app;
