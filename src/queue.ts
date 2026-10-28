import { Redis } from "ioredis";
import { config } from "./config.ts";

export const redis = new Redis(config.redisUrl, { lazyConnect: true });

// files-worker BRPOPs this list. The contract between the two repos is
// just this key and the JSON shape below.
export const THUMBNAIL_QUEUE = "files:thumbnail-jobs";

export type ThumbnailJob = { fileId: string; key: string; contentType: string };

export async function enqueueThumbnail(job: ThumbnailJob) {
  await redis.lpush(THUMBNAIL_QUEUE, JSON.stringify(job));
}
