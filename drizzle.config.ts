import { defineConfig } from "drizzle-kit";

// Load .env.local for CLI commands (Node 20.12+ / 25).
try {
  process.loadEnvFile(".env.local");
} catch {
  // no-op: env may already be provided (e.g. vercel env / CI)
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
