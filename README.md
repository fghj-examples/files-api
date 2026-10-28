# files-api

The backend of the [fghj](https://github.com/mlnja/fghj) `files` example: a
small Hono service that keeps file metadata in Postgres, the bytes in MinIO,
and hands the browser presigned URLs so the bytes never pass through it.

What its `.fghj.yaml` shows:

- **Two stores, two migrations.** `migrate-db` (dbmate) migrates `db`;
  `migrate-s3` creates the bucket in `s3`. Anything that waits on a store
  waits on its migration too.
- **One seed for both stores.** `seed` uploads sample files and inserts the
  rows that point at them. fghj runs it only when either store holds new
  data.
- **Presigning through the http zone.** `S3_ENDPOINT` is
  `https://${FGHJ_SERVICE_FQDN_HTTP:s3}`, the same name the browser uses, so
  every signed URL works outside the network as well as inside it.
- **Descope login.** The project id is public and lives only here; the
  frontend reads it from `GET /api/config`.

- **A debugger port.** `debug: 9229` publishes Node's inspector, which
  `docker-entrypoint.sh` starts.

Flows: `app` (the api and what it needs), `storage` (just MinIO), `demo`
(the api plus the seed).

## The tutorial

This repo is the example the [fghj tutorial](https://fghj.mlops.ninja/tutorial/)
builds, one chapter at a time. Each chapter it appears in is a tag, `ch1`
to `ch7`, and `git diff ch3 ch4` is what chapter 4 adds. `main` is
the finished repo.
