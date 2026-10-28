import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono().basePath("/api");

app.get("/health", (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, ({ port }) =>
  console.log(`files-api listening on :${port}`),
);
