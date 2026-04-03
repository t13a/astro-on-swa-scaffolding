import { Hono } from "hono";
import type { AzureEnv } from "./lib/hono-azurefunc-adapter.js";
import httpTrigger1 from "./routes/httpTrigger1.js";
import management from "./routes/management/index.js";

const app = new Hono<AzureEnv>()
  .basePath("/api")
  .route("/httpTrigger1", httpTrigger1)
  .route("/management", management);

export type AppType = typeof app;

export default app;
