import type { MiddlewareHandler } from "hono";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { config, issuer } from "./config.ts";

// Descope publishes its keys per project.
const jwks = createRemoteJWKSet(
  new URL(`https://api.descope.com/${config.descopeProjectId}/.well-known/jwks.json`),
);

export type AuthEnv = { Variables: { userId: string } };

export const requireUser: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return c.json({ error: "missing bearer token" }, 401);
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer });
    if (!payload.sub) throw new Error("token has no sub");
    c.set("userId", payload.sub);
  } catch (err) {
    return c.json({ error: `invalid token: ${(err as Error).message}` }, 401);
  }
  await next();
};
