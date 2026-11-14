import { expect, type Page, test } from "@playwright/test";

import { authFile } from "./servers";

// The loading bar, errors inside the frame, a search that doesn't go
// through, and an address that leads nowhere. See openspec/specs/site-layout
// and library-search. The tests share one account, so every name carries a
// mark of its own.

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// A word no other sheet or collection holds: letters only, so it is one
// word for the search.
function newMark(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(10)), (n) =>
    String.fromCharCode(97 + (n % 26)),
  ).join("");
}

async function createSheet(page: Page, title: string) {
  const response = await page.request.post("/api/sheets", {
    data: {
      title,
      content: { format: "chordsheet", version: 1, sections: [] },
    },
  });
  expect(response.status()).toBe(201);
}

async function createCollection(page: Page, name: string) {
  const response = await page.request.post("/api/collections", {
    data: { name },
  });
  expect(response.status()).toBe(201);
}

const heading = (page: Page) => page.getByRole("heading", { level: 1 });
const mainNav = (page: Page) => page.getByRole("navigation", { name: "Main" });
const bar = (page: Page) => page.locator(".loading-bar");
const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

// The rail lists the collections. On a phone, the Collections screen does.
const collectionLink = (page: Page, name: string) =>
  (wide(page) ? mainNav(page) : page.getByRole("main")).getByRole("link", {
    name: new RegExp(name),
  });

test.describe("signed in", () => {
  test.use({ storageState: authFile });

  // Scenario "A slow move". Collections has no data of its own, so the
  // move is to a collection, which loads its sheets.
  test("shows the bar while a page is slow to load", async ({ page }) => {
    const name = `Slow ${newMark()}`;
    await createCollection(page, name);
    await page.goto(wide(page) ? "/sheets" : "/collections");
    await page.waitForLoadState("networkidle");
    await page.route(/\/collections\/[^/]+\.data/, async (route) => {
      await wait(1500);
      await route.continue();
    });
    await collectionLink(page, name).click();
    await expect(bar(page)).toBeVisible();
    expect((await bar(page).boundingBox())?.y).toBe(0);
    await expect(heading(page)).toHaveText(name);
    await expect(bar(page)).toHaveCount(0);
  });

  // Scenario "A slow search".
  test("keeps the bar away during a slow search", async ({ page }) => {
    const mark = newMark();
    await createSheet(page, `Amazing ${mark}`);
    await page.goto("/sheets");
    await page.route(/\/sheets\.data\?/, async (route) => {
      await wait(1500);
      await route.continue();
    });
    await page.getByRole("searchbox", { name: "Search sheets" }).fill(mark);
    const status = page.getByRole("search").getByRole("status");
    await expect(status).toHaveText("Searching…");
    await expect(bar(page)).toHaveCount(0);
    await expect(status).toHaveText("1 sheet");
  });

  // Scenarios "Offline in the shell" and "Back online".
  test("shows the note inside the shell offline, and loads the page again", async ({
    page,
    context,
  }) => {
    const name = `Offline ${newMark()}`;
    await createCollection(page, name);
    // A page whose code never loaded can't be opened offline: React Router
    // reloads the whole page. So the collection's page is opened once first,
    // as someone using the app would have. #141 is to drop this step.
    await page.goto(wide(page) ? "/sheets" : "/collections");
    const link = collectionLink(page, name);
    await link.click();
    await expect(heading(page)).toHaveText(name);
    await page.goBack();
    await expect(link).toBeVisible();

    await context.setOffline(true);
    await link.click();
    await expect(heading(page)).toHaveText("Can’t reach Sheet Library");
    await expect(heading(page)).toBeFocused();
    await expect(
      page.getByText("Check your connection and try again."),
    ).toBeVisible();
    await expect(mainNav(page)).toBeVisible();
    const marked = wide(page)
      ? mainNav(page).getByRole("link", { name: new RegExp(name) })
      : mainNav(page).getByRole("link", { name: "Collections", exact: true });
    await expect(marked).toHaveAttribute("aria-current", /page|true/);

    await context.setOffline(false);
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(heading(page)).toHaveText(name);
  });

  // Scenarios "Offline while typing" and "Back online" (library-search).
  test("keeps the last results when a search doesn't go through", async ({
    page,
    context,
  }) => {
    const mark = newMark();
    await createSheet(page, `Amazing ${mark}`);
    await page.goto("/sheets");
    const field = page.getByRole("searchbox", { name: "Search sheets" });
    await field.fill(mark);
    await expect(page).toHaveURL(`/sheets?q=${mark}`);
    const rows = page.getByRole("main").getByRole("listitem");
    await expect(rows).toHaveCount(1);

    await context.setOffline(true);
    await field.pressSequentially("x");
    const note = page.getByText("Couldn’t search. Showing the last results.");
    await expect(note).toBeVisible();
    await expect(field).toHaveValue(`${mark}x`);
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText(`Amazing ${mark}`);

    await context.setOffline(false);
    await field.pressSequentially("y");
    await expect(
      page.getByRole("heading", { name: `No sheets match “${mark}xy”` }),
    ).toBeVisible();
    await expect(note).toHaveCount(0);
  });

  // Scenario "A mistyped address".
  test("says an address leads nowhere, and goes to the sheets", async ({
    page,
  }) => {
    const response = await page.goto("/shets");
    expect(response?.status()).toBe(404);
    await expect(heading(page)).toHaveText("Page not found");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex",
    );
    await page.getByRole("link", { name: "Go to your sheets" }).click();
    await expect(page).toHaveURL("/sheets");
  });
});

// Scenario "Signed out".
test("leads a visitor from an unknown address to the home page", async ({
  page,
}) => {
  const response = await page.goto("/shets");
  expect(response?.status()).toBe(404);
  await page.getByRole("link", { name: "Go to the home page" }).click();
  await expect(page).toHaveURL("/");
});
