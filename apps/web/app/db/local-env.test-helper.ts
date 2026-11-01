import { vi } from "vitest";
import { getPlatformProxy } from "wrangler";

import { applyMigrations } from "./migrations.server";

// Bindings from wrangler.jsonc, backed by a local D1 in memory, for tests that
// need a real database. Call dispose() when done.
export function localEnv() {
  return getPlatformProxy<Env>({ persist: false });
}

// A local env with the migrations applied, a secret, and an EMAIL binding
// that records what it sends.
export async function testEnv() {
  const local = await localEnv();
  await applyMigrations(local.env.DB);
  const send = vi
    .fn<
      (message: EmailMessage | EmailMessageBuilder) => Promise<EmailSendResult>
    >()
    .mockResolvedValue({ messageId: "1" });
  const env: Env = {
    ...local.env,
    BETTER_AUTH_SECRET: "a-secret-for-tests-only-0123456789",
    EMAIL: { send },
  };
  return { env, send, dispose: local.dispose };
}
