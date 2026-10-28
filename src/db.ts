import pg from "pg";
import { config } from "./config.ts";

export const db = new pg.Pool({ connectionString: config.databaseUrl });

export type FileRow = {
  id: string;
  owner_id: string | null;
  name: string;
  content_type: string;
  size: string;
  object_key: string;
  thumb_key: string | null;
  status: "pending" | "ready";
  created_at: Date;
};
