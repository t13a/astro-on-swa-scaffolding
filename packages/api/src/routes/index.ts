import { Hono } from "hono";
import type { AzureEnv } from "../lib/hono-azurefunc-adapter.js";
import greeting from "./greeting.js";
import announcements from "./announcements.js";
import management from "./management/index.js";

const app = new Hono<AzureEnv>()
  .basePath("/api")
  .route("/announcements", announcements)
  .route("/greeting", greeting)
  .route("/management", management);

export default app;

export type AppType = typeof app;
