import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { announcements } from "../../db/schema.js";
import type { AuthEnv } from "./middleware.js";
import type { DbEnv } from "../../db/middleware.js";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  published: z.coerce.boolean().optional().default(false),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  published: z.coerce.boolean().optional(),
});

type Env = AuthEnv & DbEnv;

const app = new Hono<Env>()
  .get("/", async (c) => {
    const db = c.var.db;
    const rows = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
    return c.json(rows, 200);
  })
  .post("/", zValidator("json", createSchema), async (c) => {
    const db = c.var.db;
    const data = c.req.valid("json");
    const principal = c.var.clientPrincipal;
    const [row] = await db
      .insert(announcements)
      .values({ ...data, createdBy: principal.userDetails })
      .returning();
    return c.json(row, 201);
  })
  .put("/:id", zValidator("json", updateSchema), async (c) => {
    const db = c.var.db;
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");
    const [row] = await db
      .update(announcements)
      .set(data)
      .where(eq(announcements.id, id))
      .returning();
    if (!row) return c.text("Not Found", 404);
    return c.json(row, 200);
  })
  .delete("/:id", async (c) => {
    const db = c.var.db;
    const id = Number(c.req.param("id"));
    const [row] = await db
      .delete(announcements)
      .where(eq(announcements.id, id))
      .returning();
    if (!row) return c.text("Not Found", 404);
    return c.json({ deleted: true }, 200);
  });

export default app;
