// Adds a passkey for this user. Only the owner matters to the tests, so the
// key itself is made up.
export async function addPasskey(db: D1Database, userId: string) {
  await db
    .prepare(
      'INSERT INTO "passkey" ("id", "publicKey", "userId", "credentialID", "counter", "deviceType", "backedUp") VALUES (?, ?, ?, ?, 0, ?, 0)',
    )
    .bind(
      crypto.randomUUID(),
      "key",
      userId,
      crypto.randomUUID(),
      "singleDevice",
    )
    .run();
}
