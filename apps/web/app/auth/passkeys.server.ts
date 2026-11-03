// Whether the account has a passkey on any device. Better Auth's own
// `listPasskeys` needs the request's session headers; this only needs the
// user's id.
export async function hasPasskey(
  db: D1Database,
  userId: string,
): Promise<boolean> {
  const row = await db
    .prepare('SELECT 1 FROM "passkey" WHERE "userId" = ? LIMIT 1')
    .bind(userId)
    .first();
  return row !== null;
}
