import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL || "pglite";
const isPglite = url === "pglite";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(isPglite
    ? { driver: "pglite", dbCredentials: { url: "./.pglite-data" } }
    : { dbCredentials: { url } }),
});
