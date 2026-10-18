import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Sheet Library");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sheet Library",
  );
});
