import { expect, type Page, test } from "@playwright/test";

import { devURL } from "./servers";

// The design page and the base components on it. It only exists in previews
// and the dev server. See openspec/specs/design-system.
test.use({ baseURL: devURL });

test.beforeEach(async ({ page }) => {
  // The dev server loads many modules. Until React has hydrated the page, the
  // buttons don't react yet.
  await page.goto("/design", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Design");
});

// The light style's "Move section up" in the vertical toolbar, and its
// tooltip.
function sectionToolbar(page: Page) {
  return page
    .locator('[data-theme="light"]')
    .getByRole("toolbar", { name: "Section", exact: true });
}

function moveUp(page: Page) {
  return sectionToolbar(page).getByRole("button", { name: "Move section up" });
}

function tooltipOf(page: Page) {
  return sectionToolbar(page)
    .locator(".tooltip-anchor", {
      has: page.getByRole("button", { name: "Move section up" }),
    })
    .locator(".tooltip");
}

test("shows both styles and asks search engines not to index it", async ({
  page,
}) => {
  await expect(page.locator('[data-theme="light"]')).toBeVisible();
  await expect(page.locator('[data-theme="lamplight"]')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex",
  );
  const background = (theme: string) =>
    page
      .locator(`[data-theme="${theme}"]`)
      .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(await background("light")).toBe("rgb(235, 240, 235)");
  expect(await background("lamplight")).toBe("rgb(16, 21, 17)");
});

test.describe("tooltips", () => {
  test("shows a tooltip after a moment on hover", async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, "No hover on touch");
    await moveUp(page).hover();
    await expect(tooltipOf(page)).toBeHidden();
    await expect(tooltipOf(page)).toBeVisible();
    await expect(tooltipOf(page)).toHaveText("Move section up");
    await page.mouse.move(0, 0);
    await expect(tooltipOf(page)).toBeHidden();
  });

  test("shows a tooltip right away on keyboard focus", async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, "No keyboard focus on touch");
    await page.keyboard.press("Tab");
    await moveUp(page).focus();
    await expect(tooltipOf(page)).toBeVisible({ timeout: 300 });
    await page.keyboard.press("Tab");
    await expect(tooltipOf(page)).toBeHidden();
  });

  test("hides the tooltip on Escape", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "No hover on touch");
    await moveUp(page).hover();
    await expect(tooltipOf(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltipOf(page)).toBeHidden();
  });

  test("never shows a tooltip on touch", async ({ page, hasTouch }) => {
    test.skip(!hasTouch, "Touch only");
    await moveUp(page).tap();
    await page.waitForTimeout(800);
    await expect(tooltipOf(page)).toBeHidden();
  });
});

test("components keep an outline in forced colors mode", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  const outlines = await page
    .locator('[data-theme="light"]')
    .evaluate((style) =>
      [".button", ".icon-button", ".toolbar", ".popover", ".note", ".tooltip"]
        .map((selector) => {
          const element = style.querySelector<HTMLElement>(selector);
          if (!element) return `${selector}: missing`;
          element.hidden = false;
          const { outlineStyle, outlineWidth, outlineColor } =
            getComputedStyle(element);
          return `${selector}: ${outlineStyle} ${outlineWidth} ${outlineColor}`;
        })
        .filter((outline) => !/solid \d+(\.\d+)?px rgb\(/.test(outline)),
    );
  expect(outlines).toEqual([]);
});
