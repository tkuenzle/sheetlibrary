import { expect, test } from "@playwright/test";

// The home page for visitors. See openspec/specs/home-page.

test("home page says what the app is for", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Sheet Library");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Every song you play, in one place",
  );
  const main = page.getByRole("main");
  await expect(main.getByRole("listitem")).toHaveText([
    "Add sheets from photos or from Ultimate Guitar",
    "Save a key for each singer",
    "Group sheets in collections",
  ]);
  await expect(main).not.toContainText("Coming soon");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Sheet Library" }),
  ).toBeVisible();
});

test("signs in from the home page", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("main").getByRole("link", { name: "Sign in" });
  // Bigger than a normal button, also when the build orders the CSS.
  expect((await link.boundingBox())?.height).toBe(56);
  await link.click();
  await expect(page).toHaveURL("/sign-in");
});

test("tries it first in the chord editor", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Try it first" }).click();
  await expect(page).toHaveURL("/editor");
  await expect(page).toHaveTitle("Amazing Grace | Sheet Library");
});

test("shows the sample to screen readers", async ({ page }) => {
  await page.goto("/");
  const sample = page.getByRole("region", { name: "Sample sheet" });
  await expect(
    sample.getByRole("heading", { name: "Amazing Grace" }),
  ).toBeVisible();
  await expect(sample).toContainText("John Newton");
  await expect(sample.locator(".sheet-view-label")).toHaveText("Verse 1");
  await expect(sample.locator(".sheet-view-line")).toHaveCount(4);
  await expect(page.getByRole("main")).toContainText(
    "A sample sheet. Try changing the key.",
  );
  const read = await sample.ariaSnapshot();
  expect(read).toContain("wretch");
  expect(read).toContain("Key G");
  expect(read).toContain("Capo");
});

test("transposes the sample without changing the address", async ({ page }) => {
  await page.goto("/");
  const sample = page.getByRole("region", { name: "Sample sheet" });
  const chords = sample.locator(".sheet-view-chord");
  await expect(chords.first()).toHaveText("G");

  await sample.getByRole("button", { name: "Key G" }).click();
  // Only to show the sheet in another key: nothing to change.
  await expect(
    page.getByRole("button", { name: "Change the song key" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "A", exact: true }).click();

  await expect(
    sample.getByRole("button", { name: "Key A, 2 semitones up" }),
  ).toContainText("Key A · +2");
  await expect(chords.first()).toHaveText("A");
  await expect(page).toHaveURL("/");

  await page.reload();
  await expect(chords.first()).toHaveText("G");
  await expect(sample.getByRole("button", { name: "Key G" })).toBeVisible();
});

test("puts a capo on the sample without changing the address", async ({
  page,
}) => {
  await page.goto("/");
  const sample = page.getByRole("region", { name: "Sample sheet" });
  await sample.getByRole("button", { name: "Capo" }).click();
  await page.getByRole("button", { name: /^Capo 2, F shapes/ }).click();
  // The list may still be closing, so only the button that opens it.
  await expect(sample.locator(".capo-button-toggle")).toHaveAccessibleName(
    "Capo 2, F shapes",
  );
  await expect(sample.locator(".sheet-view-chord").first()).toHaveText("F");
  await expect(page).toHaveURL("/");
});

test("places the sample beside the text, or before the list in one column", async ({
  page,
}) => {
  await page.goto("/");
  const sample = await page
    .getByRole("region", { name: "Sample sheet" })
    .boundingBox();
  const intro = await page.getByRole("heading", { level: 1 }).boundingBox();
  const list = await page.getByRole("main").getByRole("list").boundingBox();
  if (!sample || !intro || !list) throw new Error("Not on the page");

  const width = page.viewportSize()?.width ?? 0;
  if (width < 1024) {
    expect(sample.y).toBeGreaterThan(intro.y + intro.height);
    expect(list.y).toBeGreaterThan(sample.y + sample.height);
  } else {
    expect(sample.x).toBeGreaterThan(intro.x + intro.width);
    expect(list.x).toBe(intro.x);
  }
});
