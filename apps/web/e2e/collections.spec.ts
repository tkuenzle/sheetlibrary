import { expect, type Page, test } from "@playwright/test";

import { authFile } from "./servers";

// Collections: the library's Collections screen, a collection's page, and
// "Choose collections…" on the play view and from a row. See
// openspec/specs/collections, collection-page, library-page and sheet-list. The tests share one account, and run on
// both projects at once, so every name carries a mark of its own.

test.use({ storageState: authFile });

const content = {
  format: "chordsheet",
  version: 1,
  sections: [
    {
      lines: [
        {
          text: "Stille Nacht, heilige Nacht",
          chords: [
            { at: 0, root: "C" },
            { at: 7, root: "G" },
            { at: 14, root: "C" },
          ],
        },
      ],
    },
  ],
};

// A word no other sheet or collection has, so a search finds only this
// test's sheets.
function newMark(): string {
  return `m${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`;
}

async function createSheet(page: Page, title: string): Promise<string> {
  const response = await page.request.post("/api/sheets", {
    data: { title, content },
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

async function createCollection(page: Page, name: string): Promise<string> {
  const response = await page.request.post("/api/collections", {
    data: { name },
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

function heading(page: Page) {
  return page.getByRole("heading", { level: 1 });
}

// The screen's content. The shell's rail lists the collections too.
function main(page: Page) {
  return page.getByRole("main");
}

// The shell's navigation: the rail, or the bar on a phone.
function mainNav(page: Page) {
  return page.getByRole("navigation", { name: "Main" });
}

function collectionsLink(page: Page) {
  return mainNav(page).getByRole("link", { name: "Collections", exact: true });
}

// The rail lists the collections by name. The bar on a phone doesn't.
const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

function nameDialog(page: Page, title: string) {
  return page.getByRole("dialog", { name: title });
}

async function openMenuItem(page: Page, item: string) {
  await page.getByRole("button", { name: "More for this collection" }).click();
  await page.getByRole("menuitem", { name: item }).click();
}

// Where a box sits in the window, to check a floating button above the bar.
async function floatsAboveBar(page: Page, name: string) {
  const box = await page.getByRole("button", { name }).boundingBox();
  const viewport = page.viewportSize();
  expect(box).toMatchObject({ width: 64, height: 64 });
  if (!box || !viewport) throw new Error("No box");
  expect(box.x + box.width).toBeGreaterThan(viewport.width - 32);
  // The bar is 80px high.
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - 80);
  expect(box.y + box.height).toBeGreaterThan(viewport.height - 128);
}

// Scenarios "On Collections" and "On a collection on a phone", and
// "Opening Collections" on a wide screen: "New collection" and "Add sheets"
// sit beside the heading at every width, and "New sheet" is in the rail, or
// floating above the bar on a phone.
test("keeps the add buttons beside the heading, with New sheet floating on a phone", async ({
  page,
  hasTouch,
}) => {
  const mark = newMark();
  const sheet = await createSheet(page, `Floating ${mark}`);
  const id = await createCollection(page, `Floating ${mark}`);
  const added = await page.request.put(
    `/api/sheets/${sheet}/collections/${id}`,
  );
  expect(added.ok()).toBe(true);

  for (const [path, name] of [
    ["/collections", "New collection"],
    [`/collections/${id}`, "Add sheets"],
  ] as const) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const button = main(page).getByRole("button", { name });
    await expect(button).toHaveText(name);
    // Beside the heading, or on the line below it on a phone.
    expect((await button.boundingBox())?.y).toBeLessThan(
      ((await heading(page).boundingBox())?.y ?? 0) + 120,
    );
    if (hasTouch) {
      await floatsAboveBar(page, "New sheet");
    } else {
      await expect(
        mainNav(page).getByRole("button", { name: "New sheet" }),
      ).toBeVisible();
    }
  }

  // The floating button opens the ways, on Collections as on Sheets.
  if (hasTouch) {
    await page.getByRole("button", { name: "New sheet" }).click();
    await expect(
      page.getByRole("menu", { name: "New sheet" }).getByRole("menuitem"),
    ).toHaveText([
      "Write a new sheet",
      "From photos…",
      "From Ultimate Guitar…",
    ]);
    await page.keyboard.press("Escape");
  }
});

// Scenarios "Opening Collections", "Making a collection", "A new
// collection" (the rail), "Adding two sheets", "Removing", "Renaming", "Name
// in use" and "Deleting".
test("makes a collection, fills it, renames it and deletes it", async ({
  page,
}) => {
  const mark = newMark();
  const stille = `Stille Nacht ${mark}`;
  const drue = `Drüü Könige ${mark}`;
  await createSheet(page, stille);
  await createSheet(page, drue);
  const name = `Christmas ${mark}`;

  await page.goto("/sheets");
  await collectionsLink(page).click();
  await expect(page).toHaveURL("/collections");
  await expect(page).toHaveTitle("Collections | Sheet Library");
  await expect(heading(page)).toHaveText("Collections");
  await expect(collectionsLink(page)).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("search")).toHaveCount(0);
  await page.reload();
  await expect(collectionsLink(page)).toHaveAttribute("aria-current", "page");

  // A new collection opens empty.
  await page.getByRole("button", { name: "New collection" }).click();
  await nameDialog(page, "New collection").getByLabel("Name").fill(name);
  await nameDialog(page, "New collection")
    .getByRole("button", { name: "Save" })
    .click();
  await expect(page).toHaveURL(/\/collections\/[\w-]+$/);
  await expect(heading(page)).toHaveText(name);
  await expect(page).toHaveTitle(`${name} | Sheet Library`);
  await expect(page.getByText("No sheets in this collection")).toBeVisible();
  // The rail lists it, marked. The bar marks "Collections".
  if (wide(page)) {
    await expect(mainNav(page).getByRole("link", { name })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(collectionsLink(page)).not.toHaveAttribute("aria-current");
  } else {
    await expect(collectionsLink(page)).toHaveAttribute("aria-current", "true");
  }

  // Adding both sheets with the picker's search.
  await page.getByRole("button", { name: "Add sheets" }).click();
  const picker = page.getByRole("dialog", { name: `Add sheets to “${name}”` });
  await picker.getByRole("searchbox", { name: "Search sheets" }).fill(mark);
  await picker.getByRole("checkbox", { name: stille }).check();
  await picker.getByRole("checkbox", { name: drue }).check();
  await picker.getByRole("button", { name: "Add 2 sheets" }).click();
  await expect(picker).toBeHidden();
  // A row's link holds the title, then the last edit.
  const rows = main(page).locator(".library-title");
  await expect(rows).toHaveText([drue, stille]);
  await expect(main(page).getByText("2 sheets", { exact: true })).toBeVisible();
  if (wide(page)) {
    await expect(mainNav(page).getByRole("link", { name })).toContainText(
      "2 sheets",
    );
  }

  // Scenario "Already in the collection".
  await page.getByRole("button", { name: "Add sheets" }).click();
  await picker.getByRole("searchbox", { name: "Search sheets" }).fill(mark);
  await expect(picker.getByRole("checkbox", { name: stille })).toBeChecked();
  await expect(picker.getByRole("checkbox", { name: stille })).toBeDisabled();
  await picker.getByRole("button", { name: "Cancel" }).click();
  await expect(picker).toBeHidden();

  // Removing, from the row's menu, keeps the sheet in the library. The row
  // goes at once, so the reload waits for the server's answer.
  const removed = page.waitForResponse(
    (response) => response.request().method() === "POST",
  );
  await page.getByRole("button", { name: `More for ${stille}` }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Choose collections…",
    `Remove from ${name}`,
    "Delete",
  ]);
  await page.getByRole("menuitem", { name: `Remove from ${name}` }).click();
  await expect(rows).toHaveText([drue]);
  await expect(heading(page)).toBeFocused();
  expect((await removed).ok()).toBe(true);
  await page.reload();
  await expect(rows).toHaveText([drue]);
  await expect(main(page).getByText("1 sheet", { exact: true })).toBeVisible();

  // A name in use keeps the dialog open.
  const other = `Campfire ${mark}`;
  await createCollection(page, other);
  await openMenuItem(page, "Rename");
  const rename = nameDialog(page, "Rename collection");
  await expect(rename.getByLabel("Name")).toHaveValue(name);
  await rename.getByLabel("Name").fill(other.toLowerCase());
  await rename.getByRole("button", { name: "Save" }).click();
  await expect(rename).toContainText("That name is already used.");
  await rename.getByLabel("Name").fill(`Weihnachten ${mark}`);
  await rename.getByRole("button", { name: "Save" }).click();
  await expect(rename).toBeHidden();
  await expect(heading(page)).toHaveText(`Weihnachten ${mark}`);
  if (wide(page)) {
    await expect(
      mainNav(page).getByRole("link", { name: `Weihnachten ${mark}` }),
    ).toHaveAttribute("aria-current", "page");
    await expect(mainNav(page).getByRole("link", { name })).toHaveCount(0);
  }

  // Deleting opens Collections, without it there or in the rail, and the
  // sheets stay.
  await openMenuItem(page, "Delete");
  const confirm = page.getByRole("alertdialog", {
    name: `Delete “Weihnachten ${mark}”?`,
  });
  await expect(confirm).toContainText("Its sheets stay in the library.");
  await confirm.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL("/collections");
  await expect(heading(page)).toBeFocused();
  // Scenario "First titles on a card": Campfire holds nothing.
  await expect(main(page).getByRole("link", { name: other })).toHaveText(
    `${other}0 sheets`,
  );
  await expect(page.getByText(`Weihnachten ${mark}`)).toHaveCount(0);
  await page.goto(`/sheets?q=${mark}`);
  await expect(page.getByRole("search").getByRole("status")).toHaveText(
    "2 sheets",
  );
});

// Scenario "Someone else's collection". A collection has no top bar: the
// navigation leads back, and an unknown one shows inside the shell too.
test("goes back to Collections, and doesn't find an unknown collection", async ({
  page,
}) => {
  const id = await createCollection(page, `Learning ${newMark()}`);
  await page.goto(`/collections/${id}`);
  await expect(page.getByRole("banner")).toHaveCount(0);
  await collectionsLink(page).click();
  await expect(page).toHaveURL("/collections");
  const response = await page.goto("/collections/nosuchcollect");
  expect(response?.status()).toBe(404);
  await expect(heading(page)).toHaveText("Collection not found");
  await expect(page.getByRole("banner")).toHaveCount(0);
  await expect(collectionsLink(page)).toHaveAttribute("aria-current", "page");
});

async function openChooseCollections(page: Page) {
  if (
    await page.getByRole("button", { name: "Choose collections" }).isVisible()
  ) {
    await page.getByRole("button", { name: "Choose collections" }).click();
  } else {
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("menuitem", { name: "Choose collections…" }).click();
  }
  return page.getByRole("dialog", { name: "Choose collections" });
}

// Scenarios "Adding to a collection", "Already in a collection", "First
// collection" and a tick that fails.
test("adds a sheet to collections from the play view", async ({
  page,
}, testInfo) => {
  const mark = newMark();
  const title = `Stille Nacht ${mark}`;
  const sheetId = await createSheet(page, title);
  const name = `Christmas ${mark}`;
  const collectionId = await createCollection(page, name);

  await page.goto(`/sheets/${sheetId}`);
  if (testInfo.project.name === "chromium") {
    const actions = page.locator(".play-actions");
    await expect(actions.getByRole("button")).toHaveText([
      "Lyrics only",
      "",
      "",
      "",
      "",
    ]);
    await expect(
      actions.getByRole("button", { name: "Choose collections" }),
    ).toBeVisible();
  }

  let dialog = await openChooseCollections(page);
  await expect(dialog).toContainText(title);
  const box = dialog.getByRole("checkbox", { name });
  await expect(box).not.toBeChecked();
  const added = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/collections/${collectionId}`) &&
      response.request().method() === "PUT",
  );
  await box.check();
  expect((await added).status()).toBe(204);
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();

  dialog = await openChooseCollections(page);
  await expect(dialog.getByRole("checkbox", { name })).toBeChecked();

  // "New collection" makes one with the sheet in it, ticked.
  const made = `Kinderlieder ${mark}`;
  await dialog.getByRole("button", { name: "New collection" }).click();
  await nameDialog(page, "New collection").getByLabel("Name").fill(made);
  await nameDialog(page, "New collection")
    .getByRole("button", { name: "Save" })
    .click();
  await expect(dialog.getByRole("checkbox", { name: made })).toBeChecked();

  // A tick that can't be saved goes back, with a note.
  await page.route(`**/api/sheets/${sheetId}/collections/*`, (route) =>
    route.abort(),
  );
  await dialog.getByRole("checkbox", { name }).uncheck();
  await expect(dialog.getByRole("checkbox", { name })).toBeChecked();
  await expect(dialog).toContainText("The change couldn’t be saved.");
  await page.unroute(`**/api/sheets/${sheetId}/collections/*`);
  await dialog.getByRole("button", { name: "Done" }).click();

  await page.goto(`/collections/${collectionId}`);
  await expect(main(page).locator(".library-title")).toHaveText([title]);
  // Scenario "The same row in a collection": the row shows the key.
  await expect(main(page).locator(".library-key")).toContainText("C");
  const listed = await page.request.get(`/api/sheets/${sheetId}/collections`);
  const collections = (await listed.json()) as {
    name: string;
    holds: boolean;
  }[];
  expect(collections.filter((c) => c.name.includes(mark))).toEqual([
    expect.objectContaining({ name, holds: true }),
    expect.objectContaining({ name: made, holds: true }),
  ]);
});

// Scenarios "Adding from Sheets" and "First titles on a card".
test("adds a sheet to a collection from its row on Sheets", async ({
  page,
}) => {
  const mark = newMark();
  const title = `Stille Nacht ${mark}`;
  await createSheet(page, title);
  const name = `Christmas ${mark}`;
  const collectionId = await createCollection(page, name);

  await page.goto("/sheets");
  if (wide(page)) {
    await expect(mainNav(page).getByRole("link", { name })).toContainText(
      "0 sheets",
    );
  }
  await page.getByRole("button", { name: `More for ${title}` }).click();
  await page.getByRole("menuitem", { name: "Choose collections…" }).click();
  const dialog = page.getByRole("dialog", { name: "Choose collections" });
  await expect(dialog).toContainText(title);
  const added = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/collections/${collectionId}`) &&
      response.request().method() === "PUT",
  );
  await dialog.getByRole("checkbox", { name }).check();
  expect((await added).status()).toBe(204);
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: `More for ${title}` }),
  ).toBeFocused();
  // The rail follows without a reload.
  if (wide(page)) {
    await expect(mainNav(page).getByRole("link", { name })).toContainText(
      "1 sheet",
    );
  }

  await collectionsLink(page).click();
  await expect(main(page).getByRole("link", { name })).toHaveText(
    `${name}1 sheet${title}`,
  );
});

// Scenario "From Sheets to a collection", in a collection: "Last added" is
// when a sheet was added to it, newest first.
test("lists a collection in the order chosen on Sheets", async ({ page }) => {
  const mark = newMark();
  const first = `Amazing Grace ${mark}`;
  const second = `Stille Nacht ${mark}`;
  const firstId = await createSheet(page, first);
  const secondId = await createSheet(page, second);
  const collectionId = await createCollection(page, `Christmas ${mark}`);
  // Stille Nacht is added last.
  for (const id of [firstId, secondId]) {
    const response = await page.request.put(
      `/api/sheets/${id}/collections/${collectionId}`,
    );
    expect(response.status()).toBe(204);
  }
  const titles = main(page).locator(".library-title");

  await page.goto(`/collections/${collectionId}`);
  await expect(titles).toHaveText([first, second]);
  await page.goto("/sheets");
  await page.getByRole("button", { name: "Title", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Last added" }).click();
  await expect(page.getByRole("button", { name: "Last added" })).toBeVisible();

  await page.goto(`/collections/${collectionId}`);
  await expect(page.getByRole("button", { name: "Last added" })).toBeVisible();
  await expect(titles).toHaveText([second, first]);
  await page.getByRole("button", { name: "Last added" }).click();
  await page
    .getByRole("menuitemcheckbox", { name: "Title", exact: true })
    .click();
  await expect(titles).toHaveText([first, second]);
});
