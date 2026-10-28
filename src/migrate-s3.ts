// The object store's migration: make sure the bucket exists. Idempotent,
// so fghj can run it on every start that includes s3.
import { CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { bucket, s3 } from "./s3.ts";

try {
  await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log(`bucket ${bucket} already exists`);
} catch {
  await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  console.log(`created bucket ${bucket}`);
}
