import { expect, type Page, test } from "@playwright/test";

import { findLink } from "./emails";
import { authFile } from "./servers";

// The library at /sheets.

function heading(page: Page) {
  return page.getByRole("heading", { level: 1 });
}

function importButton(page: Page) {
  return page.getByRole("button", { name: "Import from Ultimate Guitar" });
}

function passkeyOffer(page: Page) {
  return page.getByRole("region", { name: "Passkey" });
}

function importDialog(page: Page) {
  return page.getByRole("dialog", { name: "Import from Ultimate Guitar" });
}

async function pasteAndImport(page: Page, text: string) {
  await importButton(page).click();
  await importDialog(page).getByLabel("Chords and lyrics").fill(text);
  await importDialog(page)
    .getByRole("button", { name: "Import", exact: true })
    .click();
}

// Scenarios "Opening the email link", "First sign-in" and "Starting a
// sheet", and the passkey offer. A new account starts with no sheets, so this signs in by email
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
    const marked = new URL(body.callbackURL, "http://localhost");
    marked.searchParams.set("e2e", mark);
    await route.continue({
      postData: JSON.stringify({
        ...body,
        callbackURL: marked.pathname + marked.search,
      }),
    });
  });
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(`e2e-${mark}@example.com`);
  await page.getByRole("button", { name: "Send link" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();
  expect(callbackURL).toBe("/sheets?passkey");

  let link: string | undefined;
  await expect.poll(async () => (link = await findLink(mark))).toBeDefined();
  await page.goto(link ?? "");
  await expect(page).toHaveURL(/\/sheets\?/);
  await expect(page).toHaveTitle("Library | Sheet Library");
  await expect(heading(page)).toHaveText("Library");
  await expect(page.getByText("No sheets yet")).toBeVisible();
  await expect(importButton(page)).toBeVisible();

  // Scenarios "First email sign-in", "Opening the account page" and "Closed
  // before". A reload doesn't offer it again.
  await expect(passkeyOffer(page)).toContainText(
    "Add a passkey to sign in on this device without waiting for an email.",
  );
  await expect(page).not.toHaveURL(/passkey/);
  await page.reload();
  await expect(heading(page)).toHaveText("Library");
  await expect(passkeyOffer(page)).toHaveCount(0);
  await page.goto("/sheets?passkey");
  await passkeyOffer(page).getByRole("link", { name: "Add passkey" }).click();
  await expect(page).toHaveURL("/account");
  await page.goto("/sheets?passkey");
  await passkeyOffer(page).getByRole("button", { name: "Close" }).click();
  await expect(passkeyOffer(page)).toHaveCount(0);
  await page.goto("/sheets?passkey");
  await expect(heading(page)).toHaveText("Library");
  await expect(passkeyOffer(page)).toHaveCount(0);

  await page.getByRole("button", { name: "New sheet" }).click();
  await expect(page).toHaveURL(/\/sheets\/[\w-]{12}$/);
  await expect(page.getByLabel("Title")).toHaveValue("Untitled");

  await page.getByRole("banner").getByRole("link", { name: "Library" }).click();
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

test.describe("the import", () => {
  test.use({ storageState: authFile });

  const verse = ["[Verse 1]", "C     G", "Hello world"].join("\n");

  test.beforeEach(async ({ page }) => {
    await page.goto("/sheets");
  });

  // Scenario "Importing a song". On a phone, "Import" is docked beside
  // "New sheet" and keeps its text.
  test("creates a sheet and opens it, to be named", async ({ page }) => {
    await expect(
      importButton(page).getByText("Import", { exact: true }),
    ).toBeVisible();
    await pasteAndImport(page, verse);
    await expect(page).toHaveURL(/\/sheets\/[\w-]{12}$/);
    await expect(page.getByLabel("Title")).toBeFocused();
    await expect(page.getByLabel("Title")).toHaveValue("Untitled");
    await expect(page.locator(".section-label")).toHaveText(["Verse 1"]);
    await expect(page.locator(".ProseMirror .line")).toHaveText([
      "Hello world",
    ]);
    await expect(page.locator(".chord-label")).toHaveText(["C", "G"]);

    // It is stored: a reload shows it again.
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(heading(page)).toHaveText("Untitled");
    await expect(page.locator(".chord-label")).toHaveText(["C", "G"]);
  });

  // Scenario "Cancelling".
  test("cancels without a new sheet", async ({ page }) => {
    const posts: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") posts.push(request.url());
    });
    await importButton(page).click();
    await expect(importDialog(page)).not.toContainText("replaces");
    await importDialog(page).getByLabel("Chords and lyrics").fill(verse);
    await importDialog(page).getByRole("button", { name: "Cancel" }).click();
    await expect(importDialog(page)).toBeHidden();
    await expect(importButton(page)).toBeFocused();
    await expect(page).toHaveURL("/sheets");
    expect(posts).toEqual([]);
  });

  // Scenario "Too large".
  test("keeps the dialog open when the text is too long", async ({ page }) => {
    // About 50 KB of text, but a sheet of more than 256 KB: a chord costs
    // more in a sheet than in the text.
    const pair = `${"C ".repeat(40)}\n${"la".repeat(40)}`;
    const text = Array.from({ length: 300 }, () => pair).join("\n");
    await pasteAndImport(page, text);
    await expect(importDialog(page)).toContainText(
      "The text is too long to import.",
    );
    await expect(
      importDialog(page).getByLabel("Chords and lyrics"),
    ).toHaveValue(text);
    await expect(
      importDialog(page).getByRole("button", { name: "Import", exact: true }),
    ).toBeEnabled();
    await expect(page).toHaveURL("/sheets");
  });
});

test.describe("not signed in", () => {
  // Scenario "Not signed in".
  test("sends visitors to sign-in", async ({ page }) => {
    await page.goto("/sheets");
    await expect(page).toHaveURL("/sign-in");
  });
});
