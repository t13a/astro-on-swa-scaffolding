import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { announcements } from "../db/schema.js";
import { dbMiddleware } from "../db/middleware.js";
import type { AzureEnv } from "../lib/hono-azurefunc-adapter.js";
import type { DbEnv } from "../db/middleware.js";

type Env = AzureEnv & DbEnv;

const app = new Hono<Env>()
  .use("*", dbMiddleware)
  .get("/", async (c) => {
    const db = c.var.db;
    const rows = await db
      .select()
      .from(announcements)
      .where(eq(announcements.published, true))
      .orderBy(desc(announcements.createdAt));
    return c.json(rows, 200);
  });

export default app;
