import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Sheet Library");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A library for your sheet music",
  );
  await expect(page.getByRole("main")).toContainText("Coming soon.");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Sheet Library" }),
  ).toBeVisible();
});

test("home page links to the chord editor", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Try the chord editor" }).click();
  await expect(page).toHaveURL("/editor");
  await expect(page).toHaveTitle("Amazing Grace | Sheet Library");
});

test("shows a sample sheet, hidden from screen readers", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("That saved a wretch like")).toBeVisible();
  const read = await page.getByRole("main").ariaSnapshot();
  expect(read).toContain("A library for your sheet music");
  expect(read).toContain("Try the chord editor");
  expect(read).not.toContain("wretch");
});
