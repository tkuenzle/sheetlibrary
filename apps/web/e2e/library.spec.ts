import { expect, type Page, test } from "@playwright/test";

import { findLink } from "./emails";
import { authFile } from "./servers";

// The library at /sheets.

function heading(page: Page) {
  return page.getByRole("heading", { level: 1 });
}

// Scenarios "Opening the email link", "First sign-in" and "Starting a
// sheet". A new account starts with no sheets, so this signs in by email
// itself. Sign-in emails are limited per visitor, so only on one project.
test("a new account signs in to an empty library and starts a sheet", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "One sign-in email per run");

  // The sign-in page asks for a link back to the library. A mark is added,
  // so the test can find the email.
  const mark = crypto.randomUUID();
  let callbackURL: string | undefined;
  await page.route("**/api/auth/sign-in/magic-link", async (route) => {
    const body = route.request().postDataJSON() as { callbackURL: string };
    callbackURL = body.callbackURL;
    await route.continue({
      postData: JSON.stringify({
        ...body,
        callbackURL: `${body.callbackURL}?e2e=${mark}`,
      }),
    });
  });
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(`e2e-${mark}@example.com`);
  await page.getByRole("button", { name: "Send link" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();
  expect(callbackURL).toBe("/sheets");

  let link: string | undefined;
  await expect.poll(async () => (link = await findLink(mark))).toBeDefined();
  await page.goto(link ?? "");
  await expect(page).toHaveURL(/\/sheets\?/);
  await expect(page).toHaveTitle("Library | Sheet Library");
  await expect(heading(page)).toHaveText("Library");
  await expect(page.getByText("No sheets yet")).toBeVisible();

  await page.getByRole("button", { name: "New sheet" }).click();
  await expect(page).toHaveURL(/\/sheets\/[\w-]{12}$/);
  await expect(page.getByLabel("Title")).toHaveValue("Untitled");

  await page
    .getByRole("banner")
    .getByRole("link", { name: "Sheet Library" })
    .click();
  await expect(page).toHaveURL("/sheets");
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("listitem")).toContainText("Untitled");
  await expect(page.getByRole("listitem")).toContainText("Today");
});

test.describe("signed in", () => {
  test.use({ storageState: authFile });

  // Scenario "Signed in" (home page).
  test("the home page opens the library", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/sheets");
    await expect(heading(page)).toHaveText("Library");
  });

  // On a phone, the button is docked at the bottom right.
  test("starts a sheet from the list", async ({ page }, testInfo) => {
    await page.request.post("/api/sheets", {
      data: {
        title: "Amazing Grace",
        content: { format: "chordsheet", version: 1, sections: [] },
      },
    });
    await page.goto("/sheets");
    // Other tests add sheets to this account too, so only its presence is
    // checked, not its place.
    await expect(
      page.getByRole("link", { name: /Amazing Grace/ }).first(),
    ).toBeVisible();
    const button = page.getByRole("button", { name: "New sheet" });
    if (testInfo.project.name === "phone") {
      const box = await button.boundingBox();
      const viewport = page.viewportSize();
      expect(box && viewport).toBeTruthy();
      if (box && viewport) {
        expect(box.x + box.width).toBeGreaterThan(viewport.width - 32);
        expect(box.y + box.height).toBeGreaterThan(viewport.height - 48);
      }
    }
    await button.click();

    // Scenario "Naming a new sheet": the title field is open, with
    // "Untitled" selected, so typing replaces it.
    const title = `Sheet ${crypto.randomUUID().slice(0, 8)}`;
    await expect(page.getByLabel("Title")).toBeFocused();
    await page.keyboard.type(title);
    await page.keyboard.press("Enter");
    await expect(heading(page)).toHaveText(title);
    await expect(page).toHaveURL(/\/sheets\/[\w-]{12}$/);

    // A reload doesn't open the field again.
    await expect(page.getByRole("status")).toHaveText("Saved");
    await page.reload();
    await expect(heading(page)).toHaveText(title);
    await expect(page.getByLabel("Title")).toHaveCount(0);
  });
});

test.describe("not signed in", () => {
  // Scenario "Not signed in".
  test("sends visitors to sign-in", async ({ page }) => {
    await page.goto("/sheets");
    await expect(page).toHaveURL("/sign-in");
  });
});
