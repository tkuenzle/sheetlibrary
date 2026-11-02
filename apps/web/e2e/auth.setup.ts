import { expect, test as setup } from "@playwright/test";

import { findLink } from "./emails";
import { authFile } from "./servers";

// Signs in once and keeps the session in authFile, for the tests that need
// an account. Sign-in emails are limited per visitor, also locally, so a
// session that still works is kept from the last run.

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
