function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required("DATABASE_URL"),
  s3: {
    endpoint: required("S3_ENDPOINT"),
    bucket: required("S3_BUCKET"),
    accessKey: required("S3_ACCESS_KEY"),
    secretKey: required("S3_SECRET_KEY"),
  },
};
