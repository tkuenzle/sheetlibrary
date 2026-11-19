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

// The rail lists the collections, its compact form shows icons with their
// names under them, and the bar marks the item a collection belongs to.
test("shows the rail, its compact form and the bottom bar", async ({
  page,
}) => {
  const light = page.locator('[data-theme="light"]');
  const rail = light.getByRole("navigation", { name: "Rail", exact: true });
  await expect(rail.getByRole("link", { name: "Sheet Library" })).toBeVisible();
  await expect(rail.getByRole("link", { name: /Christmas/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect((await rail.boundingBox())?.width).toBe(272);

  const compact = light.getByRole("navigation", { name: "Rail, compact" });
  await expect(compact.getByRole("link")).toHaveCount(3);
  await expect(compact.getByRole("link")).toHaveText([
    "Sheets",
    "Collections",
    "AAccount",
  ]);
  expect((await compact.boundingBox())?.width).toBe(88);

  const bar = light.getByRole("navigation", { name: "Bottom bar" });
  await expect(bar.getByRole("link", { name: "Collections" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect((await bar.boundingBox())?.height).toBe(80);
});

// The floating buttons stand where they are here. The menu opens its items
// over the dimmed page, and Escape closes it with the focus back on it.
test("shows the floating buttons and opens the floating menu", async ({
  page,
}) => {
  const light = page.locator('[data-theme="light"]');
  const add = light.getByRole("button", { name: "New collection" });
  expect(await add.boundingBox()).toMatchObject({ width: 64, height: 64 });

  const newSheet = light.getByRole("button", { name: "New sheet" });
  await newSheet.click();
  const menu = page.getByRole("menu", { name: "New sheet" });
  await expect(menu.getByRole("menuitem")).toHaveText([
    "Write a new sheet",
    "From photos…",
    "From Ultimate Guitar…",
  ]);
  await expect(menu.getByRole("menuitem").first()).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(
    menu.getByRole("menuitem", { name: "From Ultimate Guitar…" }),
  ).toBeFocused();
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(newSheet).toBeFocused();
});

// The loading bar stands still here, and the page errors keep their
// action. See openspec/specs/site-layout.
test("shows the loading bar and the page errors", async ({ page }) => {
  for (const theme of ["light", "lamplight"]) {
    const style = page.locator(`[data-theme="${theme}"]`);
    const bar = style.locator(".loading-bar");
    expect((await bar.boundingBox())?.height).toBe(3);
    const piece = bar.locator("span");
    expect((await piece.boundingBox())?.width).toBe(
      (await bar.boundingBox())?.width,
    );
    await expect(
      style.getByRole("heading", { name: "Can’t reach Sheet Library" }),
    ).toBeVisible();
    await expect(
      style.getByRole("heading", { name: "Something went wrong" }),
    ).toBeVisible();
    await expect(style.getByRole("button", { name: "Try again" })).toHaveCount(
      2,
    );
  }
});

// Skeleton bars: as tall as the letters of their text, and they pulse by
// fading, unless motion is reduced. See openspec/specs/design-system.
test("shows the skeleton bars, still with reduced motion", async ({ page }) => {
  const bars = page.locator('[data-theme="light"] .skeleton-bar');
  await expect(bars).toHaveCount(3);
  const title = await bars.first().boundingBox();
  expect(title?.width).toBeCloseTo(9 * 17, 0);
  expect(title?.height).toBeCloseTo(17 * 0.8, 0);
  const pulse = () =>
    bars.first().evaluate((bar) =>
      bar.getAnimations().map((animation) => ({
        name: (animation as CSSAnimation).animationName,
        // Only opacity changes, so it runs off the main thread.
        properties: (animation.effect as KeyframeEffect)
          .getKeyframes()
          .flatMap((frame) =>
            Object.keys(frame).filter(
              (key) =>
                !["offset", "easing", "composite", "computedOffset"].includes(
                  key,
                ),
            ),
          ),
      })),
    );
  expect(await pulse()).toEqual([
    { name: "skeleton-pulse", properties: ["opacity", "opacity"] },
  ]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await pulse()).toEqual([]);
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
      [
        ".button",
        ".icon-button",
        ".toolbar",
        ".popover",
        ".note",
        ".tooltip",
        ".floating-button",
        ".nav-rail-sub-item[aria-current]",
        ".nav-rail-compact .nav-rail-item[aria-current] > .nav-rail-icon",
        ".nav-bar-item[aria-current] > .nav-bar-icon",
      ]
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

  // The bar has no outline to keep: its piece takes a system color.
  const bar = await page
    .locator('[data-theme="light"] .loading-bar > span')
    .evaluate((piece) => getComputedStyle(piece).backgroundColor);
  expect(bar).not.toBe("rgba(0, 0, 0, 0)");
  // Not the light style's accent, which forced colors would drop.
  expect(bar).not.toBe("rgb(31, 107, 79)");

  // Nor do the skeleton bars: they take a system color too.
  const skeleton = await page
    .locator('[data-theme="light"] .skeleton-bar')
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(skeleton).not.toBe("rgba(0, 0, 0, 0)");
  // Not the light style's quiet color, which forced colors would drop.
  expect(skeleton).not.toBe("rgb(220, 228, 221)");
});
