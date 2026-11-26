import { type Page } from "@playwright/test";

import {
  addToCollection,
  answerAtOnce,
  createCollection,
  createSheet,
  delay,
  expect,
  hold,
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
// Scenario "The account's passkeys": a row of bars for each passkey, and
// the real rows take their place at the same height, fading in with the
// email ("Data fades in where the bars were"). The account gets a passkey
// first, from a virtual authenticator. Accounts are shared, so the skeleton
// is held against the real rows.
test("shows a slow account page with bars for its data", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    },
  });
  await recordArrivals(page);
  await page.goto("/account");
  const passkeys = page.locator(".account-passkey-name");
  const before = await passkeys.count();
  await page.getByRole("button", { name: "Add passkey" }).click();
  await expect(passkeys).toHaveCount(before + 1);

  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  await delay(page, /\/account\.data/, 1500);
  await page.getByRole("link", { name: "Account" }).first().click();
  await expect(heading(page)).toHaveText("Account");
  await expect(page.locator(".account-email .skeleton-bar")).toBeVisible();
  await expect(page.locator(".account-passkey-name .skeleton-bar")).toHaveCount(
    before + 1,
  );
  const group = page
    .getByRole("region", { name: "Passkeys" })
    .locator(".group-list");
  const waiting = await group.boundingBox();
  await expect(page.locator(".account-email")).toHaveText(/@example\.com$/);
  await expect(page.locator("main .skeleton-bar")).toHaveCount(0);
  await expect(passkeys).toHaveCount(before + 1);
  expect((await group.boundingBox())?.height).toBeCloseTo(
    waiting?.height ?? 0,
    0,
  );
  await expect(heading(page)).toBeFocused();
  await expect
    .poll(
      async () =>
        (await arrivals(page)).filter((arrival) =>
          arrival.classes.includes("account-passkey"),
        ).length,
    )
    .toBe(before + 1);
  expect(
    (await arrivals(page)).some((arrival) =>
      arrival.classes.includes("account-email"),
    ),
  ).toBe(true);
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

// Empties a log of when bars showed and went, kept on the window.
async function clearLog(page: Page, name: "barsLog" | "pageBarsLog") {
  await page.evaluate((name) => {
    const log = (
      window as unknown as Record<
        "barsLog" | "pageBarsLog",
        { shown?: number; gone?: number }
      >
    )[name];
    delete log.shown;
    delete log.gone;
  }, name);
}

const chooseData = /\/api\/sheets\/[^/]+\/collections\.data(\?|$)/;

// A sheet on Sheets with a collection to choose, and a way to open Choose
// collections from its row.
async function chooseFromRow(page: Page) {
  const mark = newMark();
  const title = `Chosen ${mark}`;
  await createCollection(page, `Pick ${mark}`);
  await createSheet(page, { title });
  await recordDialogBars(page);
  await page.goto(`/sheets?q=${mark}`);
  await expect(rows(page)).toHaveCount(1);
  const dialog = page.getByRole("dialog");
  const list = dialog.locator("fieldset");
  const pick = async () => {
    await page.getByRole("button", { name: `More for ${title}` }).click();
    await page.getByRole("menuitem", { name: "Choose collections…" }).click();
  };
  return { dialog, list, pick };
}

// Opens Choose collections once, closes it, and opens it again with the
// list answered from memory, so it comes at once. `beforeAgain` runs just
// before the second opening.
async function openChooseCollectionsAgain(
  page: Page,
  beforeAgain: () => Promise<void> = () => Promise.resolve(),
) {
  const { dialog, list, pick } = await chooseFromRow(page);
  const open = async () => {
    await pick();
    await expect(list.getByRole("checkbox").first()).toBeVisible();
  };
  const answers = await answerAtOnce(page, chooseData);
  await open();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
  await clearLog(page, "barsLog");
  await beforeAgain();
  await open();
  expect(answers.fromMemory()).toBeGreaterThanOrEqual(1);
}

// Scenario "A quick list": no bars for a moment's wait.
test(
  "shows no bars when the collections come quickly",
  { tag: "@timing" },
  async ({ page }) => {
    await openChooseCollectionsAgain(page);
    await wait(500);
    expect((await barsLog(page)).shown).toBeUndefined();
  },
);

// Scenario "Choose collections": slow, the bars show, and once shown they
// stay for a moment, also when the list comes just after. The list starts
// loading when the row's menu opens, so it is held until the bars show.
test("keeps the bars a moment once they show", async ({ page }) => {
  const held = await hold(page, chooseData);
  const { list, pick } = await chooseFromRow(page);
  await pick();
  await expect.poll(async () => (await barsLog(page)).shown).toBeDefined();
  held.release();
  await expect(list.getByRole("checkbox").first()).toBeVisible();
  const log = await barsLog(page);
  expect((log.gone ?? 0) - (log.shown ?? 0)).toBeGreaterThanOrEqual(390);
});

// The bars go once the list is there, also when they have shown longer
// than they are held.
test("takes the bars away when the list comes long after", async ({ page }) => {
  const held = await hold(page, chooseData);
  const { list, pick } = await chooseFromRow(page);
  await pick();
  await expect.poll(async () => (await barsLog(page)).shown).toBeDefined();
  await wait(600);
  held.release();
  await expect(list.getByRole("checkbox").first()).toBeVisible();
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
// bars showed, or undefined when they didn't. Or, "from memory": opens it
// once, leaves it through the navigation, and opens it again with its sheets
// answered from memory, so they come at once.
async function openHeldBack(page: Page, ms: number | "from memory") {
  const mark = newMark();
  const name = `Held ${mark}`;
  await collectionWith(page, name, [`One ${mark}`]);
  await recordPageBars(page);
  await startOnCollections(page);
  if (ms === "from memory") {
    const answers = await answerAtOnce(page, collectionData);
    await openCollection(page, name);
    await expect(heading(page)).toHaveText(name);
    await expect(rows(page)).toHaveCount(1);
    // A link, not a step back, so the second opening loads its page again.
    const away = wide(page) ? "Sheets" : "Collections";
    await page.getByRole("link", { name: away, exact: true }).first().click();
    await expect(heading(page)).toHaveText(away);
    await clearLog(page, "pageBarsLog");
    await openCollection(page, name);
    await expect(heading(page)).toHaveText(name);
    await expect(rows(page)).toHaveCount(1);
    expect(answers.fromMemory()).toBeGreaterThanOrEqual(1);
  } else {
    await delay(page, collectionData, ms);
    await openCollection(page, name);
    await expect(rows(page)).toHaveCount(1);
  }
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
  test(
    `shows no bars for a quick page ${how}`,
    { tag: "@timing" },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      expect(await openHeldBack(page, "from memory")).toBeUndefined();
    },
  );

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

// Fades: what takes the bars' place fades in once, and what showed for
// real stays as it is. See openspec/specs/site-layout ("Data fades in where
// the bars were") and ui/arriving.tsx.

interface Arrival {
  tag: string;
  classes: string;
  text: string;
  // In milliseconds.
  duration: number;
  easing: string;
  inRecent: boolean;
  inSearch: boolean;
  // The classes of its first child, for a wrapper.
  child: string;
}

// Records each fade of data in place of bars, from the next page load on.
async function recordArrivals(page: Page) {
  await page.addInitScript(() => {
    const log: Record<string, unknown>[] = [];
    (window as unknown as { arrivals: unknown }).arrivals = log;
    document.addEventListener(
      "animationstart",
      (event) => {
        if (event.animationName !== "arrive") return;
        const target = event.target as HTMLElement;
        log.push({
          tag: target.tagName.toLowerCase(),
          classes: target.getAttribute("class") ?? "",
          text: target.textContent.trim().slice(0, 60),
          duration:
            Number.parseFloat(getComputedStyle(target).animationDuration) *
            1000,
          easing: getComputedStyle(target).animationTimingFunction,
          inRecent: !!target.closest(".recent-sheets"),
          inSearch: !!target.closest("[role=search]"),
          child: target.firstElementChild?.getAttribute("class") ?? "",
        });
      },
      true,
    );
  });
}

const arrivals = (page: Page) =>
  page.evaluate(() => (window as unknown as { arrivals: Arrival[] }).arrivals);

async function clearArrivals(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { arrivals: Arrival[] }).arrivals.length = 0;
  });
}

const isRow = (arrival: Arrival) =>
  arrival.classes.split(" ").includes("sheet-list-row");

// Scenario "A slow collection", for Sheets, and "A search after the fade".
test("fades Sheets' rows and Recent's cards in where the bars were", async ({
  page,
}) => {
  const mark = newMark();
  const id = await createSheet(page, { title: `Faded ${mark}` });
  await recordArrivals(page);
  // Opened once, so that Recent has a card.
  await page.goto(`/sheets/${id}`);
  await expect(heading(page)).toHaveText(`Faded ${mark}`);
  await page.goto("/collections");
  await page.waitForLoadState("networkidle");
  await delay(page, sheetsData, 1500);
  await mainNav(page)
    .getByRole("link", { name: "Sheets", exact: true })
    .click();
  await expect(bars(page)).toHaveCount(8);
  await expect(rows(page).filter({ hasText: `Faded ${mark}` })).toHaveCount(1);
  await expect.poll(async () => (await arrivals(page)).some(isRow)).toBe(true);
  const faded = await arrivals(page);
  expect(faded.some((arrival) => arrival.inRecent)).toBe(true);
  expect(faded.some((arrival) => arrival.tag === "h1")).toBe(false);
  expect(faded.some((arrival) => arrival.inSearch)).toBe(false);
  expect(faded.every((arrival) => arrival.duration === 150)).toBe(true);
  expect(faded.every((arrival) => arrival.easing === "linear")).toBe(true);

  // A sheet the page hasn't shown yet: the search mounts a new row for it.
  await createSheet(page, { title: `Later ${mark}` });
  await clearArrivals(page);
  await page.getByRole("searchbox", { name: "Search sheets" }).fill(mark);
  await expect(rows(page).filter({ hasText: `Later ${mark}` })).toHaveCount(1);
  await expect(rows(page)).toHaveCount(2);
  await wait(300);
  expect(await arrivals(page)).toEqual([]);
});

// Scenario "Back to Sheets": only Recent's cards fade, the list stays.
test("fades only Recent's cards in on a slow step back to Sheets", async ({
  page,
}) => {
  const title = `Back fade ${newMark()}`;
  await createSheet(page, { title });
  await recordArrivals(page);
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  const row = rows(page).filter({ hasText: title });
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await expect(heading(page)).toHaveText(title);
  await clearArrivals(page);
  await delay(page, /\.data/, 1500);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.locator("main .recent-sheets-skeleton")).toHaveCount(4);
  await expect(page.locator("main .recent-sheets-skeleton")).toHaveCount(0);
  await expect
    .poll(async () => (await arrivals(page)).some((a) => a.inRecent))
    .toBe(true);
  expect((await arrivals(page)).some(isRow)).toBe(false);
});

// Scenario "A slow collection": the rows fade, the name and count the rail
// knew stay. With reduced motion the fade ends at once.
for (const reducedMotion of ["no-preference", "reduce"] as const) {
  const how = reducedMotion === "reduce" ? " with reduced motion" : "";
  test(`fades a slow collection's rows in, not its name and count${how}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    const mark = newMark();
    const name = `Fading ${mark}`;
    await collectionWith(page, name, [`One ${mark}`, `Two ${mark}`]);
    await recordArrivals(page);
    await startOnCollections(page);
    await delay(page, collectionData, 1500);
    await openCollection(page, name);
    await expect(bars(page)).toHaveCount(2);
    await expect(rows(page)).toHaveCount(2);
    await expect
      .poll(async () => (await arrivals(page)).filter(isRow).length)
      .toBe(2);
    const faded = await arrivals(page);
    expect(faded.some((arrival) => arrival.text.includes(name))).toBe(false);
    expect(faded.some((arrival) => arrival.text === "2 sheets")).toBe(false);
    expect(faded.map((arrival) => arrival.duration)).toEqual(
      faded.map(() => (reducedMotion === "reduce" ? 0 : 150)),
    );
  });
}

const songContent = {
  format: "chordsheet",
  version: 1,
  sections: [
    {
      label: "Verse",
      lines: [{ text: "Amazing grace", chords: [{ at: 0, root: "G" }] }],
    },
  ],
};

const sheetData = /\/sheets\/[^/]+\.data/;
const sheetFaded = (arrivals: Arrival[]) => ({
  title: arrivals.some((arrival) => arrival.tag === "h1"),
  chips: arrivals.some((arrival) => arrival.classes.includes("play-chips")),
  lines: arrivals.some((arrival) => arrival.child.includes("sheet-view")),
});

// Scenario "A sheet from a row": the title and artist from the row stay,
// the chips and lines fade in.
test("fades a slow sheet's chips and lines in, not the row's title", async ({
  page,
}) => {
  const title = `Sheet fade ${newMark()}`;
  await createSheet(page, { title, artist: "Someone", content: songContent });
  await recordArrivals(page);
  await page.goto(`/sheets?q=${encodeURIComponent(title)}`);
  await expect(rows(page)).toHaveCount(1);
  await delay(page, sheetData, 1500);
  await rows(page).click();
  await expect(
    page.locator(".play-heading .skeleton-bar").first(),
  ).toBeVisible();
  await expect(page.locator(".sheet-view-line").first()).toBeVisible();
  await expect
    .poll(async () => sheetFaded(await arrivals(page)).lines)
    .toBe(true);
  expect(sheetFaded(await arrivals(page))).toEqual({
    title: false,
    chips: true,
    lines: true,
  });
  expect(
    (await arrivals(page)).some((arrival) => arrival.text === "Someone"),
  ).toBe(false);
});

// A sheet without the row it was opened from: its title was a bar too.
// Loaded fresh, the sheet's history entry has no row. Back pushes Sheets,
// so a step back to the sheet shows the skeleton without one.
test("fades a slow sheet's title in when it was a bar", async ({ page }) => {
  const title = `Sheet bar ${newMark()}`;
  const id = await createSheet(page, { title, content: songContent });
  await recordArrivals(page);
  await page.goto(`/sheets/${id}`);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/sheets$/);
  await page.waitForLoadState("networkidle");
  await delay(page, sheetData, 1500);
  await page.goBack();
  await expect(page.locator(".play-heading h1 .skeleton-bar")).toBeVisible();
  await expect(heading(page)).toHaveText(title);
  await expect
    .poll(async () => sheetFaded(await arrivals(page)).title)
    .toBe(true);
  expect(sheetFaded(await arrivals(page)).lines).toBe(true);
});

const inDialog = (arrival: Arrival, tag: string) => arrival.tag === tag;

// Scenario "A slow list" (dialogs): seen bars give way to collections that
// fade in.
test("fades Choose collections' list in where its bars were", async ({
  page,
}) => {
  const held = await hold(page, chooseData);
  await recordArrivals(page);
  const { list, pick } = await chooseFromRow(page);
  await pick();
  await expect.poll(async () => (await barsLog(page)).shown).toBeDefined();
  held.release();
  await expect(list.getByRole("checkbox").first()).toBeVisible();
  await expect
    .poll(async () =>
      (await arrivals(page)).some((arrival) => inDialog(arrival, "label")),
    )
    .toBe(true);
});

// Scenario "A quick list" (dialogs): no bars, so no fade either.
test(
  "shows a quick Choose collections list without a fade",
  { tag: "@timing" },
  async ({ page }) => {
    await recordArrivals(page);
    await openChooseCollectionsAgain(page, () => clearArrivals(page));
    await wait(300);
    expect(
      (await arrivals(page)).some((arrival) => inDialog(arrival, "label")),
    ).toBe(false);
  },
);

// Add sheets: its rows fade in where its bars were, and a search after
// shows its results at once.
test("fades Add sheets' rows in once, not a search's results", async ({
  page,
}) => {
  const mark = newMark();
  const name = `Adding ${mark}`;
  await collectionWith(page, name, []);
  await createSheet(page, { title: `Addable ${mark}` });
  await recordArrivals(page);
  await startOnCollections(page);
  await openCollection(page, name);
  await expect(heading(page)).toHaveText(name);
  const held = await hold(page, sheetsData);
  await page.getByRole("button", { name: "Add sheets" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog
      .locator(".add-sheets-list:not(.skeleton-waiting) .skeleton-bar")
      .first(),
  ).toBeVisible();
  held.release();
  await expect(dialog.getByRole("checkbox").first()).toBeVisible();
  await expect
    .poll(async () =>
      (await arrivals(page)).some((arrival) => inDialog(arrival, "li")),
    )
    .toBe(true);

  // A sheet the list hasn't shown yet: the search mounts a new row for it.
  await createSheet(page, { title: `Addable later ${mark}` });
  await clearArrivals(page);
  await dialog.getByRole("searchbox", { name: "Search sheets" }).fill(mark);
  await expect(dialog.getByRole("checkbox")).toHaveCount(2);
  await wait(300);
  expect(await arrivals(page)).toEqual([]);
});
