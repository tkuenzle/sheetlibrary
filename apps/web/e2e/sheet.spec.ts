import { expect, type Page, test } from "@playwright/test";

import { authFile } from "./servers";

// The page for a stored sheet. Sheets are made through the API, since the
// library page comes later (#51).

test.use({ storageState: authFile });

const content = {
  format: "chordsheet",
  version: 1,
  sections: [
    {
      label: "Verse 1",
      lines: [
        {
          text: "Amazing grace, how sweet the sound",
          chords: [{ at: 0, root: "G" }],
        },
      ],
    },
  ],
};

async function createSheet(page: Page, artist?: string): Promise<string> {
  const response = await page.request.post("/api/sheets", {
    data: { title: "Amazing Grace", artist, content },
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

async function openSheet(page: Page, id: string) {
  await page.goto(`/sheets/${id}`);
  await expect(page.locator(".chord-label")).toHaveCount(1);
}

function firstLine(page: Page) {
  return page.locator(".ProseMirror .line").first();
}

function status(page: Page) {
  return page.getByRole("status");
}

async function typeAtEnd(page: Page, text: string) {
  const line = firstLine(page);
  const box = await line.boundingBox();
  if (!box) throw new Error("no box");
  await line.click({ position: { x: box.width - 2, y: box.height / 2 } });
  await page.keyboard.type(text);
}

// Records the browser's prompts before leaving, answering each with `leave`.
function prompts(page: Page, leave: boolean) {
  const seen: string[] = [];
  page.on("dialog", (dialog) => {
    seen.push(dialog.type());
    void (leave ? dialog.accept() : dialog.dismiss());
  });
  return seen;
}

test("shows the sheet with its title", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  await expect(page).toHaveTitle("Amazing Grace | Sheet Library");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Amazing Grace",
  );
  await expect(status(page)).toHaveText("Saved");
});

// Scenarios "Reload after editing", "Leaving after the save" and "Typing".
test("saves edits on its own, and a reload shows them", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  await typeAtEnd(page, " again");
  await expect(status(page)).toHaveText("");
  await expect(status(page)).toHaveText("Saved");
  const seen = prompts(page, true);
  await page.reload();
  await expect(firstLine(page)).toHaveText(
    "Amazing grace, how sweet the sound again",
  );
  expect(seen).toEqual([]);
});

test("saves a set key, and a reload shows it", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  const keyButton = page.getByRole("button", { name: /^Key / });
  await expect(keyButton).toHaveText("Key G");
  await keyButton.click();
  const songKey = page
    .getByRole("dialog", { name: "Key" })
    .getByRole("region", { name: "Song key" });
  await page.getByRole("button", { name: "Change the song key" }).click();
  await songKey.getByRole("button", { name: "E minor" }).click();
  await expect(keyButton).toHaveText("Key Em");
  await expect(status(page)).toHaveText("Saved");
  await page.reload();
  await expect(keyButton).toHaveText("Key Em");
  await keyButton.click();
  await expect(songKey).toContainText("Em");
  await expect(songKey).not.toContainText("Guessed");
});

function keyPanel(page: Page) {
  return page.getByRole("dialog", { name: "Key" });
}

// Scenario "Transpose isn't saved".
test("doesn't save a transpose", async ({ page }) => {
  const id = await createSheet(page);
  await openSheet(page, id);
  const keyButton = page.getByRole("button", { name: /^Key / });
  await keyButton.click();
  await keyPanel(page).getByRole("button", { name: "A", exact: true }).click();
  await expect(page.locator(".chord-label")).toHaveText(["A"]);
  await expect(page).toHaveURL(/\?key=A$/);
  await expect(status(page)).toHaveText("Saved");
  const stored = await page.request.get(`/api/sheets/${id}`);
  expect(JSON.stringify(await stored.json())).toContain('"root":"G"');
  await openSheet(page, id);
  await expect(keyButton).toHaveText("Key G");
});

// Scenario "Capo isn't saved".
test("doesn't save a capo", async ({ page }) => {
  const id = await createSheet(page);
  await openSheet(page, id);
  const capoButton = page.getByRole("button", { name: /^Capo/ });
  await capoButton.click();
  await page
    .getByRole("dialog", { name: "Capo" })
    .getByRole("button", { name: "Capo 2, F shapes" })
    .click();
  await expect(page.locator(".chord-label")).toHaveText(["F"]);
  await expect(page).toHaveURL(/\?capo=2$/);
  await expect(status(page)).toHaveText("Saved");
  const stored = await page.request.get(`/api/sheets/${id}`);
  expect(JSON.stringify(await stored.json())).toContain('"root":"G"');
  await openSheet(page, id);
  await expect(capoButton).toHaveText("Capo");
  await expect(page.locator(".chord-label")).toHaveText(["G"]);
});

// Scenario "Reload after making the song key".
test("saves the shown key made the song key", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  const keyButton = page.getByRole("button", { name: /^Key / });
  await keyButton.click();
  await keyPanel(page).getByRole("button", { name: "A", exact: true }).click();
  await keyPanel(page)
    .getByRole("button", { name: "Make A the song key" })
    .click();
  await expect(page).not.toHaveURL(/key=/);
  await expect(status(page)).toHaveText("Saved");
  await page.reload();
  await expect(page.locator(".chord-label")).toHaveText(["A"]);
  await keyButton.click();
  await expect(keyPanel(page).locator(".key-panel-song-key")).toHaveText("A");
});

// Scenario "Slow save".
test("says Saving… while a save takes a while", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  await page.route("**/api/sheets/*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await typeAtEnd(page, " again");
  await expect(status(page)).toHaveText("Saving…");
  await expect(status(page)).toHaveText("Saved");
});

// Scenario "Offline".
test("keeps trying while saves don't get through", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  await page.route("**/api/sheets/*", (route) => route.abort());
  await typeAtEnd(page, " again");
  await expect(status(page)).toHaveText("Not saved yet. Trying again…");
  await page.unroute("**/api/sheets/*");
  await expect(status(page)).toHaveText("Saved", { timeout: 10_000 });
});

test("asks before leaving while edits aren't saved", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  await page.route("**/api/sheets/*", (route) => route.abort());
  await typeAtEnd(page, " again");
  await expect(status(page)).toHaveText("Not saved yet. Trying again…");
  const seen = prompts(page, false);
  await page.getByRole("banner").getByRole("link", { name: "Library" }).click();
  await expect.poll(() => seen).toEqual(["beforeunload"]);
  await expect(page).toHaveURL(/\/sheets\//);
});

// Scenario "Two tabs" (sheet-page).
test("stops saving when the sheet changed in another tab", async ({
  page,
  context,
}) => {
  const id = await createSheet(page);
  const other = await context.newPage();
  await openSheet(page, id);
  await openSheet(other, id);

  await typeAtEnd(page, " first");
  await expect(status(page)).toHaveText("Saved");

  await typeAtEnd(other, " second");
  await expect(
    other.getByText("This sheet changed in another tab. Reload to see it."),
  ).toBeVisible();
  await expect(status(other)).toHaveText("Not saved");
  // The other tab keeps its own edits on screen, and they can't change.
  await expect(firstLine(other)).toHaveText(
    "Amazing grace, how sweet the sound second",
  );
  await expect(other.locator(".ProseMirror")).toHaveAttribute(
    "contenteditable",
    "false",
  );

  // The first tab's edit is what's stored.
  const stored = await page.request.get(`/api/sheets/${id}`);
  expect(JSON.stringify(await stored.json())).toContain("sound first");

  // Scenario "Renaming after a conflict": the details can't change either.
  await expect(titleButton(other)).toBeDisabled();
  await expect(other.getByRole("button", { name: "Add artist" })).toHaveCount(
    0,
  );
  await menuButton(other).click();
  await expect(other.getByRole("menuitem", { name: "Rename" })).toBeDisabled();
  await other.keyboard.press("Escape");

  // Scenario "Transposing after a conflict".
  await other.getByRole("button", { name: /^Key / }).click();
  await keyPanel(other).getByRole("button", { name: "A", exact: true }).click();
  await expect(other.locator(".chord-label")).toHaveText(["A"]);
  await expect(
    keyPanel(other).getByRole("button", { name: "Change the song key" }),
  ).toBeDisabled();
  await expect(
    keyPanel(other).getByRole("button", { name: "Make A the song key" }),
  ).toBeDisabled();
});

function heading(page: Page) {
  return page.getByRole("heading", { level: 1 });
}

function titleButton(page: Page) {
  return heading(page).getByRole("button");
}

function menuButton(page: Page) {
  return page.getByRole("button", { name: "More for this sheet" });
}

// A title no other test uses, so the library can be checked for it.
function newTitle() {
  return `Grace ${crypto.randomUUID().slice(0, 8)}`;
}

// Scenarios "Renaming", "Reload after renaming" and "Adding an artist".
test("renames the sheet and adds an artist in place", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  const title = newTitle();

  await titleButton(page).click();
  const field = page.getByLabel("Title");
  await expect(field).toBeFocused();
  // The whole title is selected, so typing replaces it.
  await page.keyboard.type(title);
  await page.keyboard.press("Enter");
  await expect(heading(page)).toHaveText(title);
  await expect(page).toHaveTitle(`${title} | Sheet Library`);
  await expect(titleButton(page)).toBeFocused();

  await page.getByRole("button", { name: "Add artist" }).click();
  await page.keyboard.type("Chris Tomlin");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Chris Tomlin" }),
  ).toBeVisible();

  await expect(status(page)).toHaveText("Saved");
  await page.reload();
  await expect(heading(page)).toHaveText(title);
  await expect(
    page.getByRole("button", { name: "Chris Tomlin" }),
  ).toBeVisible();

  await page.goto("/sheets");
  const row = page.getByRole("link", { name: new RegExp(title) });
  await expect(row).toContainText("Chris Tomlin");
});

// Scenarios "Clearing the title" and "Removing the artist".
test("clears the title to Untitled and removes the artist", async ({
  page,
}) => {
  const id = await createSheet(page, "Chris Tomlin");
  await openSheet(page, id);

  await titleButton(page).click();
  await page.keyboard.press("Backspace");
  // A click elsewhere keeps the text.
  await page.locator("main").click({ position: { x: 4, y: 4 } });
  await expect(heading(page)).toHaveText("Untitled");

  await page.getByRole("button", { name: "Chris Tomlin" }).click();
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Add artist" })).toBeVisible();

  await expect(status(page)).toHaveText("Saved");
  const stored = (await (
    await page.request.get(`/api/sheets/${id}`)
  ).json()) as Record<string, unknown>;
  expect(stored.title).toBe("Untitled");
  expect(stored).not.toHaveProperty("artist");
});

test("Escape keeps the old title", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  await titleButton(page).click();
  await page.keyboard.type("Something else");
  await page.keyboard.press("Escape");
  await expect(heading(page)).toHaveText("Amazing Grace");
  await expect(titleButton(page)).toBeFocused();
  await expect(status(page)).toHaveText("Saved");
});

// Scenario "Rename from the menu".
test("the sheet's menu opens the title field", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  await menuButton(page).click();
  const rename = page.getByRole("menuitem", { name: "Rename" });
  await expect(rename).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Delete" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(rename).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(rename).toHaveCount(0);
  await expect(menuButton(page)).toBeFocused();

  // A click outside closes it too.
  await menuButton(page).click();
  await page.locator("main").click({ position: { x: 4, y: 4 } });
  await expect(rename).toHaveCount(0);

  await menuButton(page).click();
  await rename.click();
  await expect(page.getByLabel("Title")).toBeFocused();
  await expect(page.getByLabel("Title")).toHaveValue("Amazing Grace");
});

// Scenario "Undo after renaming".
test("undo in the editor leaves a rename alone", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  await typeAtEnd(page, " again");
  const title = newTitle();
  await titleButton(page).click();
  await page.keyboard.type(title);
  await page.keyboard.press("Enter");

  await firstLine(page).click();
  await page.keyboard.press("ControlOrMeta+z");
  await expect(firstLine(page)).toHaveText(
    "Amazing grace, how sweet the sound",
  );
  await expect(heading(page)).toHaveText(title);
});

// Scenario "Someone else's sheet": an id the person doesn't own answers as
// one that doesn't exist.
test("says when the sheet isn't found", async ({ page }) => {
  const response = await page.goto("/sheets/AAAAAAAAAAAA");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sheet not found",
  );
});

test.describe("not signed in", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // Scenario "Not signed in".
  test("sends visitors to sign-in", async ({ page }) => {
    await page.goto("/sheets/AAAAAAAAAAAA");
    await expect(page).toHaveURL("/sign-in");
  });

  test("refuses the API", async ({ page }) => {
    const response = await page.request.get("/api/sheets/AAAAAAAAAAAA");
    expect(response.status()).toBe(401);
  });
});

async function createTitled(page: Page, title: string): Promise<string> {
  const response = await page.request.post("/api/sheets", {
    data: { title, content },
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

async function openDelete(page: Page, title: string) {
  await menuButton(page).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("alertdialog", { name: `Delete “${title}”?` });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(
    "The sheet is gone for good. This can’t be undone.",
  );
  return dialog;
}

// Scenarios "Cancelling" and "Deleting".
test("deletes the sheet after asking, and goes to the library", async ({
  page,
}) => {
  const title = newTitle();
  const id = await createTitled(page, title);
  await openSheet(page, id);

  // Focus starts on Cancel. Escape cancels; a click on the scrim does nothing.
  let dialog = await openDelete(page, title);
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(menuButton(page)).toBeFocused();

  dialog = await openDelete(page, title);
  await page.mouse.click(4, 4);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(heading(page)).toHaveText(title);
  expect((await page.request.get(`/api/sheets/${id}`)).status()).toBe(200);

  // The dialog stays until the library is there, so the sheet doesn't show
  // again for a moment while the library loads.
  await page.route(/\.data(\?|$)/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fallback();
  });
  dialog = await openDelete(page, title);
  const deleted = page.waitForResponse(
    (response) => response.request().method() === "DELETE",
  );
  await dialog.getByRole("button", { name: "Delete" }).click();
  await deleted;
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled();
  await expect(page).toHaveURL("/sheets");
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(title) })).toHaveCount(
    0,
  );
  expect((await page.request.get(`/api/sheets/${id}`)).status()).toBe(404);
});

// Scenario "Offline" (deleting).
test("keeps the dialog open when the delete doesn't get through", async ({
  page,
}) => {
  const title = newTitle();
  const id = await createTitled(page, title);
  await openSheet(page, id);
  await page.route("**/api/sheets/*", (route) =>
    route.request().method() === "DELETE" ? route.abort() : route.fallback(),
  );

  const dialog = await openDelete(page, title);
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(dialog).toContainText(
    "The sheet couldn’t be deleted. Try again.",
  );
  await expect(page).toHaveURL(`/sheets/${id}`);

  await page.unroute("**/api/sheets/*");
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL("/sheets");
});

// Scenario "Deleted in another tab".
test("stops saving when the sheet was deleted in another tab", async ({
  page,
  context,
}) => {
  const title = newTitle();
  const id = await createTitled(page, title);
  const other = await context.newPage();
  await openSheet(page, id);
  await openSheet(other, id);

  const dialog = await openDelete(page, title);
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL("/sheets");

  await typeAtEnd(other, " again");
  await expect(other.getByText("This sheet was deleted.")).toBeVisible();
  await expect(status(other)).toHaveText("Not saved");
  // The edits stay on screen, and they can't change.
  await expect(firstLine(other)).toHaveText(
    "Amazing grace, how sweet the sound again",
  );
  await expect(other.locator(".ProseMirror")).toHaveAttribute(
    "contenteditable",
    "false",
  );
  await expect(titleButton(other)).toBeDisabled();
  await menuButton(other).click();
  await expect(other.getByRole("menuitem", { name: "Rename" })).toBeDisabled();
  await expect(other.getByRole("menuitem", { name: "Delete" })).toBeDisabled();
  await other.keyboard.press("Escape");

  // Leaving asks first, so the edits can be copied.
  const seen = prompts(other, true);
  await other.getByRole("link", { name: "Back to library" }).click();
  await expect.poll(() => seen).toEqual(["beforeunload"]);
  await expect(other).toHaveURL("/sheets");
});
