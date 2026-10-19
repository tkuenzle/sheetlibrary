import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Sheet Library");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sheet Library",
  );
});

test("home page links to the chord editor prototype", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Try the chord editor prototype" })
    .click();
  await expect(page).toHaveTitle("Editor spike | Sheet Library");
});
