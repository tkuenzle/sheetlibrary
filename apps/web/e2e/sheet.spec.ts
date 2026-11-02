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

async function createSheet(page: Page): Promise<string> {
  const response = await page.request.post("/api/sheets", {
    data: { title: "Amazing Grace", content },
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

// Scenarios "Reload after editing" and "Leaving after the save".
test("saves edits on its own, and a reload shows them", async ({ page }) => {
  await openSheet(page, await createSheet(page));
  await typeAtEnd(page, " again");
  await expect(status(page)).toHaveText("Saving…");
  await expect(status(page)).toHaveText("Saved");
  const seen = prompts(page, true);
  await page.reload();
  await expect(firstLine(page)).toHaveText(
    "Amazing grace, how sweet the sound again",
  );
  expect(seen).toEqual([]);
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
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Sheet Library" })
    .click();
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
