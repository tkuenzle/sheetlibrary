// Adds a user with this id, since sheets reference their owner.
export async function addUser(db: D1Database, id: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, 1, ?, ?)',
    )
    .bind(id, "", `${id}@example.com`, now, now)
    .run();
}
