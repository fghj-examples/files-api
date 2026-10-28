import { randomUUID } from "node:crypto";
import { HeadObjectCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { type AuthEnv, requireUser } from "./auth.ts";
import { config, issuer } from "./config.ts";
import { db, type FileRow } from "./db.ts";
import { bucket, presignGet, presignPut, s3 } from "./s3.ts";

const app = new Hono<AuthEnv>().basePath("/api");

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

// What the frontend needs to start a login. Served from here so the
// project id lives in exactly one repo.
app.get("/config", (c) =>
  c.json({ issuer, clientId: config.descopeProjectId }),
);

async function present(row: FileRow) {
  return {
    id: row.id,
    name: row.name,
    contentType: row.content_type,
    size: Number(row.size),
    sample: row.owner_id === null,
    status: row.status,
    createdAt: row.created_at,
    downloadUrl: await presignGet(row.object_key, row.name),
    thumbUrl: row.thumb_key ? await presignGet(row.thumb_key) : null,
  };
}

app.get("/files", requireUser, async (c) => {
  const { rows } = await db.query<FileRow>(
    `select * from files
      where status = 'ready' and (owner_id = $1 or owner_id is null)
      order by owner_id is null, created_at desc`,
    [c.get("userId")],
  );
  return c.json(await Promise.all(rows.map(present)));
});

// Step 1 of an upload: reserve a row and hand back a URL the browser PUTs
// the bytes to directly. The bytes never pass through this service.
app.post("/files", requireUser, async (c) => {
  const body = await c.req.json<{ name: string; contentType: string; size: number }>();
  const contentType = body.contentType || "application/octet-stream";
  const key = `uploads/${c.get("userId")}/${randomUUID()}`;
  const { rows } = await db.query<{ id: string }>(
    `insert into files (owner_id, name, content_type, size, object_key)
     values ($1, $2, $3, $4, $5) returning id`,
    [c.get("userId"), body.name, contentType, body.size, key],
  );
  return c.json({ id: rows[0].id, uploadUrl: await presignPut(key, contentType) });
});

// Step 2: the browser says it's done. Check the object really landed.
app.post("/files/:id/complete", requireUser, async (c) => {
  const { rows } = await db.query<FileRow>(
    `select * from files where id = $1 and owner_id = $2`,
    [c.req.param("id"), c.get("userId")],
  );
  const row = rows[0];
  if (!row) return c.json({ error: "not found" }, 404);
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: row.object_key }));
  } catch {
    return c.json({ error: "object was not uploaded" }, 409);
  }
  const { rows: updated } = await db.query<FileRow>(
    `update files set status = 'ready' where id = $1 returning *`,
    [row.id],
  );
  return c.json(await present(updated[0]));
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message }, 500);
});

serve({ fetch: app.fetch, port: config.port }, ({ port }) =>
  console.log(`files-api listening on :${port}`),
);
