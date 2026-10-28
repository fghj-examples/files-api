// Sample files for everyone: objects in s3 and the rows that point at them,
// written together. fghj runs this only when db or s3 holds new data.
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "./db.ts";
import { enqueueThumbnail, redis } from "./queue.ts";
import { bucket, s3 } from "./s3.ts";

function poster(title: string, hue: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 70% 55%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 60) % 360} 70% 25%)"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <circle cx="900" cy="250" r="180" fill="hsl(${(hue + 180) % 360} 80% 70%)" opacity="0.5"/>
  <text x="80" y="680" font-family="Helvetica, Arial, sans-serif" font-size="96"
        font-weight="700" fill="white">${title}</text>
</svg>`;
}

const samples = [
  { name: "harbor.svg", contentType: "image/svg+xml", body: poster("Harbor", 200) },
  { name: "dunes.svg", contentType: "image/svg+xml", body: poster("Dunes", 30) },
  { name: "canopy.svg", contentType: "image/svg+xml", body: poster("Canopy", 120) },
  {
    name: "README.txt",
    contentType: "text/plain",
    body: "These files were put here by the seed in files-api.\n" +
      "Delete the s3 or db volume and fghj runs it again.\n",
  },
];

await redis.connect();
// The seed only runs over new data, but a fresh s3 next to an old db would
// still hold last time's rows, so start from a clean slate.
await db.query(`delete from files where owner_id is null`);

for (const sample of samples) {
  const key = `samples/${sample.name}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: sample.body,
      ContentType: sample.contentType,
    }),
  );
  const { rows } = await db.query<{ id: string }>(
    `insert into files (owner_id, name, content_type, size, object_key, status)
     values (null, $1, $2, $3, $4, 'ready') returning id`,
    [sample.name, sample.contentType, Buffer.byteLength(sample.body), key],
  );
  await enqueueThumbnail({ fileId: rows[0].id, key, contentType: sample.contentType });
  console.log(`seeded ${key}`);
}

await db.end();
redis.disconnect();
