import { createMiddleware } from "hono/factory";
import type { AzureEnv } from "../../lib/hono-azurefunc-adapter.js";

export interface ClientPrincipal {
  userId: string;
  userRoles: string[];
  identityProvider: string;
  userDetails: string;
}

export type AuthEnv = AzureEnv & {
  Variables: {
    clientPrincipal: ClientPrincipal;
  };
};

export const auth = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header("x-ms-client-principal");
  if (!header) {
    return c.text("Unauthorized", 401);
  }

  const parsed = JSON.parse(Buffer.from(header, "base64").toString("utf-8"));
  c.set("clientPrincipal", parsed);

  await next();
});
