import { expect, type Locator, type Page, test } from "@playwright/test";

import { authFile } from "./servers";

// The play view of a stored sheet, at /sheets/:id. See
// openspec/specs/play-page.

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
          chords: [
            { at: 0, root: "G" },
            { at: 8, root: "G", suffix: "7" },
            { at: 19, root: "C" },
          ],
        },
        {
          text: "I love you",
          chords: [
            { at: 0, root: "E", suffix: "m7" },
            { at: 2, root: "G" },
          ],
        },
      ],
    },
  ],
};

async function createSheet(page: Page, title: string): Promise<string> {
  const response = await page.request.post("/api/sheets", {
    data: { title, content },
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

function chords(page: Page) {
  return page.locator(".sheet-view-chord");
}

// Fails when two chord names on the page overlap.
async function expectNoOverlap(page: Page) {
  const boxes = await chords(page).evaluateAll((elements) =>
    elements.map((element) => {
      const { left, right, top, bottom } = element.getBoundingClientRect();
      return { left, right, top, bottom };
    }),
  );
  for (const [i, a] of boxes.entries()) {
    for (const b of boxes.slice(i + 1)) {
      const apart =
        a.right <= b.left ||
        b.right <= a.left ||
        a.bottom <= b.top ||
        b.bottom <= a.top;
      expect(apart).toBe(true);
    }
  }
}

// Scenario "Opening a sheet" (library-page).
test("a row in the library opens the play view", async ({ page }) => {
  const title = `Play ${crypto.randomUUID().slice(0, 8)}`;
  const id = await createSheet(page, title);
  await page.goto("/sheets");
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page).toHaveURL(`/sheets/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(chords(page)).toHaveText(["G", "G7", "C", "Em7", "G"]);
  await expect(page.locator(".ProseMirror")).toHaveCount(0);
});

// Scenarios "Transposing to play" and "Picking a capo".
test("transposes and sets a capo without a page load", async ({ page }) => {
  const id = await createSheet(page, "Amazing Grace");
  await page.goto(`/sheets/${id}`);
  await expect(chords(page)).toHaveText(["G", "G7", "C", "Em7", "G"]);

  // A page load would lose the mark, and a request would be listed.
  await page.evaluate(() => {
    (window as unknown as { stayed: boolean }).stayed = true;
  });
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.getByRole("button", { name: /^Key / }).click();
  const keyPanel = page.getByRole("dialog", { name: "Key" });
  await expect(keyPanel.getByText("Change")).toHaveCount(0);
  await keyPanel.getByRole("button", { name: "A", exact: true }).click();
  await expect(chords(page)).toHaveText(["A", "A7", "D", "F#m7", "A"]);
  await expect(keyPanel.getByText(/the song key/)).toHaveCount(0);
  await expect(page).toHaveURL(/\?key=A$/);
  await expectNoOverlap(page);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /^Capo/ }).click();
  await page
    .getByRole("dialog", { name: "Capo" })
    .getByRole("button", { name: "Capo 2, G shapes" })
    .click();
  await expect(chords(page)).toHaveText(["G", "G7", "C", "Em7", "G"]);
  await expect(page).toHaveURL(/\?key=A&capo=2$/);
  await expectNoOverlap(page);

  expect(
    await page.evaluate(
      () => (window as unknown as { stayed?: boolean }).stayed,
    ),
  ).toBe(true);
  expect(requests).toEqual([]);

  // A reload keeps the key and the capo, and nothing was saved.
  await page.reload();
  await expect(page.getByRole("button", { name: /^Key / })).toHaveText(
    "Key A · +2",
  );
  await expect(page.getByRole("button", { name: /^Capo/ })).toHaveText(
    "Capo 2",
  );
  const stored = await page.request.get(`/api/sheets/${id}`);
  expect(JSON.stringify(await stored.json())).toContain(
    '"root":"G","suffix":"7"',
  );
});

// Scenario "Someone else's sheet".
test("says when the sheet isn't found", async ({ page }) => {
  const response = await page.goto("/sheets/AAAAAAAAAAAA");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sheet not found",
  );
});

// Scenarios "From playing to editing" and "Back to playing" (site-layout).
test("switches to the editor and back, keeping the key and capo", async ({
  page,
}) => {
  const id = await createSheet(page, "Amazing Grace");
  await page.goto(`/sheets/${id}?key=A&capo=2`);
  const bar = page.getByRole("banner");
  await expect(bar.getByRole("link", { name: "Play" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await bar.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(`/sheets/${id}/edit?key=A&capo=2`);
  await expect(bar.getByRole("link", { name: "Edit" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("button", { name: /^Key / })).toHaveText(
    "Key A · +2",
  );
  await expect(page.getByRole("button", { name: /^Capo/ })).toHaveText(
    "Capo 2",
  );

  // A rename, saved, shows in the play view.
  await page.getByRole("button", { name: "Amazing Grace" }).click();
  await page.keyboard.type("Grace");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Saved");
  await bar.getByRole("link", { name: "Play" }).click();
  await expect(page).toHaveURL(`/sheets/${id}?key=A&capo=2`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Grace");
  await expect(chords(page)).toHaveText(["G", "G7", "C", "Em7", "G"]);
});

// Picks "Smaller text", "Larger text" or "Print": in the top bar, or on a
// phone in the menu.
async function pickAction(
  page: Page,
  name: "Smaller text" | "Larger text" | "Print",
) {
  const more = page.getByRole("button", { name: "More" });
  if (await more.isVisible()) {
    await more.click();
    await page.getByRole("menuitem", { name }).click();
  } else {
    await page.getByRole("button", { name }).click();
  }
}

function lyricsSize(page: Page) {
  return page
    .locator(".sheet-view")
    .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
}

// Scenario "Larger on this device".
test("keeps a larger text size on this device", async ({ page }) => {
  const first = await createSheet(page, "Amazing Grace");
  const second = await createSheet(page, "Shenandoah");
  await page.goto(`/sheets/${first}`);
  const start = await lyricsSize(page);
  await pickAction(page, "Larger text");
  await pickAction(page, "Larger text");
  expect(await lyricsSize(page)).toBeCloseTo(start * 1.3, 1);
  await expectNoOverlap(page);

  // The server renders the other sheet at that size, so nothing moves after
  // load.
  const html = await (await page.request.get(`/sheets/${second}`)).text();
  expect(html).toContain("calc(var(--play-text-base) * 1.3)");
  await page.goto(`/sheets/${second}`);
  expect(await lyricsSize(page)).toBeCloseTo(start * 1.3, 1);

  // At the largest size, "Larger text" is disabled.
  await pickAction(page, "Larger text");
  const more = page.getByRole("button", { name: "More" });
  if (await more.isVisible()) {
    await more.click();
    await expect(
      page.getByRole("menuitem", { name: "Larger text" }),
    ).toBeDisabled();
  } else {
    await expect(
      page.getByRole("button", { name: "Larger text" }),
    ).toBeDisabled();
  }
});

// Opens the browser's print with "Print", and tells whether it did.
async function printOpens(page: Page): Promise<boolean> {
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printed = "yes";
    };
  });
  await pickAction(page, "Print");
  return (await page.locator("body").getAttribute("data-printed")) === "yes";
}

// Scenario "Printing in another key".
test("prints the sheet as shown, without the controls", async ({ page }) => {
  const id = await createSheet(page, "Amazing Grace");
  await page.goto(`/sheets/${id}?key=A`);
  expect(await printOpens(page)).toBe(true);

  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("banner")).toBeHidden();
  for (const button of await page.getByRole("button").all()) {
    await expect(button).toBeHidden();
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Amazing Grace",
  );
  await expect(chords(page)).toHaveText(["A", "A7", "D", "F#m7", "A"]);

  const pdf = await page.pdf({ format: "A4" });
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
});

// Scenario "Printing from a phone".
test("puts the text size and Print in a menu on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const id = await createSheet(page, "Amazing Grace");
  await page.goto(`/sheets/${id}`);
  await expect(page.getByRole("button", { name: "Print" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Larger text" })).toBeHidden();
  expect(await printOpens(page)).toBe(true);

  // The menu sits after the key and the capo.
  const capo = await page.getByRole("button", { name: /^Capo/ }).boundingBox();
  const more = await page.getByRole("button", { name: "More" }).boundingBox();
  expect(more && capo && more.x > capo.x).toBe(true);

  const sideways = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(sideways).toBe(false);
});

// Picks "Lyrics only": in the top bar, or on a phone in the menu.
async function toggleLyrics(page: Page) {
  const more = page.getByRole("button", { name: "More" });
  if (await more.isVisible()) {
    await more.click();
    await page.getByRole("menuitemcheckbox", { name: "Lyrics only" }).click();
  } else {
    await page.getByRole("button", { name: "Lyrics only" }).click();
  }
}

// Scenarios "Turning chords off and on", "Address follows" and "Printing the
// lyrics".
test("shows the lyrics only without a page load, as the address keeps", async ({
  page,
}) => {
  const id = await createSheet(page, "Amazing Grace");
  await page.goto(`/sheets/${id}?key=A`);
  await page.evaluate(() => {
    (window as unknown as { stayed: boolean }).stayed = true;
  });

  await toggleLyrics(page);
  await expect(page.locator(".sheet-view.is-lyrics-only")).toBeVisible();
  await expect(chords(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Key / })).toHaveCount(0);
  await expect(
    page.getByText("Amazing grace, how sweet the sound"),
  ).toBeVisible();
  await expect(page).toHaveURL(/\?key=A&lyrics$/);
  expect(
    await page.evaluate(
      () => (window as unknown as { stayed?: boolean }).stayed,
    ),
  ).toBe(true);

  // Printed, the lyrics stay without chords.
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("I love you")).toBeVisible();
  await expect(chords(page)).toHaveCount(0);
  await page.emulateMedia({ media: "screen" });

  // A reload keeps it, and the chords come back in A.
  await page.reload();
  await expect(chords(page)).toHaveCount(0);
  await toggleLyrics(page);
  await expect(chords(page)).toHaveText(["A", "A7", "D", "F#m7", "A"]);
  await expect(page.getByRole("button", { name: /^Key / })).toHaveText(
    "Key A · +2",
  );
  await expect(page).toHaveURL(/\?key=A$/);
});

// Scenario "On a phone".
test("puts Lyrics only first in the menu on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const id = await createSheet(page, "Amazing Grace");
  await page.goto(`/sheets/${id}`);
  await expect(page.getByRole("button", { name: "Lyrics only" })).toBeHidden();
  const label = page.locator(".play-lyrics-label");
  await expect(label).toHaveCount(0);

  await page.getByRole("button", { name: "More" }).click();
  const menu = page.getByRole("menu", { name: "More" });
  const item = menu.getByRole("menuitemcheckbox", { name: "Lyrics only" });
  await expect(menu.locator(".menu-item").first()).toHaveText("Lyrics only");
  await expect(item).toHaveAttribute("aria-checked", "false");
  await item.click();

  await expect(chords(page)).toHaveCount(0);
  await expect(label).toHaveText("Lyrics only");
  await expect(label).toBeVisible();
  await page.getByRole("button", { name: "More" }).click();
  await expect(item).toHaveAttribute("aria-checked", "true");

  const sideways = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(sideways).toBe(false);
});

// Versions: a name and a key. See openspec/specs/play-page and
// openspec/specs/sheet-versions.

async function createVersion(
  page: Page,
  sheetId: string,
  name: string,
  key: string,
): Promise<string> {
  const response = await page.request.post(`/api/sheets/${sheetId}/versions`, {
    data: { name, key },
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

async function openKeyPanel(page: Page) {
  await page.getByRole("button", { name: /^Key / }).click();
  return page.getByRole("dialog", { name: "Key" });
}

function artist(page: Page) {
  return page.locator(".play-artist");
}

// A row of the list of versions, without its menu button.
function row(panel: Locator, name: string) {
  return panel.locator(".versions-pick", { hasText: name });
}

// Scenarios "No versions yet", "Saving with a name" and "Link to a version".
test("saves the first version from the song key's menu", async ({ page }) => {
  const id = await createSheet(page, "Amazing Grace");
  await page.goto(`/sheets/${id}?key=A`);

  const panel = await openKeyPanel(page);
  await expect(panel.getByRole("heading", { name: "Song key" })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Versions" })).toHaveCount(0);
  await panel.getByRole("button", { name: "Song key: more" }).click();
  await page.getByRole("menuitem", { name: "Save A as a version…" }).click();

  const dialog = page.getByRole("dialog", { name: "Save as a version" });
  const name = dialog.getByRole("textbox", { name: "Name" });
  await expect(name).toHaveValue("Key A");
  await name.fill("Anna's key");
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();

  await expect(artist(page)).toHaveText("Anna's key");
  await expect(page).toHaveURL(/\?version=[\w-]{12}$/);
  await expect(page.getByRole("button", { name: /^Key / })).toHaveText("Key A");

  // Its address opens it again, in its key.
  await page.reload();
  await expect(chords(page)).toHaveText(["A", "A7", "D", "F#m7", "A"]);
  await expect(artist(page)).toHaveText("Anna's key");
  const list = await openKeyPanel(page);
  await expect(row(list, "Anna's key")).toHaveAttribute("aria-current", "true");
});

// Scenarios "Trying another key", "Anna sings higher", "Renaming",
// "Deleting" and "Bookmark after deleting".
test("changes, renames and deletes a version", async ({ page }) => {
  const id = await createSheet(page, "Amazing Grace");
  const anna = await createVersion(page, id, "Anna's key", "A");
  await page.goto(`/sheets/${id}?version=${anna}`);
  await expect(chords(page)).toHaveText(["A", "A7", "D", "F#m7", "A"]);

  // Another key keeps the version open, and "Back" goes to its key.
  let panel = await openKeyPanel(page);
  await panel.getByRole("button", { name: "B flat", exact: true }).click();
  await expect(chords(page)).toHaveText(["Bb", "Bb7", "Eb", "Gm7", "Bb"]);
  await expect(page).toHaveURL(`/sheets/${id}?version=${anna}&key=Bb`);
  await expect(artist(page)).toHaveText("Anna's key");
  await panel.getByRole("button", { name: "Back to A" }).click();
  await expect(chords(page)).toHaveText(["A", "A7", "D", "F#m7", "A"]);
  await expect(page).toHaveURL(`/sheets/${id}?version=${anna}`);

  // In its own key, the menu only renames and deletes.
  await panel.getByRole("button", { name: "Anna's key: more" }).click();
  await expect(page.getByRole("menuitem")).toHaveText(["Rename…", "Delete…"]);
  await page.keyboard.press("Escape");
  await expect(panel).toBeVisible();

  // Making Bb its key stores it.
  await panel.getByRole("button", { name: "B flat", exact: true }).click();
  await panel.getByRole("button", { name: "Anna's key: more" }).click();
  await page.getByRole("menuitem", { name: "Make Bb Anna's key" }).click();
  await expect(page).toHaveURL(`/sheets/${id}?version=${anna}`);
  await expect(row(panel, "Anna's key")).toHaveText(/Bb$/);
  await page.reload();
  await expect(chords(page)).toHaveText(["Bb", "Bb7", "Eb", "Gm7", "Bb"]);

  // Renaming.
  panel = await openKeyPanel(page);
  await panel.getByRole("button", { name: "Anna's key: more" }).click();
  await page.getByRole("menuitem", { name: "Rename…" }).click();
  const dialog = page.getByRole("dialog", { name: "Rename version" });
  await expect(dialog.getByRole("textbox", { name: "Name" })).toHaveValue(
    "Anna's key",
  );
  await dialog.getByRole("textbox", { name: "Name" }).fill("Anna");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(artist(page)).toHaveText("Anna");

  // Deleting keeps the sheet in the key it was shown in.
  panel = await openKeyPanel(page);
  await panel.getByRole("button", { name: "Anna: more" }).click();
  await page.getByRole("menuitem", { name: "Delete…" }).click();
  const confirm = page.getByRole("alertdialog", { name: "Delete “Anna”?" });
  await expect(confirm).toContainText("The sheet stays as it is.");
  await confirm.getByRole("button", { name: "Delete" }).click();
  await expect(confirm).toBeHidden();
  await expect(chords(page)).toHaveText(["Bb", "Bb7", "Eb", "Gm7", "Bb"]);
  await expect(artist(page)).toHaveCount(0);
  await expect(page).toHaveURL(`/sheets/${id}?key=Bb`);

  // The old bookmark opens the sheet in its song key.
  await page.goto(`/sheets/${id}?version=${anna}&key=Bb`);
  await expect(page).toHaveURL(`/sheets/${id}`);
  await expect(chords(page)).toHaveText(["G", "G7", "C", "Em7", "G"]);
});

// Scenarios "Two versions" and "Switching versions".
test("lists the versions and switches between them", async ({ page }) => {
  const id = await createSheet(page, "Amazing Grace");
  await createVersion(page, id, "Anna's key", "A");
  const band = await createVersion(page, id, "Sunday band", "Bb");
  await createVersion(page, id, "Youth choir", "F");
  await page.goto(`/sheets/${id}`);
  await page.evaluate(() => {
    (window as unknown as { stayed: boolean }).stayed = true;
  });

  const panel = await openKeyPanel(page);
  const rows = panel.locator(".versions-pick");
  await expect(rows).toHaveText([
    /^Song key.*G$/,
    /^Anna's key\s*A$/,
    /^Sunday band\s*Bb$/,
    /^Youth choir\s*F$/,
  ]);
  await expect(rows.first()).toHaveAttribute("aria-current", "true");
  await expect(
    panel.getByRole("button", { name: "Save G as a version…" }),
  ).toBeVisible();

  await row(panel, "Sunday band").click();
  await expect(chords(page)).toHaveText(["Bb", "Bb7", "Eb", "Gm7", "Bb"]);
  await expect(artist(page)).toHaveText("Sunday band");
  await expect(page).toHaveURL(`/sheets/${id}?version=${band}`);

  await row(panel, "Song key").click();
  await expect(chords(page)).toHaveText(["G", "G7", "C", "Em7", "G"]);
  await expect(artist(page)).toHaveCount(0);
  await expect(page).toHaveURL(`/sheets/${id}`);
  expect(
    await page.evaluate(
      () => (window as unknown as { stayed?: boolean }).stayed,
    ),
  ).toBe(true);

  // On a phone, the panel with three versions fits on the screen.
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  const sheet = await openKeyPanel(page);
  for (const name of ["Versions", "Transpose to"]) {
    await expect(sheet.getByRole("heading", { name })).toBeInViewport();
  }
  for (const name of ["Save G as a version…", "Back to G"]) {
    await expect(sheet.getByRole("button", { name })).toBeInViewport({
      ratio: 1,
    });
  }
});

test("keeps the dialog open when a version can't be saved", async ({
  page,
}) => {
  const id = await createSheet(page, "Amazing Grace");
  await page.goto(`/sheets/${id}`);
  await page.route("**/versions", (route) => route.abort());
  const panel = await openKeyPanel(page);
  await panel.getByRole("button", { name: "Song key: more" }).click();
  await page.getByRole("menuitem", { name: "Save G as a version…" }).click();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Save as a version" });
  await expect(dialog).toContainText("couldn’t be saved");
  await expect(dialog.getByRole("textbox", { name: "Name" })).toHaveValue(
    "Key G",
  );
});
