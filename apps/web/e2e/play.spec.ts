import { expect, type Page, test } from "@playwright/test";

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
