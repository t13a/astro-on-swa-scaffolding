import { createMiddleware } from "hono/factory";
import { getDb } from "./client.js";

type Db = Awaited<ReturnType<typeof getDb>>;

export type DbEnv = {
  Variables: {
    db: Db;
  };
};

export const dbMiddleware = createMiddleware<DbEnv>(async (c, next) => {
  const db = await getDb();
  c.set("db", db);
  await next();
});
