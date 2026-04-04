import { hc } from "hono/client";
import type { AppType } from "api/src/routes/index.ts";

export const apiClient = hc<AppType>("/").api;
