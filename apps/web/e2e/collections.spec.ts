import { expect, type Page, test } from "@playwright/test";

import { authFile } from "./servers";

// Collections: the library's Collections tab, a collection's page, and
// "Choose collections…" on the play view. See openspec/specs/collections,
// collection-page and library-page. The tests share one account, and run on
// both projects at once, so every name carries a mark of its own.

test.use({ storageState: authFile });

const content = {
  format: "chordsheet",
  version: 1,
  sections: [{ lines: [{ text: "Stille Nacht, heilige Nacht", chords: [] }] }],
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

function nameDialog(page: Page, title: string) {
  return page.getByRole("dialog", { name: title });
}

async function openMenuItem(page: Page, item: string) {
  await page.getByRole("button", { name: "More for this collection" }).click();
  await page.getByRole("menuitem", { name: item }).click();
}

// Scenarios "Switching tabs", "Reload", "Making a collection", "Adding two
// sheets", "Removing", "Renaming", "Name in use" and "Deleting".
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
  await page
    .getByRole("navigation", { name: "Library" })
    .getByRole("link", { name: "Collections" })
    .click();
  await expect(page).toHaveURL("/collections");
  await expect(page).toHaveTitle("Collections | Sheet Library");
  await expect(page.getByRole("link", { name: "Collections" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("search")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("link", { name: "Collections" })).toHaveAttribute(
    "aria-current",
    "page",
  );

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

  // Adding both sheets with the picker's search.
  await page.getByRole("button", { name: "Add sheets" }).click();
  const picker = page.getByRole("dialog", { name: `Add sheets to “${name}”` });
  await picker.getByRole("searchbox", { name: "Search sheets" }).fill(mark);
  await picker.getByRole("checkbox", { name: stille }).check();
  await picker.getByRole("checkbox", { name: drue }).check();
  await picker.getByRole("button", { name: "Add 2 sheets" }).click();
  await expect(picker).toBeHidden();
  const rows = page.getByRole("listitem").getByRole("link");
  await expect(rows).toHaveText([drue, stille]);
  await expect(page.getByText("2 sheets", { exact: true })).toBeVisible();

  // Scenario "Already in the collection".
  await page.getByRole("button", { name: "Add sheets" }).click();
  await picker.getByRole("searchbox", { name: "Search sheets" }).fill(mark);
  await expect(picker.getByRole("checkbox", { name: stille })).toBeChecked();
  await expect(picker.getByRole("checkbox", { name: stille })).toBeDisabled();
  await picker.getByRole("button", { name: "Cancel" }).click();
  await expect(picker).toBeHidden();

  // Removing keeps the sheet in the library.
  await page
    .getByRole("button", { name: `Remove ${stille} from ${name}` })
    .click();
  await expect(rows).toHaveText([drue]);
  await page.reload();
  await expect(rows).toHaveText([drue]);
  await expect(page.getByText("1 sheet", { exact: true })).toBeVisible();

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

  // Deleting opens the Collections tab, and the sheets stay.
  await openMenuItem(page, "Delete");
  const confirm = page.getByRole("alertdialog", {
    name: `Delete “Weihnachten ${mark}”?`,
  });
  await expect(confirm).toContainText("Its sheets stay in the library.");
  await confirm.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL("/collections");
  await expect(page.getByRole("link", { name: other })).toBeVisible();
  await expect(page.getByText(`Weihnachten ${mark}`)).toHaveCount(0);
  await page.goto(`/sheets?q=${mark}`);
  await expect(page.getByText("2 sheets", { exact: true })).toBeVisible();
});

// Scenario "Back to the collections" and "Someone else's collection".
test("goes back to Collections, and doesn't find an unknown collection", async ({
  page,
}) => {
  const id = await createCollection(page, `Learning ${newMark()}`);
  await page.goto(`/collections/${id}`);
  await page.getByRole("link", { name: "Collections" }).click();
  await expect(page).toHaveURL("/collections");
  const response = await page.goto("/collections/nosuchcollect");
  expect(response?.status()).toBe(404);
  await expect(heading(page)).toHaveText("Collection not found");
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
  await expect(page.getByRole("listitem").getByRole("link")).toHaveText([
    title,
  ]);
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
