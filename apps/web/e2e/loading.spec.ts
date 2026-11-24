import { type Page } from "@playwright/test";

import {
  addToCollection,
  createCollection,
  createSheet,
  delay,
  expect,
  newMark,
  test,
} from "./fixtures";

// Skeletons: a page waits a moment for its data. When the data is slower,
// the page moves in with bars where its data will be, and the data fills in
// once it is there and the move has ended. The tests hold a page's data back
// to see the skeleton. See openspec/specs/site-layout ("A skeleton while a
// page loads", "Bars never blink"). The tests
// share one account, so every name carries a mark of its own.

test.use({ signedIn: true });

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// A collection holding a sheet for each of `titles`.
async function collectionWith(page: Page, name: string, titles: string[]) {
  const id = await createCollection(page, name);
  for (const title of titles) {
    await addToCollection(page, await createSheet(page, { title }), id);
  }
  return id;
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
test("shows a slow collection with its name, count and bars", async ({
  page,
}) => {
  const mark = newMark();
  const name = `Slow ${mark}`;
  await collectionWith(page, name, [
    `One ${mark}`,
    `Two ${mark}`,
    `Three ${mark}`,
  ]);
  await startOnCollections(page);
  await delay(page, collectionData, 2000);
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
  await collectionWith(page, first, [`Only in first ${mark}`]);
  await collectionWith(page, second, [`Only in second ${mark}`]);
  await startOnCollections(page);
  await openCollection(page, first);
  await expect(rows(page)).toHaveCount(1);
  await delay(page, collectionData, 1500);
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
  const id = await collectionWith(page, name, []);
  await startOnCollections(page);
  const response = await page.request.delete(`/api/collections/${id}`);
  expect(response.ok()).toBe(true);
  await openCollection(page, name);
  await expect(heading(page)).toHaveText("Collection not found");
  await expect(mainNav(page)).toBeVisible();
});

const sheetsData = /\/sheets\.data/;

// Scenario "A slow collection", for Sheets.
test("shows slow Sheets with bars for Recent and the list", async ({
  page,
}) => {
  const mark = newMark();
  await createSheet(page, { title: `Slow ${mark}` });
  await page.goto("/collections");
  await page.waitForLoadState("networkidle");
  await delay(page, sheetsData, 2000);
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

// Scenario "Cards of one height" (library-page): a card is as tall with an
// artist, a key and a long title as without, and so are its bars. So the
// cards take the bars' place without the list below moving.
test("gives Recent's cards and their bars one height", async ({ page }) => {
  const mark = newMark();
  const opened = [
    await createSheet(page, {
      title: `A title long enough to take a second line ${mark}`,
      artist: "Someone",
      content: {
        format: "chordsheet",
        version: 1,
        sections: [
          {
            label: "Verse",
            lines: [{ text: "Amazing grace", chords: [{ at: 0, root: "G" }] }],
          },
        ],
      },
    }),
    await createSheet(page, { title: `Hi ${mark}` }),
  ];
  for (const id of opened) {
    await page.goto(`/sheets/${id}`);
    await expect(heading(page)).toContainText(mark);
  }
  await page.goto("/sheets");
  const cards = page.locator("main .recent-sheets a");
  await expect(cards.filter({ hasText: mark })).toHaveCount(2);
  const heights = await cards.evaluateAll((all) =>
    all.map((card) => Math.round(card.getBoundingClientRect().height)),
  );
  expect(new Set(heights).size).toBe(1);

  await page.goto("/collections");
  await page.waitForLoadState("networkidle");
  await delay(page, sheetsData, 2000);
  await mainNav(page)
    .getByRole("link", { name: "Sheets", exact: true })
    .click();
  const bars = page.locator("main .recent-sheets-skeleton");
  await expect(bars).toHaveCount(4);
  const barHeights = await bars.evaluateAll((all) =>
    all.map((card) => Math.round(card.getBoundingClientRect().height)),
  );
  expect(barHeights).toEqual(barHeights.map(() => heights[0]));
});

// Scenario "After deleting from a row".
test("keeps the other rows while the list loads again after a delete", async ({
  page,
}) => {
  const mark = newMark();
  await createSheet(page, { title: `Keep ${mark}` });
  await createSheet(page, { title: `Delete ${mark}` });
  await page.goto(`/sheets?q=${mark}`);
  await expect(rows(page)).toHaveCount(2);
  await delay(page, sheetsData, 1500);
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
  await createSheet(page, { title: `Typed ${mark}` });
  await page.goto("/collections");
  await page.waitForLoadState("networkidle");
  await delay(page, sheetsData, 1500);
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
  await createSheet(page, { title: `Whole ${newMark()}` });
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
test("shows a slow account page with bars for its data", async ({ page }) => {
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  await delay(page, /\/account\.data/, 1500);
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

// Notes when Choose collections' bars show and go, from the next page
// load on: shown means in the list's room and no longer unseen.
async function recordDialogBars(page: Page) {
  await page.addInitScript(() => {
    const log: { shown?: number; gone?: number } = {};
    (window as unknown as { barsLog: typeof log }).barsLog = log;
    new MutationObserver(() => {
      const shown = !!document.querySelector(
        ".choose-collections-scroll:not(.skeleton-waiting) .choose-collections-skeleton",
      );
      if (shown && log.shown === undefined) log.shown = performance.now();
      if (!shown && log.shown !== undefined && log.gone === undefined) {
        log.gone = performance.now();
      }
    }).observe(document, { subtree: true, childList: true, attributes: true });
  });
}

const barsLog = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { barsLog: { shown?: number; gone?: number } })
        .barsLog,
  );

async function openChooseCollections(page: Page, ms: number) {
  const mark = newMark();
  const title = `Chosen ${mark}`;
  await createCollection(page, `Pick ${mark}`);
  await createSheet(page, { title });
  await recordDialogBars(page);
  await page.goto(`/sheets?q=${mark}`);
  await expect(rows(page)).toHaveCount(1);
  await page.route(/\/api\/sheets\/[^/]+\/collections$/, async (route) => {
    await wait(ms);
    await route.continue();
  });
  await page.getByRole("button", { name: `More for ${title}` }).click();
  await page.getByRole("menuitem", { name: "Choose collections…" }).click();
  const list = page.getByRole("dialog").locator("fieldset");
  await expect(list.getByRole("checkbox").first()).toBeVisible();
  return list;
}

// Scenario "A quick list": no bars for a moment's wait.
test("shows no bars when the collections come quickly", async ({ page }) => {
  await openChooseCollections(page, 50);
  await wait(500);
  expect((await barsLog(page)).shown).toBeUndefined();
});

// Scenario "Choose collections": slow, the bars show, and once shown they
// stay for a moment, also when the list comes just after.
test("keeps the bars a moment once they show", async ({ page }) => {
  await openChooseCollections(page, 300);
  await expect.poll(async () => (await barsLog(page)).gone).toBeDefined();
  const log = await barsLog(page);
  expect(log.shown).toBeDefined();
  expect((log.gone ?? 0) - (log.shown ?? 0)).toBeGreaterThanOrEqual(390);
});

// Notes when a page's bars show and when they go, from the next page load
// on.
async function recordPageBars(page: Page) {
  await page.addInitScript(() => {
    const log: { shown?: number; gone?: number } = {};
    (window as unknown as { pageBarsLog: typeof log }).pageBarsLog = log;
    new MutationObserver(() => {
      const shown = !!document.querySelector("main .sheet-list-skeleton");
      if (shown && log.shown === undefined) log.shown = performance.now();
      if (!shown && log.shown !== undefined && log.gone === undefined) {
        log.gone = performance.now();
      }
    }).observe(document, { subtree: true, childList: true });
  });
}

const pageBarsLog = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { pageBarsLog: { shown?: number; gone?: number } })
        .pageBarsLog,
  );

// Opens a collection whose sheets are held back `ms`, and gives how long its
// bars showed, or undefined when they didn't.
async function openHeldBack(page: Page, ms: number) {
  const mark = newMark();
  const name = `Held ${mark}`;
  await collectionWith(page, name, [`One ${mark}`]);
  await recordPageBars(page);
  await startOnCollections(page);
  await delay(page, collectionData, ms);
  await openCollection(page, name);
  await expect(rows(page)).toHaveCount(1);
  await wait(500);
  const log = await pageBarsLog(page);
  if (log.shown === undefined) return undefined;
  expect(log.gone).toBeDefined();
  return (log.gone ?? 0) - log.shown;
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  const how = reducedMotion === "reduce" ? "without a move" : "with a move";

  // Scenarios "A quick collection" and "A quick page without a move": a
  // page whose data comes in a moment moves in whole.
  test(`shows no bars for a quick page ${how}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    expect(await openHeldBack(page, 50)).toBeUndefined();
  });

  // Scenario "Data just after the wait": the bars show, and stay a moment
  // though the data comes soon after.
  test(`keeps a page's bars a moment ${how}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    expect(await openHeldBack(page, 200)).toBeGreaterThanOrEqual(390);
  });
}

// Scenario "A slow page without a move".
test("keeps a slow page's bars until its data is there", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await openHeldBack(page, 700)).toBeGreaterThanOrEqual(390);
});
