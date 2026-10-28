import { ListBucketsCommand } from "@aws-sdk/client-s3";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "./config.ts";
import { db } from "./db.ts";
import { s3 } from "./s3.ts";

const app = new Hono().basePath("/api");

app.get("/health", (c) => c.json({ ok: true }));

// What this api can reach, and at which address. Not for the frontend: for
// you, with curl, when something isn't connecting.
app.get("/status", async (c) => {
  const { rows } = await db.query<{ version: string }>("select version()");
  const { Buckets = [] } = await s3.send(new ListBucketsCommand({}));
  return c.json({
    db: rows[0].version,
    s3: { endpoint: config.s3.endpoint, buckets: Buckets.map((b) => b.Name) },
  });
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message }, 500);
});

serve({ fetch: app.fetch, port: config.port }, ({ port }) =>
  console.log(`files-api listening on :${port}`),
);
