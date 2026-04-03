import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

type Db = PgliteDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

let _db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;

  if (!url || url === "pglite") {
    const pgliteMod = await import("@electric-sql/pglite");
    const drizzleMod = await import("drizzle-orm/pglite");
    const pglite = new pgliteMod.PGlite("./.pglite-data");
    _db = drizzleMod.drizzle(pglite, { schema });
    return _db;
  }

  const pg = await import("postgres");
  const drizzlePg = await import("drizzle-orm/postgres-js");
  const client = (pg.default as unknown as typeof pg.default)(url);
  _db = drizzlePg.drizzle(client, { schema });
  return _db;
}
