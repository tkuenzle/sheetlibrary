// Writes the next D1 migration for Better Auth's tables, if it needs one.
// Usage: pnpm --filter web auth-migration <name>
//
// Better Auth compares its options with a database. Ours only exists inside
// the Worker runtime, so this applies the existing migrations to a throwaway
// local D1 and lets Better Auth compare against that.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { BetterAuthOptions } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { runnerImport } from "vite";
import { getPlatformProxy } from "wrangler";

const name = process.argv[2];
if (!name || !/^[a-z0-9-]+$/.test(name)) {
  console.error("Usage: auth-migration <name>, in lowercase words joined by -");
  process.exit(1);
}

const migrationsDir = new URL("../migrations/", import.meta.url).pathname;

// app/auth/auth.server.ts, typed loosely: the worker's Env type isn't
// available to Node scripts.
interface AuthModule {
  authOptions(env: unknown, origin: string): BetterAuthOptions;
}
const state = mkdtempSync(join(tmpdir(), "auth-migration-"));
try {
  execFileSync(
    "wrangler",
    [
      "d1",
      "migrations",
      "apply",
      "DB",
      "--local",
      "--persist-to",
      state,
      "--config",
      "wrangler.jsonc",
    ],
    { stdio: "inherit", env: { ...process.env, CI: "true" } },
  );
  const { env, dispose } = await getPlatformProxy({
    persist: { path: join(state, "v3") },
  });
  try {
    const { module } = await runnerImport<AuthModule>(
      "./app/auth/auth.server.ts",
    );
    const options = module.authOptions(env, "http://localhost");
    const { compileMigrations, toBeCreated, toBeAdded, toBeAddedIndexes } =
      await getMigrations(options);
    const changes =
      toBeCreated.length + toBeAdded.length + toBeAddedIndexes.length;
    if (changes === 0) {
      console.log("The schema is up to date.");
    } else {
      const next = readdirSync(migrationsDir).filter((file) =>
        file.endsWith(".sql"),
      ).length;
      const file = `${String(next + 1).padStart(4, "0")}_${name}.sql`;
      const sql = await compileMigrations();
      writeFileSync(
        join(migrationsDir, file),
        `-- Better Auth's tables, written by scripts/auth-migration.ts.\n\n${sql}`,
      );
      console.log(`Wrote migrations/${file}`);
    }
  } finally {
    await dispose();
  }
} finally {
  rmSync(state, { recursive: true, force: true });
}
