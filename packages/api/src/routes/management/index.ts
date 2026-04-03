import { Hono } from "hono";
import type { AuthEnv } from "./middleware.js";
import { auth } from "./middleware.js";
import me from "./me.js";

const app = new Hono<AuthEnv>()
  .use("*", auth)
  .route("/me", me);

export default app;
