import { hc } from "hono/client";
import type { AppType } from "api/src/app.js";

export const apiClient = hc<AppType>("/").api;
