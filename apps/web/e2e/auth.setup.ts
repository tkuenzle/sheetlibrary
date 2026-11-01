import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, test as setup } from "@playwright/test";

import { authFile } from "./servers";

// Signs in once and keeps the session in authFile, for the tests that need
// an account. Sign-in emails are limited per visitor, also locally, so a
// session that still works is kept from the last run.

// Where local wrangler writes the text of each email it would send.
const emails = join(import.meta.dirname, "../.wrangler/tmp/email");

setup("sign in", async ({ browser, page, baseURL }) => {
  const saved = await browser
    .newContext({ storageState: authFile })
    .catch(() => null);
  if (saved) {
    const session: unknown = await (
      await saved.request.get("/api/auth/get-session")
    ).json();
    await saved.close();
    if (session) return;
  }

  // The email's text doesn't name its recipient, so the link is found by a
  // mark in its callback URL.
  const mark = crypto.randomUUID();
  // Better Auth refuses a request without an origin, which the browser
  // would send.
  const response = await page.request.post("/api/auth/sign-in/magic-link", {
    headers: { Origin: baseURL ?? "" },
    data: {
      email: `e2e-${mark}@example.com`,
      callbackURL: `/account?e2e=${mark}`,
    },
  });
  expect(response.ok()).toBe(true);
  let link: string | undefined;
  await expect.poll(async () => (link = await findLink(mark))).toBeDefined();
  await page.goto(link ?? "");
  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
  await page.context().storageState({ path: authFile });
});

async function findLink(mark: string): Promise<string | undefined> {
  const files = await readdir(emails, { recursive: true }).catch(() => []);
  for (const file of files.filter((name) => name.endsWith(".txt"))) {
    const text = await readFile(join(emails, file), "utf8");
    if (text.includes(mark)) return /https?:\/\/\S+/.exec(text)?.[0];
  }
  return undefined;
}
