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

// How many passkeys the account has, on all its devices. The shell loads it,
// so the account page's skeleton has a row for each. See
// openspec/specs/site-layout ("What the skeleton already knows").
export async function countPasskeys(
  db: D1Database,
  userId: string,
): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS "count" FROM "passkey" WHERE "userId" = ?')
    .bind(userId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}
