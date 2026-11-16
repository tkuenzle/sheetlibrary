import { expect, type Page, test } from "@playwright/test";

import { findLink } from "./emails";
import { authFile } from "./servers";

// The Sheets screen of the library, at /sheets, in the shell.

function heading(page: Page) {
  return page.getByRole("heading", { level: 1 });
}

// The rows of the list. The shell's rail has list items of its own.
function rows(page: Page) {
  return page.getByRole("main").getByRole("listitem");
}

// "Recent" on Sheets.
function recent(page: Page) {
  return page.getByRole("region", { name: "Recent" });
}

// The shell's navigation: the rail, or the bar on a phone.
function mainNav(page: Page) {
  return page.getByRole("navigation", { name: "Main" });
}

// A mark on the document. A full load of a page would lose it.
async function markDocument(page: Page) {
  await page.evaluate(() => {
    document.documentElement.dataset.loadedOnce = "";
  });
}

function sameDocument(page: Page) {
  return page.evaluate(() => "loadedOnce" in document.documentElement.dataset);
}

// "New sheet": in the rail, or floating above the bar on a phone. Only the
// one for the window's width is visible.
function newSheetButton(page: Page) {
  return page.getByRole("button", { name: "New sheet" });
}

// Picks one of the ways in the menu of "New sheet".
async function startNewSheet(page: Page, way: string) {
  await newSheetButton(page).click();
  await page.getByRole("menuitem", { name: way }).click();
}

async function openUltimateGuitar(page: Page) {
  await startNewSheet(page, "From Ultimate Guitar…");
}

function passkeyOffer(page: Page) {
  return page.getByRole("region", { name: "Passkey" });
}

function importDialog(page: Page) {
  return page.getByRole("dialog", { name: "Import from Ultimate Guitar" });
}

async function pasteAndImport(page: Page, text: string) {
  await openUltimateGuitar(page);
  await importDialog(page).getByLabel("Chords and lyrics").fill(text);
  await importDialog(page)
    .getByRole("button", { name: "Import", exact: true })
    .click();
}

// Scenarios "Opening the email link", "First sign-in" and "Writing the
// first sheet", the last with JavaScript off, and the passkey offer. A new account starts with no sheets, so this signs in by email
// itself. Sign-in emails are limited per visitor, so only on one project.
test("a new account signs in to an empty library and starts a sheet", async ({
  page,
  browser,
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
  await expect(page).toHaveTitle("Sheets | Sheet Library");
  await expect(heading(page)).toHaveText("Sheets");
  await expect(
    page.getByRole("heading", { name: "Add your first sheet" }),
  ).toBeVisible();
  const ways = page
    .getByRole("region", { name: "Add your first sheet" })
    .getByRole("button");
  await expect(ways).toHaveCount(3);
  await expect(ways.nth(0)).toContainText("Write it");
  await expect(ways.nth(1)).toContainText("From photos");
  await expect(ways.nth(2)).toContainText("From Ultimate Guitar");
  // Scenario "Empty library on a phone": the cards, and no floating button.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(ways).toHaveCount(3);
  await expect(newSheetButton(page)).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 720 });

  // Scenarios "First email sign-in", "Opening the account page" and "Closed
  // before". A reload doesn't offer it again.
  await expect(passkeyOffer(page)).toContainText(
    "Add a passkey to sign in on this device without waiting for an email.",
  );
  await expect(page).not.toHaveURL(/passkey/);
  await page.reload();
  await expect(heading(page)).toHaveText("Sheets");
  await expect(passkeyOffer(page)).toHaveCount(0);
  await page.goto("/sheets?passkey");
  await passkeyOffer(page).getByRole("link", { name: "Add passkey" }).click();
  await expect(page).toHaveURL("/account");
  await page.goto("/sheets?passkey");
  await passkeyOffer(page).getByRole("button", { name: "Close" }).click();
  await expect(passkeyOffer(page)).toHaveCount(0);
  await page.goto("/sheets?passkey");
  await expect(heading(page)).toHaveText("Sheets");
  await expect(passkeyOffer(page)).toHaveCount(0);

  // "Write it" is a form, so it works with JavaScript off.
  const noScripts = await browser.newContext({
    javaScriptEnabled: false,
    storageState: await page.context().storageState(),
  });
  const plain = await noScripts.newPage();
  await plain.goto("/sheets");
  await plain.getByRole("button", { name: /^Write it/ }).click();
  // The editor itself needs the scripts. The list below shows the sheet.
  await expect(plain).toHaveURL(/\/sheets\/[\w-]{12}\/edit\?new$/);
  await noScripts.close();

  await page.goto("/sheets");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page)).toContainText("Untitled");

  // "Recent" counts this account's openings only, so it is checked here.
  // Scenario "Editing only": the new sheet opened in the editor.
  await expect(recent(page)).toHaveCount(0);

  // Scenario "Opened last".
  const created = await page.request.post("/api/sheets", {
    data: {
      title: "Stille Nacht",
      content: { format: "chordsheet", version: 1, sections: [] },
    },
  });
  expect(created.status()).toBe(201);
  await page.reload();
  for (const title of ["Untitled", "Stille Nacht"]) {
    await page.getByRole("link", { name: title }).first().click();
    await expect(heading(page)).toHaveText(title);
    await page.goBack();
    await expect(heading(page)).toHaveText("Sheets");
  }
  const cards = recent(page).getByRole("link");
  await expect(cards).toHaveText([/^Stille Nacht/, /^Untitled/]);

  // Scenario "Searching".
  await page.getByRole("searchbox").fill("Stille");
  await expect(page).toHaveURL(/q=Stille/);
  await expect(recent(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(cards).toHaveCount(2);

  // Scenarios "Counting the sheets", "Deleting a recent sheet" and
  // "Deleting a sheet": the card and the count follow the row at once,
  // before the server answers.
  const allSheets = page.getByRole("heading", { name: /^All sheets/ });
  await expect(allSheets).toHaveText("All sheets 2");
  let held = false;
  let answer: () => void = () => undefined;
  const answered = new Promise<void>((resolve) => {
    answer = resolve;
  });
  await page.route("**/sheets.data*", async (route) => {
    if (route.request().method() === "POST") {
      held = true;
      await answered;
    }
    await route.continue();
  });
  await page.getByRole("button", { name: "More for Stille Nacht" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page
    .getByRole("alertdialog", { name: "Delete “Stille Nacht”?" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(cards).toHaveText([/^Untitled/]);
  await expect(allSheets).toHaveText("All sheets 1");
  // The request reaches the route a moment after the screen changes.
  await expect.poll(() => held).toBe(true);
  answer();
  await page.unrouteAll({ behavior: "wait" });
  await expect(allSheets).toHaveText("All sheets 1");
  await expect(rows(page).filter({ hasText: "Stille Nacht" })).toHaveCount(0);
});

test.describe("signed in", () => {
  test.use({ storageState: authFile });

  // Scenario "Signed in" (home page).
  test("the home page opens the library", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/sheets");
    await expect(heading(page)).toHaveText("Sheets");
  });

  // Scenario "Starting a sheet". On a phone, the button floats at the
  // bottom right, above the bar.
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
    const button = newSheetButton(page);
    if (testInfo.project.name === "phone") {
      const box = await button.boundingBox();
      const viewport = page.viewportSize();
      expect(box && viewport).toBeTruthy();
      // Above the shell's bar, which is 80px high.
      if (box && viewport) {
        expect(box.x + box.width).toBeGreaterThan(viewport.width - 32);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - 80);
        expect(box.y + box.height).toBeGreaterThan(viewport.height - 128);
      }
    }
    await button.click();
    // Scenario "Opening the menu on a phone": the ways show above the
    // button, which reads "Close" while they are open.
    if (testInfo.project.name === "phone") {
      const close = page.getByRole("button", { name: "Close" });
      await expect(close).toBeVisible();
      const closeBox = await close.boundingBox();
      const way = await page
        .getByRole("menuitem", { name: "Write a new sheet" })
        .boundingBox();
      expect((way?.y ?? 0) + (way?.height ?? 0)).toBeLessThan(closeBox?.y ?? 0);
      await close.click();
      await expect(close).toBeHidden();
      await expect(button).toBeFocused();
      await button.click();
    }
    await page.getByRole("menuitem", { name: "Write a new sheet" }).click();

    // Scenario "Naming a new sheet": the title field is open, with
    // "Untitled" selected, so typing replaces it.
    const title = `Sheet ${crypto.randomUUID().slice(0, 8)}`;
    await expect(page.getByLabel("Title", { exact: true })).toBeFocused();
    await page.keyboard.type(title);
    await page.keyboard.press("Enter");
    await expect(heading(page)).toHaveText(title);
    await expect(page).toHaveURL(/\/sheets\/[\w-]{12}\/edit$/);

    // A reload doesn't open the field again.
    await expect(page.getByRole("status")).toHaveText("Saved");
    await page.reload();
    await expect(heading(page)).toHaveText(title);
    await expect(page.getByLabel("Title", { exact: true })).toHaveCount(0);
  });
});

// Scenarios of openspec/specs/site-layout for the shell.
test.describe("the shell", () => {
  test.use({ storageState: authFile });

  const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

  // Scenarios "From Sheets to Collections", "The open screen", "No top
  // bar" and "Opening Collections".
  test("moves between its screens without loading the page again", async ({
    page,
  }) => {
    await page.goto("/sheets");
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(mainNav(page)).toHaveCount(1);
    // Not a collection's "2 sheets" in the rail.
    const sheets = mainNav(page).getByRole("link", {
      name: "Sheets",
      exact: true,
    });
    const collections = mainNav(page).getByRole("link", {
      name: "Collections",
      exact: true,
    });
    await expect(sheets).toHaveAttribute("aria-current", "page");

    await markDocument(page);
    await collections.click();
    await expect(page).toHaveURL("/collections");
    await expect(page).toHaveTitle("Collections | Sheet Library");
    await expect(heading(page)).toHaveText("Collections");
    await expect(heading(page)).toBeFocused();
    await expect(collections).toHaveAttribute("aria-current", "page");
    await expect(sheets).not.toHaveAttribute("aria-current");
    await expect(page.getByRole("banner")).toHaveCount(0);
    // The search field belongs to Sheets.
    await expect(page.getByRole("search")).toHaveCount(0);
    expect(await sameDocument(page)).toBe(true);

    await sheets.click();
    await expect(heading(page)).toHaveText("Sheets");
    await expect(heading(page)).toBeFocused();
  });

  // Scenarios "On a phone" and "On the account page" (Account in the
  // shell).
  test("opens the account page from the rail, or from the top right on a phone", async ({
    page,
  }) => {
    await page.goto("/sheets");
    const account = page.getByRole("link", { name: "Account" });
    await expect(account).toHaveCount(1);
    await expect(account).toHaveText(/^[A-Z]/);
    if (!wide(page)) {
      // The bar holds only the screens. The account is on the heading's
      // line, at the right edge.
      await expect(mainNav(page).getByRole("link")).toHaveText([
        "Sheets",
        "Collections",
      ]);
      const box = await account.boundingBox();
      const title = await heading(page).boundingBox();
      const width = page.viewportSize()?.width ?? 0;
      expect(box && title).toBeTruthy();
      if (box && title) {
        expect(box.x + box.width).toBeGreaterThan(width - 16);
        expect(box.y).toBeLessThan(title.y + title.height);
        expect(box.x).toBeGreaterThanOrEqual(title.x + title.width);
      }
    }
    await account.click();
    await expect(page).toHaveURL("/account");
    await expect(heading(page)).toHaveText("Account");
    await expect(heading(page)).toBeFocused();
    await expect(account).toHaveAttribute("aria-current", "page");
    await expect(page.locator("[aria-current]:visible")).toHaveCount(1);
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.getByRole("search")).toHaveCount(0);
  });

  // Requirement "Skip to content".
  test("skips to the content from its first link", async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, "No keyboard on touch");
    await page.goto("/sheets");
    const skip = page.getByRole("link", { name: "Skip to content" });
    expect((await skip.boundingBox())?.width).toBeLessThanOrEqual(1);
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
    expect((await skip.boundingBox())?.width).toBeGreaterThan(100);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await expect(page).toHaveURL("/sheets");
  });

  // Scenario "Opening Sheets": no button beside the heading, and "New
  // sheet" in the rail.
  test("has New sheet in the rail, not beside the heading", async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, "The rail isn't there on a phone");
    await page.goto("/sheets");
    await expect(heading(page)).toHaveText("Sheets");
    await expect(
      mainNav(page).getByRole("button", { name: "New sheet" }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("button", { name: "New sheet" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Import", exact: true }),
    ).toHaveCount(0);
  });

  // Scenario "On a tablet".
  test("shows the rail as icons with their names in a window of middle width", async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, "The phone project stays a phone");
    await page.setViewportSize({ width: 800, height: 720 });
    await page.goto("/sheets");
    await expect(
      mainNav(page).getByRole("button", { name: "Open navigation" }),
    ).toBeVisible();
    await expect(mainNav(page).getByRole("link")).toHaveText([
      "Sheets",
      "Collections",
      /^[A-Z]Account$/,
    ]);
    const buttons = mainNav(page).getByRole("button");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveAccessibleName("Open navigation");
    await expect(buttons.nth(1)).toHaveAccessibleName("New sheet");
    expect((await mainNav(page).boundingBox())?.width).toBe(88);

    // The square "New sheet" opens its menu beside it.
    const newSheet = mainNav(page).getByRole("button", { name: "New sheet" });
    await newSheet.click();
    const menu = page.getByRole("menu", { name: "New sheet" });
    await expect(menu.getByRole("menuitem")).toHaveText([
      "Write a new sheet",
      "From photos…",
      "From Ultimate Guitar…",
    ]);
    const buttonBox = await newSheet.boundingBox();
    const menuBox = await menu.boundingBox();
    expect(menuBox?.x).toBeGreaterThan(
      (buttonBox?.x ?? 0) + (buttonBox?.width ?? 0),
    );
    await page.keyboard.press("Escape");

    await mainNav(page).getByRole("link", { name: "Collections" }).click();
    await expect(page).toHaveURL("/collections");
  });

  // Scenario "New sheet on another screen", and "Write a new sheet" from it.
  test("starts a sheet from the rail on any screen", async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, "The rail isn't there on a phone");
    const name = `Rail ${crypto.randomUUID().slice(0, 8)}`;
    const response = await page.request.post("/api/collections", {
      data: { name },
    });
    const { id } = (await response.json()) as { id: string };
    await page.goto(`/collections/${id}`);
    await page.waitForLoadState("networkidle");

    const newSheet = mainNav(page).getByRole("button", { name: "New sheet" });
    await newSheet.click();
    const menu = page.getByRole("menu", { name: "New sheet" });
    await expect(menu.getByRole("menuitem")).toHaveText([
      "Write a new sheet",
      "From photos…",
      "From Ultimate Guitar…",
    ]);

    // An import's dialog opens over the collection, and gives the focus back
    // to "New sheet" when cancelled.
    await menu.getByRole("menuitem", { name: "From Ultimate Guitar…" }).click();
    await expect(importDialog(page)).toBeVisible();
    await importDialog(page).getByRole("button", { name: "Cancel" }).click();
    await expect(importDialog(page)).toBeHidden();
    await expect(newSheet).toBeFocused();
    await expect(page).toHaveURL(`/collections/${id}`);

    await newSheet.click();
    await menu.getByRole("menuitem", { name: "Write a new sheet" }).click();
    await expect(page).toHaveURL(/\/sheets\/[\w-]{12}\/edit$/);
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
      "Untitled",
    );
  });

  test.describe("the opened rail", () => {
    test.skip(({ hasTouch }) => hasTouch, "The phone project stays a phone");

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 720 });
    });

    const menuButton = (page: Page) =>
      page.getByRole("button", { name: "Open navigation" });
    const panel = (page: Page) => page.getByRole("dialog", { name: "Main" });
    const focusInPanel = (page: Page) =>
      page.evaluate(() => document.activeElement?.closest("dialog") !== null);

    // Scenario "Opening a collection from the opened rail".
    test("lists the collections, and opens one", async ({ page }) => {
      const name = `Christmas ${crypto.randomUUID().slice(0, 8)}`;
      const response = await page.request.post("/api/collections", {
        data: { name },
      });
      expect(response.status()).toBe(201);
      await page.goto("/sheets");
      await markDocument(page);

      await menuButton(page).click();
      await expect(panel(page)).toBeVisible();
      await expect(
        panel(page).getByRole("link", { name: "Sheet Library" }),
      ).toBeVisible();
      expect(await focusInPanel(page)).toBe(true);
      expect((await panel(page).boundingBox())?.width).toBe(304);

      await panel(page)
        .getByRole("link", { name: new RegExp(`^${name}`) })
        .click();
      await expect(panel(page)).toBeHidden();
      await expect(heading(page)).toHaveText(name);
      await expect(heading(page)).toBeFocused();
      expect(await sameDocument(page)).toBe(true);
    });

    test("slides out after a pick, and the new page's heading takes the focus", async ({
      page,
    }) => {
      await page.goto("/sheets");
      // A slide out takes 1.5 seconds at a tenth of the speed, so the new
      // page comes while the page is still inert behind the rail.
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Animation.enable");
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.1 });
      await menuButton(page).click();
      await expect(panel(page)).toBeVisible();
      await panel(page)
        .getByRole("link", { name: "Collections", exact: true })
        .click();
      await expect(heading(page)).toHaveText("Collections");
      await expect(panel(page)).toHaveAttribute("data-closing");
      await expect(panel(page)).toBeHidden();
      await expect(heading(page)).toBeFocused();
    });

    test("stays open until the picked page is there, so the old one doesn't show again", async ({
      page,
    }) => {
      const name = `Slow ${crypto.randomUUID().slice(0, 8)}`;
      const response = await page.request.post("/api/collections", {
        data: { name },
      });
      expect(response.status()).toBe(201);
      await page.goto("/sheets");
      await page.waitForLoadState("networkidle");
      let release = (): void => undefined;
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(/\/collections\/[^/]+\.data/, async (route) => {
        await held;
        await route.continue();
      });

      await menuButton(page).click();
      await panel(page)
        .getByRole("link", { name: new RegExp(`^${name}`) })
        .click();
      // While the collection loads, the rail stays over the old page.
      await expect(page).toHaveURL("/sheets");
      await expect(panel(page)).toBeVisible();
      await expect(panel(page)).not.toHaveAttribute("data-closing");
      release();
      await expect(heading(page)).toHaveText(name);
      await expect(panel(page)).toBeHidden();
      await expect(heading(page)).toBeFocused();
    });

    // Scenario "A way picked from the opened rail".
    test("closes before a way picked from its New sheet starts", async ({
      page,
    }) => {
      await page.goto("/sheets");
      await page.waitForLoadState("networkidle");
      await menuButton(page).click();
      await panel(page).getByRole("button", { name: "New sheet" }).click();
      await panel(page).getByRole("menuitem", { name: "From photos…" }).click();
      await expect(panel(page)).toBeHidden();
      const photos = page.getByRole("dialog", { name: "Import from photos" });
      await expect(photos).toBeVisible();
      await photos.getByRole("button", { name: "Cancel" }).click();
      await expect(photos).toBeHidden();
      await expect(menuButton(page)).toBeFocused();
    });

    // Scenario "Closing with Escape".
    test("closes with Escape, and gives the focus back", async ({ page }) => {
      await page.goto("/sheets");
      await menuButton(page).click();
      await expect(panel(page)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(panel(page)).toBeHidden();
      await expect(menuButton(page)).toBeFocused();
    });

    test("closes with its button or a click on the page, which it covers", async ({
      page,
    }) => {
      await page.goto("/sheets");
      await menuButton(page).click();
      await panel(page).getByRole("button", { name: "Close" }).click();
      await expect(panel(page)).toBeHidden();
      await expect(menuButton(page)).toBeFocused();

      await menuButton(page).click();
      await expect(panel(page)).toBeVisible();
      // On the heading "Sheets", beside the panel: the click doesn't reach
      // the page.
      const box = await heading(page).boundingBox();
      await page.mouse.click((box?.x ?? 0) + 300, (box?.y ?? 0) + 10);
      await expect(panel(page)).toBeHidden();
      await expect(page).toHaveURL("/sheets");
    });

    test("closes when the window leaves the middle width", async ({ page }) => {
      await page.goto("/sheets");
      for (const width of [1280, 500]) {
        await page.setViewportSize({ width: 800, height: 720 });
        await menuButton(page).click();
        await expect(panel(page)).toBeVisible();
        await page.setViewportSize({ width, height: 720 });
        await expect(panel(page)).toBeHidden();
      }
    });
  });

  // Scenarios "Opening a sheet", "Going back" and "On a phone" (Bottom bar):
  // the last row clears the floating button and the bar.
  test("opens a sheet from a row, and goes back to where the list was", async ({
    page,
  }) => {
    // Enough sheets for the list to scroll.
    for (let i = 0; i < 14; i++) {
      await page.request.post("/api/sheets", {
        data: {
          title: `Filler ${String(i)}`,
          content: { format: "chordsheet", version: 1, sections: [] },
        },
      });
    }
    await page.goto("/sheets");
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    const last = rows(page).last();
    const rowBox = await last.boundingBox();
    const viewport = page.viewportSize();
    expect(rowBox && viewport).toBeTruthy();
    if (rowBox && viewport && !wide(page) && viewport.width <= 640) {
      const button = await newSheetButton(page).boundingBox();
      expect(rowBox.y + rowBox.height).toBeLessThanOrEqual(button?.y ?? 0);
      expect(rowBox.y + rowBox.height).toBeLessThanOrEqual(
        viewport.height - 80,
      );
    }
    const scrolled = await page.evaluate(() => window.scrollY);
    expect(scrolled).toBeGreaterThan(0);
    const title = (await last.getByRole("link").innerText()).split("\n")[0];

    await markDocument(page);
    await last.getByRole("link").click();
    await expect(page).toHaveURL(/\/sheets\/[\w-]{12}$/);
    await expect(heading(page)).toHaveText(title ?? "");
    await expect(heading(page)).toBeFocused();
    expect(await sameDocument(page)).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.goBack();
    await expect(page).toHaveURL("/sheets");
    await expect(heading(page)).toHaveText("Sheets");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrolled);
  });
});

// Scenarios of openspec/specs/sheet-list on Sheets. The account is shared
// with other tests, so each test looks only at the sheets it made, found by
// a mark in their titles.
test.describe("the sheet list", () => {
  test.use({ storageState: authFile });

  async function createSheet(page: Page, title: string): Promise<string> {
    const response = await page.request.post("/api/sheets", {
      data: {
        title,
        content: { format: "chordsheet", version: 1, sections: [] },
      },
    });
    expect(response.status()).toBe(201);
    return ((await response.json()) as { id: string }).id;
  }

  function newMark(): string {
    return `m${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`;
  }

  // The titles of this test's rows, in the order shown.
  function titles(page: Page, mark: string) {
    return page
      .getByRole("main")
      .locator(".library-title")
      .filter({ hasText: mark });
  }

  // Scenarios "A to Z by default", "The order is kept" and "Searching".
  test("sorts A to Z, and keeps the order chosen", async ({ page }) => {
    const mark = newMark();
    const grace = `Amazing Grace ${mark}`;
    const stille = `Stille Nacht ${mark}`;
    // Stille Nacht is edited last.
    await createSheet(page, grace);
    await createSheet(page, stille);

    await page.goto("/sheets");
    await expect(titles(page, mark)).toHaveText([grace, stille]);
    await page.getByRole("button", { name: "Title", exact: true }).click();
    await expect(page.getByRole("menuitemcheckbox")).toHaveText([
      "Title",
      "Artist",
      "Last edited",
      "Last added",
    ]);
    await expect(
      page.getByRole("menuitemcheckbox", { name: "Title", exact: true }),
    ).toBeChecked();
    await page.getByRole("menuitemcheckbox", { name: "Last edited" }).click();
    await expect(titles(page, mark)).toHaveText([stille, grace]);

    await page.reload();
    await expect(
      page.getByRole("button", { name: "Last edited" }),
    ).toBeVisible();
    await expect(titles(page, mark)).toHaveText([stille, grace]);

    // While searching, the best match comes first and the control is hidden.
    await page.goto(`/sheets?q=${mark}`);
    await expect(page.getByRole("search").getByRole("status")).toHaveText(
      "2 sheets",
    );
    await expect(page.getByRole("button", { name: "Last edited" })).toHaveCount(
      0,
    );
  });

  // Requirement "A row in the list": the key, set or guessed, and none
  // without chords.
  test("shows each sheet's key", async ({ page }) => {
    const mark = newMark();
    const line = (roots: string[]) => ({
      text: "x".repeat(roots.length),
      chords: roots.map((root, at) => ({ at, root })),
    });
    const sheets = [
      {
        title: `Amazing Grace ${mark}`,
        content: {
          format: "chordsheet",
          version: 1,
          sections: [{ lines: [line(["G", "C", "D", "G"])] }],
        },
      },
      {
        title: `Greensleeves ${mark}`,
        content: {
          format: "chordsheet",
          version: 1,
          key: { tonic: "F#", minor: true },
          sections: [{ lines: [line(["G", "C"])] }],
        },
      },
      {
        title: `Untitled ${mark}`,
        content: { format: "chordsheet", version: 1, sections: [] },
      },
    ];
    for (const data of sheets) {
      expect((await page.request.post("/api/sheets", { data })).status()).toBe(
        201,
      );
    }
    await page.goto("/sheets");
    const row = (title: string) =>
      page.getByRole("main").getByRole("listitem").filter({ hasText: title });
    const shownKey = (title: string) =>
      row(title).locator('.library-key > [aria-hidden="true"]');
    await expect(shownKey(`Amazing Grace ${mark}`)).toHaveText("G");
    await expect(shownKey(`Greensleeves ${mark}`)).toHaveText("F#m");
    await expect(
      row(`Greensleeves ${mark}`).getByRole("link"),
    ).toHaveAccessibleName(/F sharp minor/);
    await expect(row(`Untitled ${mark}`).locator(".library-key")).toBeEmpty();
  });

  // Scenarios "On Sheets", "Deleting" and "Cancelling".
  test("deletes a sheet from its row, after asking", async ({ page }) => {
    const mark = newMark();
    const title = `Stille Nacht ${mark}`;
    await createSheet(page, title);
    await page.goto("/sheets");
    const menuButton = page.getByRole("button", { name: `More for ${title}` });

    await menuButton.click();
    await expect(page.getByRole("menuitem")).toHaveText([
      "Choose collections…",
      "Delete",
    ]);
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const confirm = page.getByRole("alertdialog", {
      name: `Delete “${title}”?`,
    });
    await expect(confirm).toContainText("This can’t be undone.");
    await confirm.getByRole("button", { name: "Cancel" }).click();
    await expect(confirm).toBeHidden();
    await expect(titles(page, mark)).toHaveText([title]);
    await expect(menuButton).toBeFocused();

    const deleted = page.waitForResponse(
      (response) => response.request().method() === "POST",
    );
    await menuButton.click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await confirm.getByRole("button", { name: "Delete" }).click();
    await expect(titles(page, mark)).toHaveCount(0);
    await expect(heading(page)).toBeFocused();
    expect((await deleted).ok()).toBe(true);
    await page.reload();
    await expect(heading(page)).toHaveText("Sheets");
    await expect(titles(page, mark)).toHaveCount(0);
  });

  // Scenario "Deleting offline": the row comes back with a note, and the
  // list and the navigation stay.
  test("brings the row back when the delete doesn't get through", async ({
    page,
    context,
  }) => {
    const mark = newMark();
    const title = `Stille Nacht ${mark}`;
    await createSheet(page, title);
    await page.goto("/sheets");

    await context.setOffline(true);
    await page.getByRole("button", { name: `More for ${title}` }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page
      .getByRole("alertdialog", { name: `Delete “${title}”?` })
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(page.locator(".sheet-list-status")).toHaveText(
      `“${title}” couldn’t be deleted. Try again.`,
    );
    await expect(titles(page, mark)).toHaveText([title]);
    await expect(heading(page)).toHaveText("Sheets");
    await expect(mainNav(page)).toBeVisible();
    await context.setOffline(false);
  });
});

test.describe("the import", () => {
  test.use({ storageState: authFile });

  const verse = ["[Verse 1]", "C     G", "Hello world"].join("\n");

  test.beforeEach(async ({ page }) => {
    await page.goto("/sheets");
  });

  // Scenario "Importing a song".
  test("creates a sheet and opens it, to be named", async ({ page }) => {
    await pasteAndImport(page, verse);
    await expect(page).toHaveURL(/\/sheets\/[\w-]{12}\/edit$/);
    await expect(page.getByLabel("Title", { exact: true })).toBeFocused();
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
      "Untitled",
    );
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

  // Scenario "Importing with a capo".
  test("opens a sheet written for a capo with it", async ({ page }) => {
    await pasteAndImport(page, ["Capo: 2nd fret", verse].join("\n"));
    await expect(page).toHaveURL(/\/sheets\/[\w-]{12}\/edit\?capo=2$/);
    await page.keyboard.press("Escape");
    const capoButton = page.getByRole("button", { name: /^Capo/ });
    await expect(capoButton).toHaveText("Capo 2");
    await expect(page.locator(".chord-label")).toHaveText(["C", "G"]);

    // It is stored as it sounds, and opens so from the library.
    const id = /\/sheets\/([\w-]{12})/.exec(page.url())?.[1] ?? "";
    await page.goto(`/sheets/${id}/edit`);
    await expect(capoButton).toHaveText("Capo");
    await expect(page.locator(".chord-label")).toHaveText(["D", "A"]);
  });

  // Scenario "Cancelling".
  test("cancels without a new sheet", async ({ page }) => {
    const posts: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") posts.push(request.url());
    });
    await openUltimateGuitar(page);
    await expect(importDialog(page)).not.toContainText("replaces");
    await importDialog(page).getByLabel("Chords and lyrics").fill(verse);
    await importDialog(page).getByRole("button", { name: "Cancel" }).click();
    await expect(importDialog(page)).toBeHidden();
    await expect(newSheetButton(page)).toBeFocused();
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

// Scenarios of openspec/specs/library-search. The account is shared with
// other tests and runs, so each test searches a word of its own.
test.describe("search", () => {
  test.use({ storageState: authFile });

  // A word no other sheet holds: letters only, so it is one word.
  const word = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(10)), (n) =>
      String.fromCharCode(97 + (n % 26)),
    ).join("");

  async function addSheet(page: Page, title: string, ...lines: string[]) {
    const response = await page.request.post("/api/sheets", {
      data: {
        title,
        content: {
          format: "chordsheet",
          version: 1,
          sections:
            lines.length === 0
              ? []
              : [{ lines: lines.map((text) => ({ text, chords: [] })) }],
        },
      },
    });
    expect(response.ok()).toBe(true);
    return ((await response.json()) as { id: string }).id;
  }

  const field = (page: Page) =>
    page.getByRole("searchbox", { name: "Search sheets" });

  // Scenarios "Finding by lyrics", "Without the umlaut" and "Lyrics match".
  test("finds a sheet by a line of its lyrics, without the umlaut", async ({
    page,
  }) => {
    const tag = word();
    await addSheet(page, "Sternsinger", "Stille Nacht", `Drei Kö${tag} ziehen`);
    await page.goto("/sheets");
    await field(page).fill(`ko${tag}`);
    await expect(page).toHaveURL(`/sheets?q=ko${tag}`);
    await expect(page.getByRole("search").getByRole("status")).toHaveText(
      "1 sheet",
    );
    const row = rows(page);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Sternsinger");
    await expect(row).toContainText(`Drei Kö${tag} ziehen`);
    await expect(row.locator("mark")).toHaveText(`Kö${tag}`);

    // A reload shows the same results.
    await page.reload();
    await expect(field(page)).toHaveValue(`ko${tag}`);
    await expect(rows(page)).toHaveCount(1);
  });

  // Scenario "Back leaves the library".
  test("goes back to the sheet the library was opened from", async ({
    page,
  }) => {
    const tag = word();
    const id = await addSheet(page, `Amazing ${tag}`);
    await page.goto(`/sheets/${id}`);
    await expect(heading(page)).toHaveText(`Amazing ${tag}`);
    await page.getByRole("banner").getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL("/sheets");
    await field(page).pressSequentially(tag.slice(0, 5), { delay: 100 });
    await expect(page).toHaveURL(`/sheets?q=${tag.slice(0, 5)}`);
    await page.goBack();
    await expect(page).toHaveURL(`/sheets/${id}`);
  });

  // Scenario "Clearing".
  test("clears the search", async ({ page }) => {
    const tag = word();
    await addSheet(page, `Amazing ${tag}`);
    await page.goto(`/sheets?q=${tag}`);
    await expect(rows(page)).toHaveCount(1);
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page).toHaveURL("/sheets");
    await expect(field(page)).toHaveValue("");
    await expect(field(page)).toBeFocused();
    await expect(page.getByRole("search").getByRole("status")).toHaveText("");
  });

  // Scenario "Slow connection".
  test("says it is searching while results are slow", async ({ page }) => {
    const tag = word();
    await addSheet(page, `Amazing ${tag}`);
    await page.goto(`/sheets?q=${tag}`);
    await expect(rows(page)).toHaveCount(1);
    // The page's data for the next search arrives two seconds late.
    await page.route(/\/sheets\.data\?/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });
    await field(page).fill(`amazing ${tag}`);
    const status = page.getByRole("search").getByRole("status");
    await expect(status).toHaveText("Searching…");
    await expect(page.locator(".library-list")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(status).toHaveText("1 sheet");
    await expect(page.locator(".library-list")).not.toHaveAttribute(
      "aria-busy",
    );
    await expect(page).toHaveURL(/q=amazing/);
  });

  // Scenario "Nothing found". Also on a phone, in the phone project.
  test("says when no sheet matches", async ({ page }) => {
    const tag = word();
    await page.goto(`/sheets?q=${tag}`);
    await expect(
      page.getByRole("heading", { name: `No sheets match “${tag}”` }),
    ).toBeVisible();
    await expect(rows(page)).toHaveCount(0);
    await expect(field(page)).toBeVisible();
  });
});

test.describe("not signed in", () => {
  // Scenario "Not signed in".
  test("sends visitors to sign-in", async ({ page }) => {
    await page.goto("/sheets");
    await expect(page).toHaveURL("/sign-in");
  });
});
