import { expect, type Page, test } from "@playwright/test";

import { authFile } from "./servers";

// Skeletons: a page moves in right after the tap, with bars where its data
// will be, and the data fills in once it is there and the move has ended.
// The tests hold a page's data back to see the skeleton. See
// openspec/specs/site-layout ("A skeleton while a page loads"). The tests
// share one account, so every name carries a mark of its own.

test.use({ storageState: authFile });

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function newMark(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(10)), (n) =>
    String.fromCharCode(97 + (n % 26)),
  ).join("");
}

async function create(page: Page, url: string, data: object): Promise<string> {
  const response = await page.request.post(url, { data });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

const content = { format: "chordsheet", version: 1, sections: [] };

// A collection holding a sheet for each of `titles`.
async function createCollection(page: Page, name: string, titles: string[]) {
  const id = await create(page, "/api/collections", { name });
  for (const title of titles) {
    const sheet = await create(page, "/api/sheets", { title, content });
    const response = await page.request.put(
      `/api/sheets/${sheet}/collections/${id}`,
    );
    expect(response.ok()).toBe(true);
  }
  return id;
}

// Holds back the data of the pages whose path matches.
async function holdBack(page: Page, path: RegExp, ms: number) {
  await page.route(path, async (route) => {
    await wait(ms);
    await route.continue();
  });
}

const collectionData = /\/collections\/[^/]+\.data/;
const heading = (page: Page) => page.getByRole("heading", { level: 1 });
const mainNav = (page: Page) => page.getByRole("navigation", { name: "Main" });
const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;
const bars = (page: Page) => page.locator("main .sheet-list-skeleton");
const rows = (page: Page) => page.locator("main .sheet-list-row > a");

// The rail lists the collections. On a phone, the Collections screen does.
async function openCollection(page: Page, name: string) {
  await (wide(page) ? mainNav(page) : page.getByRole("main"))
    .getByRole("link", { name: new RegExp(name) })
    .click();
}

async function startOnCollections(page: Page) {
  await page.goto(wide(page) ? "/sheets" : "/collections");
  await page.waitForLoadState("networkidle");
}

// Notes whether a skeleton showed, from the next page load on.
async function recordSkeleton(page: Page) {
  await page.addInitScript(() => {
    const log: { seen?: boolean } = {};
    (window as unknown as { skeletonLog: typeof log }).skeletonLog = log;
    new MutationObserver(() => {
      if (document.querySelector(".sheet-list-skeleton")) log.seen = true;
    }).observe(document, { subtree: true, childList: true });
  });
}

// Scenarios "A slow collection" and "A collection's count".
test("shows a slow collection at once, with its name, count and bars", async ({
  page,
}) => {
  const mark = newMark();
  const name = `Slow ${mark}`;
  await createCollection(page, name, [
    `One ${mark}`,
    `Two ${mark}`,
    `Three ${mark}`,
  ]);
  await startOnCollections(page);
  await holdBack(page, collectionData, 2000);
  await openCollection(page, name);
  await expect(heading(page)).toHaveText(name);
  await expect(page.locator(".collection-title p")).toHaveText("3 sheets");
  await expect(bars(page)).toHaveCount(3);
  await expect(page.locator(".loading-bar")).toHaveCount(0);
  await expect(rows(page)).toHaveCount(3);
  await expect(bars(page)).toHaveCount(0);
  await expect(heading(page)).toBeFocused();
});

// Scenario "Another collection".
test("never shows the last collection's sheets under another's name", async ({
  page,
}) => {
  test.skip(!wide(page), "The rail lists the collections");
  const mark = newMark();
  const first = `First ${mark}`;
  const second = `Second ${mark}`;
  await createCollection(page, first, [`Only in first ${mark}`]);
  await createCollection(page, second, [`Only in second ${mark}`]);
  await startOnCollections(page);
  await openCollection(page, first);
  await expect(rows(page)).toHaveCount(1);
  await holdBack(page, collectionData, 1500);
  await openCollection(page, second);
  await expect(heading(page)).toHaveText(second);
  await expect(bars(page)).toHaveCount(1);
  await expect(
    rows(page).filter({ hasText: `Only in first ${mark}` }),
  ).toHaveCount(0);
  await expect(
    rows(page).filter({ hasText: `Only in second ${mark}` }),
  ).toHaveCount(1);
});

// A collection deleted elsewhere, still in the rail: "not found" in place.
test("says a collection that is gone isn't found", async ({ page }) => {
  const mark = newMark();
  const name = `Gone ${mark}`;
  const id = await createCollection(page, name, []);
  await startOnCollections(page);
  const response = await page.request.delete(`/api/collections/${id}`);
  expect(response.ok()).toBe(true);
  await openCollection(page, name);
  await expect(heading(page)).toHaveText("Collection not found");
  await expect(mainNav(page)).toBeVisible();
});

const sheetsData = /\/sheets\.data/;

// Scenario "A slow collection", for Sheets.
test("shows Sheets at once, with bars for Recent and the list", async ({
  page,
}) => {
  const mark = newMark();
  await create(page, "/api/sheets", { title: `Slow ${mark}`, content });
  await page.goto("/collections");
  await page.waitForLoadState("networkidle");
  await holdBack(page, sheetsData, 2000);
  await mainNav(page)
    .getByRole("link", { name: "Sheets", exact: true })
    .click();
  await expect(heading(page)).toHaveText("Sheets");
  await expect(page.locator("main .recent-sheets-skeleton")).toHaveCount(4);
  await expect(bars(page)).toHaveCount(8);
  await expect(page.locator(".loading-bar")).toHaveCount(0);
  await expect(rows(page).filter({ hasText: `Slow ${mark}` })).toHaveCount(1);
  await expect(bars(page)).toHaveCount(0);
  await expect(heading(page)).toBeFocused();
});

// Scenario "After deleting from a row".
test("keeps the other rows while the list loads again after a delete", async ({
  page,
}) => {
  const mark = newMark();
  await create(page, "/api/sheets", { title: `Keep ${mark}`, content });
  await create(page, "/api/sheets", { title: `Delete ${mark}`, content });
  await page.goto(`/sheets?q=${mark}`);
  await expect(rows(page)).toHaveCount(2);
  await holdBack(page, sheetsData, 1500);
  await page.getByRole("button", { name: `More for Delete ${mark}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(bars(page)).toHaveCount(0);
  await wait(1600);
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page)).toHaveText(new RegExp(`Keep ${mark}`));
});

// Typing in the skeleton's search field goes on in the page's own.
test("keeps what was typed while Sheets loads", async ({ page }) => {
  const mark = newMark();
  await create(page, "/api/sheets", { title: `Typed ${mark}`, content });
  await page.goto("/collections");
  await page.waitForLoadState("networkidle");
  await holdBack(page, sheetsData, 1500);
  await mainNav(page)
    .getByRole("link", { name: "Sheets", exact: true })
    .click();
  await expect(bars(page)).toHaveCount(8);
  const field = page.getByRole("searchbox", { name: "Search sheets" });
  await field.pressSequentially(mark.slice(0, 4));
  await expect(rows(page).first()).toBeVisible();
  await expect(field).toBeFocused();
  await field.pressSequentially(mark.slice(4));
  await expect(field).toHaveValue(mark);
  await expect(rows(page)).toHaveText([new RegExp(`Typed ${mark}`)]);
});

// Scenario "A first load". The shared account holds many sheets, so Sheets
// is long: React's server would send a long list apart, after its
// skeleton, if it sat in a <Suspense>.
test("loads a page whole the first time, without bars", async ({ page }) => {
  await create(page, "/api/sheets", { title: `Whole ${newMark()}`, content });
  await recordSkeleton(page);
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  await expect(rows(page).first()).toBeVisible();
  const seen = await page.evaluate(
    () =>
      (window as unknown as { skeletonLog: { seen?: boolean } }).skeletonLog
        .seen,
  );
  expect(seen).toBeUndefined();
});

// The account page: bars for the email and the passkeys, which follow.
test("shows the account page at once, with bars for its data", async ({
  page,
}) => {
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  await holdBack(page, /\/account\.data/, 1500);
  await page.getByRole("link", { name: "Account" }).first().click();
  await expect(heading(page)).toHaveText("Account");
  await expect(page.locator(".account-email .skeleton-bar")).toBeVisible();
  await expect(page.locator(".account-passkey-name .skeleton-bar")).toHaveCount(
    2,
  );
  await expect(page.locator(".account-email")).toHaveText(/@example\.com$/);
  await expect(page.locator("main .skeleton-bar")).toHaveCount(0);
  await expect(heading(page)).toBeFocused();
});
