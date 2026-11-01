import { expect, test } from "@playwright/test";

test("the account page sends visitors who aren't signed in to sign-in", async ({
  page,
}) => {
  await page.goto("/account");
  await expect(page).toHaveURL("/sign-in");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in");
});

test("the sign-in page offers a passkey and an email link", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await expect(
    page.getByRole("button", { name: "Sign in with a passkey" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send link" })).toBeVisible();
});
