import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./config.ts";

// One client, one endpoint: the https name a browser uses. Every URL it
// signs is valid wherever that name resolves, which with fghj is everywhere.
export const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
});

export const bucket = config.s3.bucket;

const TTL = 300;

export function presignGet(key: string, downloadAs?: string) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: downloadAs
        ? `attachment; filename="${downloadAs.replaceAll('"', "")}"`
        : undefined,
    }),
    { expiresIn: TTL },
  );
}

export function presignPut(key: string, contentType: string) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: TTL },
  );
}
