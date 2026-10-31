import { APIError } from "better-auth/api";

import { notInvited, tooManyEmails } from "./error-codes";

// Each address gets at most this many emails in this window. The limit per
// visitor is Better Auth's, in auth.server.ts.
export const emailsPerAddress = { max: 3, windowMs: 15 * 60 * 1000 };

async function countEmail(db: D1Database, email: string): Promise<void> {
  const now = Date.now();
  const since = now - emailsPerAddress.windowMs;
  const row = await db
    .prepare(
      'SELECT count(*) AS sent FROM "signInEmail" WHERE "email" = ? AND "sentAt" > ?',
    )
    .bind(email, since)
    .first<{ sent: number }>();
  if ((row?.sent ?? 0) >= emailsPerAddress.max) {
    throw new APIError("TOO_MANY_REQUESTS", {
      code: tooManyEmails,
      message: "Too many sign-in emails. Try again later.",
    });
  }
  await db.batch([
    db
      .prepare('DELETE FROM "signInEmail" WHERE "email" = ? AND "sentAt" <= ?')
      .bind(email, since),
    db
      .prepare('INSERT INTO "signInEmail" ("email", "sentAt") VALUES (?, ?)')
      .bind(email, now),
  ]);
}

// On Workers Free, Cloudflare only sends to verified addresses, which are the
// invite list. It refuses any other address with an error like "destination
// address is not a verified address".
function isUninvitedRecipient(error: unknown): boolean {
  return error instanceof Error && /not (a )?verified/i.test(error.message);
}

// The email with the sign-in link.
export async function sendSignInEmail(
  env: Env,
  email: string,
  url: string,
): Promise<void> {
  await countEmail(env.DB, email.toLowerCase());
  try {
    await env.EMAIL.send({
      from: { name: "Sheet Library", email: "sign-in@mail.sheetlibrary.com" },
      to: email,
      subject: "Sign in to Sheet Library",
      text: [
        "Open this link to sign in to Sheet Library:",
        "",
        url,
        "",
        "The link works once, for 15 minutes. If you didn’t ask for it, ignore this email.",
      ].join("\n"),
    });
  } catch (error) {
    if (isUninvitedRecipient(error)) {
      throw new APIError("FORBIDDEN", {
        code: notInvited,
        message: "Sheet Library is invite-only for now.",
      });
    }
    throw error;
  }
}
