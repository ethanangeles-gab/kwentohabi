import { neon } from "@neondatabase/serverless";
import type { NextFunction, Request, Response } from "express";
import {
  createInitialDatabase,
  runWithDatabase,
  type Database,
} from "./store";

type WorkspaceRow = { revision: string; state: Database | string };

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;
const sql = connectionString ? neon(connectionString) : null;

function sendJson(res: Response, status: number, error: string) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(JSON.stringify({ error }));
}

async function loadWorkspace(): Promise<WorkspaceRow> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");
  let rows = (await sql.query(
    "SELECT revision::text AS revision, state FROM kwentohabi_workspace WHERE id = 1",
  )) as WorkspaceRow[];
  if (!rows.length) {
    await sql.query(
      "INSERT INTO kwentohabi_workspace (id, revision, state) VALUES (1, 0, $1::jsonb) ON CONFLICT (id) DO NOTHING",
      [JSON.stringify(createInitialDatabase())],
    );
    rows = (await sql.query(
      "SELECT revision::text AS revision, state FROM kwentohabi_workspace WHERE id = 1",
    )) as WorkspaceRow[];
  }
  if (!rows.length) throw new Error("Workspace database row is missing.");
  return rows[0];
}

export function persistentDatabaseMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.path.startsWith("/api/")) return next();
  const enabled =
    process.env.VERCEL === "1" ||
    Boolean(
      process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL,
    );
  if (!enabled) return next();
  if (!sql)
    return sendJson(
      res,
      503,
      "Persistent storage is not configured. Connect a Postgres database and set DATABASE_URL.",
    );

  void loadWorkspace()
    .then(({ revision, state }) => {
      const database =
        typeof state === "string" ? (JSON.parse(state) as Database) : state;
      runWithDatabase(database, (context) => {
        const send = res.send.bind(res);
        let finishing = false;
        res.send = ((body?: unknown) => {
          if (finishing) return res;
          finishing = true;
          if (!context.dirty) return send(body);
          const serialized = JSON.stringify(context.database);
          void sql
            .query(
              "UPDATE kwentohabi_workspace SET state = $1::jsonb, revision = revision + 1, updated_at = now() WHERE id = 1 AND revision = $2::bigint RETURNING revision",
              [serialized, revision],
            )
            .then((updated) => {
              if (!updated.length) {
                res.status(409);
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                send(
                  JSON.stringify({
                    error:
                      "The workspace changed in another request. Refresh and retry; newer saved work was preserved.",
                  }),
                );
                return;
              }
              send(body);
            })
            .catch(() => {
              res.status(503);
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              send(
                JSON.stringify({
                  error:
                    "The workspace database could not save this change. Your local draft is retained; retry when the connection is restored.",
                }),
              );
            });
          return res;
        }) as Response["send"];
        next();
      });
    })
    .catch(() => {
      sendJson(
        res,
        503,
        "The workspace database is unavailable. Check DATABASE_URL and run the database setup command.",
      );
    });
}
