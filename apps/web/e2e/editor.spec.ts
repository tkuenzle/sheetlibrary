import { expect, type Page, test } from "@playwright/test";

// The public editor page. The editor itself is tested on the harness
// (sheet-editor.spec.ts).

test.beforeEach(async ({ page }) => {
  await page.goto("/editor");
  await expect(page.locator(".chord-label").first()).toBeVisible();
});

function firstLine(page: Page) {
  return page.locator(".ProseMirror .line").first();
}

test("shows the seed song with its chords", async ({ page }) => {
  await expect(page).toHaveTitle("Chord editor | Sheet Library");
  await expect(firstLine(page)).toHaveText(
    "Amazing grace, how sweet the sound",
  );
  await expect(page.locator(".chord-label")).toHaveCount(24);
});

test("starts over after a reload", async ({ page }) => {
  // A click past the end of the text puts the caret at the end of the line.
  // End doesn't work on a phone when the docked toolbar is shown and the
  // page scrolls.
  const box = await firstLine(page).boundingBox();
  if (!box) throw new Error("The first line is not shown");
  await firstLine(page).click({
    position: { x: box.width - 2, y: box.height / 2 },
  });
  await page.keyboard.type(" again");
  await expect(firstLine(page)).toHaveText(
    "Amazing grace, how sweet the sound again",
  );
  await page.reload();
  await expect(firstLine(page)).toHaveText(
    "Amazing grace, how sweet the sound",
  );
});

test("says it is a prototype and nothing is saved", async ({ page }) => {
  await expect(page.getByText("This is a prototype.")).toContainText(
    "Nothing is saved",
  );
});

test("asks search engines not to index it", async ({ page }) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex",
  );
});
