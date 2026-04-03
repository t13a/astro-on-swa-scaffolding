import { Hono } from "hono";
import type { AuthEnv } from "./middleware.js";
import { auth } from "./middleware.js";
import { dbMiddleware } from "../../db/middleware.js";
import me from "./me.js";
import announcements from "./announcements.js";

const app = new Hono<AuthEnv>()
  .use("*", auth)
  .use("*", dbMiddleware)
  .route("/me", me)
  .route("/announcements", announcements);

export default app;
