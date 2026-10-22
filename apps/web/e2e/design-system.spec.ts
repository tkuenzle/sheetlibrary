import { expect, type Page, test } from "@playwright/test";

// The look shared by all pages. See openspec/specs/design-system.

const pages = ["/", "/editor"];

function pageBackground(page: Page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

for (const path of pages) {
  test(`${path} loads fonts and icons from its own origin`, async ({
    page,
    baseURL,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (["font", "image"].includes(request.resourceType())) {
        requests.push(request.url());
      }
    });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);

    expect(requests.length).toBeGreaterThan(0);
    for (const url of requests) {
      expect(new URL(url).origin).toBe(baseURL);
    }
    const loaded = await page.evaluate(() =>
      [...document.fonts].some(
        (font) =>
          font.family.includes("Schibsted Grotesk") && font.status === "loaded",
      ),
    );
    expect(loaded).toBe(true);
  });

  test(`${path} uses the light style on a light system`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(path);
    expect(await pageBackground(page)).toBe("rgb(235, 240, 235)");
  });

  test(`${path} uses the lamplight style on a dark system`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(path);
    expect(await pageBackground(page)).toBe("rgb(16, 21, 17)");
  });
}

test("/design is not in the production build", async ({ page }) => {
  const response = await page.goto("/design");
  expect(response?.status()).toBe(404);
});
