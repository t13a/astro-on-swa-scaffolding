import type { PgTable } from "drizzle-orm/pg-core";
import { getTableColumns } from "drizzle-orm/utils";
import { and, asc, desc, eq, ilike, sql, count } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
import type { DbEnv } from "../db/middleware.js";

type Db = DbEnv["Variables"]["db"];

const sortItemSchema = z.object({
  field: z.string(),
  dir: z.enum(["asc", "desc"]),
});

const filterItemSchema = z.object({
  field: z.string(),
  type: z.enum(["like", "="]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const paginatedQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  filter: z.string().optional(),
});

export type PaginatedQueryParams = z.infer<typeof paginatedQuerySchema>;

export async function paginatedQuery<T extends PgTable>(
  db: Db,
  table: T,
  params: PaginatedQueryParams,
): Promise<{ data: T["$inferSelect"][]; last_page: number }> {
  const columns = getTableColumns(table);
  const conditions: SQL[] = [];
  const orderClauses: SQL[] = [];

  if (params.filter) {
    const filters = z.array(filterItemSchema).parse(JSON.parse(params.filter));
    for (const f of filters) {
      const col = columns[f.field];
      if (!col) continue;
      if (f.type === "like") {
        if (col.dataType === "string") {
          conditions.push(ilike(col, `%${f.value}%`));
        } else {
          conditions.push(
            sql`${col}::text ILIKE ${"%" + f.value + "%"}`,
          );
        }
      } else if (f.type === "=") {
        conditions.push(eq(col, f.value));
      }
    }
  }

  if (params.sort) {
    const sorters = z.array(sortItemSchema).parse(JSON.parse(params.sort));
    for (const s of sorters) {
      const col = columns[s.field];
      if (!col) continue;
      orderClauses.push(s.dir === "desc" ? desc(col) : asc(col));
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await (db as any)
    .select({ total: count() })
    .from(table)
    .where(where);

  let query = (db as any).select().from(table).where(where);
  if (orderClauses.length > 0) {
    query = query.orderBy(...orderClauses);
  }
  const data = await query
    .limit(params.size)
    .offset((params.page - 1) * params.size);

  return {
    data,
    last_page: Math.ceil(Number(total) / params.size) || 1,
  };
}
