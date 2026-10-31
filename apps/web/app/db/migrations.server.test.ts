import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { localEnv } from "./local-env.test-helper";
import { applyMigrations, migrations, statements } from "./migrations.server";

describe("statements", () => {
  it("splits a file and drops comments", () => {
    expect(
      statements(
        "-- A comment.\n\ncreate table a (x);\n\ncreate index i on a (x);",
      ),
    ).toEqual(["create table a (x)", "create index i on a (x)"]);
  });
});

describe("applyMigrations", () => {
  let env: Awaited<ReturnType<typeof localEnv>>;
  beforeEach(async () => {
    env = await localEnv();
  });
  afterEach(() => env.dispose());

  it("applies the bundled migrations once", async () => {
    const db = env.env.DB;
    expect(await applyMigrations(db)).toEqual(migrations.map((m) => m.name));
    expect(await applyMigrations(db)).toEqual([]);
    const user = await db
      .prepare("SELECT name FROM sqlite_master WHERE name = 'user'")
      .first();
    expect(user).not.toBeNull();
  });

  it("applies only new migrations", async () => {
    const db = env.env.DB;
    await applyMigrations(db, [
      { name: "0001_a.sql", sql: "create table a (x);" },
    ]);
    expect(
      await applyMigrations(db, [
        { name: "0001_a.sql", sql: "create table a (x);" },
        { name: "0002_b.sql", sql: "create table b (x);" },
      ]),
    ).toEqual(["0002_b.sql"]);
  });

  it("leaves nothing half done when a migration fails", async () => {
    const db = env.env.DB;
    await expect(
      applyMigrations(db, [
        { name: "0001_bad.sql", sql: "create table c (x);\nnot sql;" },
      ]),
    ).rejects.toThrow();
    const c = await db
      .prepare("SELECT name FROM sqlite_master WHERE name = 'c'")
      .first();
    expect(c).toBeNull();
  });
});
