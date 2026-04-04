import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware.js";
import { dbMiddleware } from "../../db/middleware.js";
import me from "./me.js";
import announcements from "./announcements.js";
import { AzureEnv } from "../../lib/hono-azurefunc-adapter.js";

const app = new Hono<AzureEnv>()
  .use("*", authMiddleware)
  .use("*", dbMiddleware)
  .route("/me", me)
  .route("/announcements", announcements);

export default app;
