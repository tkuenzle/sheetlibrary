import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { testEnv } from "../db/local-env.test-helper";
import { addUser } from "../sheets/sheets.test-helper";
import { hasPasskey } from "./passkeys.server";
import { addPasskey } from "./passkeys.test-helper";

describe("hasPasskey", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
    await addUser(db, "bo");
  });
  afterEach(() => test.dispose());

  it("is false for an account without a passkey", async () => {
    expect(await hasPasskey(db, "ana")).toBe(false);
  });

  it("is true for an account with a passkey, and only for it", async () => {
    await addPasskey(db, "ana");
    expect(await hasPasskey(db, "ana")).toBe(true);
    expect(await hasPasskey(db, "bo")).toBe(false);
  });
});
