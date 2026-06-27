import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Reuse a single pool across hot-reloads / serverless invocations.
const globalForDb = globalThis as unknown as { _pool?: Pool };

const pool =
  globalForDb._pool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") globalForDb._pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
