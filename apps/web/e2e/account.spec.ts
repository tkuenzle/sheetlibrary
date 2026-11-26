import { expect, newMark, test } from "./fixtures";

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

// Scenario "Sign-in page" (site-layout).
test("the sign-in page has no top bar, and its name links home", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("banner")).toHaveCount(0);
  await page.getByRole("link", { name: "Sheet Library" }).click();
  await expect(page).toHaveURL("/");
});

test.describe("passkeys on the account page", () => {
  test.use({ signedIn: true });

  // Requirement "Account page": adding, renaming and removing a passkey, and
  // the list follows each change by itself. Chromium's virtual
  // authenticator stands in for the device.
  test("adds, renames and removes a passkey", async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("WebAuthn.enable");
    await cdp.send("WebAuthn.addVirtualAuthenticator", {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });
    const mark = newMark();
    const renames = page.getByRole("button", { name: /^Rename / });
    await page.goto("/account");
    await expect(
      page.getByRole("heading", { name: "Passkeys", level: 2 }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");
    const before = await renames.count();

    await page.getByRole("button", { name: "Add passkey" }).click();
    await expect(renames).toHaveCount(before + 1);
    await expect(page.getByText("No passkey was added.")).toHaveCount(0);

    // Accounts are shared, so other passkeys may carry the default name too.
    await page.getByRole("button", { name: "Rename Passkey" }).first().click();
    await page.getByRole("textbox", { name: "Name" }).fill(`Laptop ${mark}`);
    await page.getByRole("button", { name: "Save" }).click();
    const laptop = page.getByRole("button", { name: `Remove Laptop ${mark}` });
    await expect(laptop).toBeVisible();

    await laptop.click();
    await expect(laptop).toHaveCount(0);
    await expect(renames).toHaveCount(before);
  });
});
