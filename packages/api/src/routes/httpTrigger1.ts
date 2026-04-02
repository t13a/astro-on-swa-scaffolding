import { Hono } from "hono";
import type { AzureEnv } from "../lib/hono-azurefunc-adapter.js";

const app = new Hono<AzureEnv>().on(["GET", "POST"], "/", async (c) => {
  c.env.context.log(`Http function processed request for url "${c.req.url}"`);

  const name = c.req.query("name") || (await c.req.text()) || "world";

  return c.text(`Hello, ${name}!`);
});

export default app;
