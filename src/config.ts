function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  descopeProjectId: required("DESCOPE_PROJECT_ID"),
  databaseUrl: required("DATABASE_URL"),
  redisUrl: required("REDIS_URL"),
  s3: {
    endpoint: required("S3_ENDPOINT"),
    bucket: required("S3_BUCKET"),
    accessKey: required("S3_ACCESS_KEY"),
    secretKey: required("S3_SECRET_KEY"),
  },
  internalToken: required("INTERNAL_TOKEN"),
};

// Descope's OIDC issuer for a project. The project id doubles as the
// OAuth client id, and it's public: the browser sees it anyway.
export const issuer = `https://api.descope.com/${config.descopeProjectId}`;
