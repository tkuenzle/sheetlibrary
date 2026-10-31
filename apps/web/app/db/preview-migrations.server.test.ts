import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { localEnv } from "./local-env.test-helper";
import { migrations } from "./migrations.server";
import {
  previewMigrations,
  previewMigrationsPath,
} from "./preview-migrations.server";

const post = () =>
  new Request(`https://example.com${previewMigrationsPath}`, {
    method: "POST",
  });

describe("previewMigrations", () => {
  let local: Awaited<ReturnType<typeof localEnv>>;
  beforeEach(async () => {
    local = await localEnv();
  });
  afterEach(() => local.dispose());

  it("is not there on production", async () => {
    const env = { ...local.env, PREVIEW_MIGRATIONS: undefined };
    const response = await previewMigrations(post(), env);
    expect(response.status).toBe(404);
  });

  it("applies the migrations on a preview, and nothing the second time", async () => {
    const env = { ...local.env, PREVIEW_MIGRATIONS: "on" as const };
    const first = await previewMigrations(post(), env);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({
      applied: migrations.map((migration) => migration.name),
    });
    const second = await previewMigrations(post(), env);
    expect(await second.json()).toEqual({ applied: [] });
  });
});
