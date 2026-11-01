// Applies migrations through a D1 binding, for the preview, which can't use
// `wrangler d1 migrations apply` (see openspec/specs/site-hosting). It keeps
// the same d1_migrations table as wrangler, so both see the same history.

export interface Migration {
  // The file name, such as "0001_auth.sql".
  name: string;
  sql: string;
}

// The files in apps/web/migrations, in order.
export const migrations: Migration[] = Object.entries(
  import.meta.glob<string>("../../migrations/*.sql", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
)
  .map(([path, sql]) => ({ name: path.slice(path.lastIndexOf("/") + 1), sql }))
  .sort((a, b) => a.name.localeCompare(b.name));

const createTable = `CREATE TABLE IF NOT EXISTS d1_migrations(
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
)`;

// The statements of a migration file. Its SQL has no semicolons inside
// strings, so splitting on them is enough.
export function statements(sql: string): string[] {
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement !== "");
}

// Applies the migrations that aren't applied yet, each in one batch, so a
// failing one leaves nothing half done. Returns the names it applied.
export async function applyMigrations(
  db: D1Database,
  all: Migration[] = migrations,
): Promise<string[]> {
  await db.prepare(createTable).run();
  const { results } = await db
    .prepare("SELECT name FROM d1_migrations")
    .all<{ name: string }>();
  const applied = new Set(results.map((row) => row.name));
  const pending = all.filter((migration) => !applied.has(migration.name));
  for (const migration of pending) {
    await db.batch([
      ...statements(migration.sql).map((statement) => db.prepare(statement)),
      db
        .prepare("INSERT INTO d1_migrations (name) VALUES (?)")
        .bind(migration.name),
    ]);
  }
  return pending.map((migration) => migration.name);
}
