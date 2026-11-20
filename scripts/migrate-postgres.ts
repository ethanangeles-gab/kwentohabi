import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: [".env.vercel.local", ".env.local", ".env"] });

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error(
    "Set DATABASE_URL (or POSTGRES_URL) before preparing Vercel Postgres.",
  );
}

const sql = neon(connectionString);
await sql.query(`
  CREATE TABLE IF NOT EXISTS kwentohabi_workspace (
    id smallint PRIMARY KEY CHECK (id = 1),
    revision bigint NOT NULL DEFAULT 0,
    state jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`);
console.log("KwentoHabi Postgres table is ready. Existing rows were not changed.");
