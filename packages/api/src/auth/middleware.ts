import { createMiddleware } from "hono/factory";

export interface ClientPrincipal {
  userId: string;
  userRoles: string[];
  identityProvider: string;
  userDetails: string;
}

export type AuthEnv = {
  Variables: {
    clientPrincipal: ClientPrincipal;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header("x-ms-client-principal");
  if (!header) {
    return c.text("Unauthorized", 401);
  }

  const parsed = JSON.parse(Buffer.from(header, "base64").toString("utf-8"));
  c.set("clientPrincipal", parsed);

  await next();
});
