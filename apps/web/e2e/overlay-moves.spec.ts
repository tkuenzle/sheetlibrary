import { type Page } from "@playwright/test";

import { createSheet, expect, newMark, test } from "./fixtures";

// How overlays come and go: menus and the panels under a button grow from
// it, dialogs grow from the centre, bottom sheets slide up, the "New sheet"
// ways rise in turn, and each leaves the same way, faster. The tests record
// every CSS animation that starts on the page, with what it was on and
// where the focus was. See openspec/specs/design-system and docs/motion.md.

test.use({ signedIn: true });

const content = {
  format: "chordsheet",
  version: 1,
  sections: [
    {
      label: "Verse 1",
      lines: [
        {
          text: "Amazing grace, how sweet the sound",
          chords: [{ at: 0, root: "G" }],
        },
      ],
    },
  ],
};

function isPhone(testInfo: { project: { name: string } }) {
  return testInfo.project.name === "phone";
}

interface OverlayMove {
  name: string;
  // Set for a move of the element's ::backdrop.
  pseudo: string;
  // The element's accessible name, or the start of its text.
  on: string;
  classes: string;
  // In milliseconds.
  duration: number;
  delay: number;
  // Where it grows from, in px from the element's top left corner.
  origin: { x: number; y: number };
  width: number;
  height: number;
  // The name of what had the focus when it started.
  focus: string;
  // When it started, in milliseconds since the page loaded.
  at: number;
}

// Records each CSS animation that starts, from the next page load on.
async function recordMoves(page: Page) {
  await page.addInitScript(() => {
    const log: Record<string, unknown>[] = [];
    (window as unknown as { overlayMoves: unknown }).overlayMoves = log;
    const nameOf = (element: Element | null) =>
      element?.getAttribute("aria-label") ??
      element?.textContent.trim().slice(0, 40) ??
      "";
    document.addEventListener(
      "animationstart",
      (event) => {
        const target = event.target as HTMLElement;
        const pseudo = event.pseudoElement || null;
        const style = getComputedStyle(target, pseudo);
        const names = style.animationName.split(", ");
        const at = Math.max(names.indexOf(event.animationName), 0);
        const seconds = (list: string) =>
          Number.parseFloat(list.split(", ")[at] ?? list) * 1000;
        const [x = "0", y = "0"] =
          getComputedStyle(target).transformOrigin.split(" ");
        log.push({
          name: event.animationName,
          pseudo: event.pseudoElement,
          on: nameOf(target),
          classes: target.getAttribute("class") ?? "",
          duration: seconds(style.animationDuration),
          delay: seconds(style.animationDelay),
          origin: { x: Number.parseFloat(x), y: Number.parseFloat(y) },
          width: target.offsetWidth,
          height: target.offsetHeight,
          focus: nameOf(document.activeElement),
          at: performance.now(),
        });
      },
      true,
    );
  });
}

const allMoves = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { overlayMoves: OverlayMove[] }).overlayMoves,
  );

// Waits for moves named `name` on an element whose classes include
// `classes` (and on its ::backdrop with `pseudo`), and gives them, oldest
// first.
async function movesOf(
  page: Page,
  name: string,
  classes: string,
  { pseudo = "", count = 1 } = {},
): Promise<OverlayMove[]> {
  const matching = async () =>
    (await allMoves(page)).filter(
      (move) =>
        move.name === name &&
        move.pseudo === pseudo &&
        move.classes.split(" ").includes(classes),
    );
  await expect.poll(async () => (await matching()).length).toBe(count);
  return matching();
}

async function moveOf(
  page: Page,
  name: string,
  classes: string,
  options: { pseudo?: string } = {},
): Promise<OverlayMove> {
  const [move] = await movesOf(page, name, classes, options);
  if (!move) throw new Error(`no ${name}`);
  return move;
}

const menuButton = (page: Page) =>
  page.getByRole("button", { name: "More for this sheet" });

// Scenarios "Opening the sheet's menu" and "Leaving a menu".
test("the sheet's menu grows from its button, and shrinks back on Escape", async ({
  page,
}) => {
  await recordMoves(page);
  const id = await createSheet(page, { title: newMark(), content });
  await page.goto(`/sheets/${id}`);

  await menuButton(page).click();
  const menu = page.getByRole("menu", { name: "More for this sheet" });
  await expect(menu).toBeVisible();
  const opening = await moveOf(page, "overlay-grow-in", "menu-list");
  expect(opening.duration).toBe(200);
  // From its top right corner, under the button.
  expect(opening.origin.x).toBeCloseTo(opening.width, 0);
  expect(opening.origin.y).toBe(0);

  await page.keyboard.press("Escape");
  const leaving = await moveOf(page, "overlay-grow-out", "menu-list");
  expect(leaving.duration).toBeLessThan(opening.duration);
  // The focus is back on the button while the menu still fades out.
  expect(leaving.focus).toBe("More for this sheet");
  await expect(menu).toHaveCount(0);
  await expect(menuButton(page)).toBeFocused();
});

// Scenario "Closing the key panel".
test("the key panel grows from its button, and shrinks back on Escape", async ({
  page,
}, testInfo) => {
  test.skip(isPhone(testInfo), "Needs a wide window");
  await page.setViewportSize({ width: 1200, height: 800 });
  await recordMoves(page);
  const id = await createSheet(page, { title: newMark(), content });
  await page.goto(`/sheets/${id}`);

  const keyButton = page.getByRole("button", { name: /^Key / });
  const keyPanel = page.getByRole("dialog", { name: "Key" });
  await keyButton.click();
  await expect(keyPanel).toBeVisible();
  const opening = await moveOf(page, "overlay-grow-in", "key-panel");
  // From its top left corner, under the button.
  expect(opening.origin).toEqual({ x: 0, y: 0 });

  await page.keyboard.press("Escape");
  const leaving = await moveOf(page, "overlay-grow-out", "key-panel");
  expect(leaving.duration).toBeLessThan(opening.duration);
  expect(leaving.focus).toMatch(/^Key /);
  await expect(keyPanel).toBeHidden();
  await expect(keyButton).toBeFocused();
});

async function openDelete(page: Page, title: string) {
  await menuButton(page).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("alertdialog", { name: `Delete “${title}”?` });
  await expect(dialog).toBeVisible();
  return dialog;
}

// Scenarios "Asking before a delete", "Cancel" and "Cancel pressed twice".
test("the delete question grows from the centre, and shrinks back on Cancel", async ({
  page,
}) => {
  await recordMoves(page);
  const title = newMark();
  const id = await createSheet(page, { title: title, content });
  await page.goto(`/sheets/${id}`);

  const dialog = await openDelete(page, title);
  const opening = await moveOf(page, "overlay-grow-in", "confirm-dialog");
  expect(opening.duration).toBe(200);
  expect(opening.origin.x).toBeCloseTo(opening.width / 2, 0);
  expect(opening.origin.y).toBeCloseTo(opening.height / 2, 0);
  const dimming = await moveOf(page, "overlay-fade-in", "confirm-dialog", {
    pseudo: "::backdrop",
  });
  expect(dimming.duration).toBe(opening.duration);

  // The second tap lands while the dialog leaves, and does nothing.
  const box = await dialog
    .getByRole("button", { name: "Cancel" })
    .boundingBox();
  if (!box) throw new Error("no Cancel");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const leaving = await moveOf(page, "overlay-grow-out", "confirm-dialog");
  expect(leaving.duration).toBeLessThan(opening.duration);
  await moveOf(page, "overlay-fade-out", "confirm-dialog", {
    pseudo: "::backdrop",
  });
  await expect(dialog).toBeHidden();
  await expect(menuButton(page)).toBeFocused();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  // Opened again, it comes in as before, not as it left.
  await openDelete(page, title);
  await movesOf(page, "overlay-grow-in", "confirm-dialog", { count: 2 });
  await expect(
    page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }),
  ).toBeFocused();
});

// A confirm dialog whose action worked doesn't play its exit: the page moves.
test("deleting a sheet leaves for the library without the dialog's exit", async ({
  page,
}) => {
  await recordMoves(page);
  const title = newMark();
  const id = await createSheet(page, { title: title, content });
  await page.goto(`/sheets/${id}`);

  const dialog = await openDelete(page, title);
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL("/sheets");
  await expect(dialog).toHaveCount(0);
  const exits = (await allMoves(page)).filter(
    (move) =>
      move.name === "overlay-grow-out" &&
      move.classes.split(" ").includes("confirm-dialog"),
  );
  expect(exits).toEqual([]);
});

// Scenario "Photo import on a phone".
test("photo import slides up on a phone, and back down on Cancel", async ({
  page,
}, testInfo) => {
  test.skip(!isPhone(testInfo), "A sheet from the bottom on a phone");
  await recordMoves(page);
  await page.goto("/sheets");
  await page.getByRole("button", { name: "New sheet" }).click();
  await page.getByRole("menuitem", { name: "From photos…" }).click();
  const dialog = page.getByRole("dialog", { name: "Import from photos" });
  await expect(dialog).toBeVisible();
  // It can nearly fill the screen, so it takes longer than the smaller
  // sheets (docs/motion.md, "Material 3"). The scrim takes the same time.
  const opening = await moveOf(page, "overlay-slide-in", "photo-import-dialog");
  expect(opening.duration).toBe(300);
  const dimming = await moveOf(page, "overlay-fade-in", "photo-import-dialog", {
    pseudo: "::backdrop",
  });
  expect(dimming.duration).toBe(300);

  await dialog.getByRole("button", { name: "Cancel" }).click();
  const leaving = await moveOf(
    page,
    "overlay-slide-out",
    "photo-import-dialog",
  );
  expect(leaving.duration).toBe(200);
  const brightening = await moveOf(
    page,
    "overlay-fade-out",
    "photo-import-dialog",
    { pseudo: "::backdrop" },
  );
  expect(brightening.duration).toBe(200);
  await expect(dialog).toBeHidden();
});

// Scenario "A large sheet takes longer".
test("photo import slides up for longer than the key panel on a phone", async ({
  page,
}, testInfo) => {
  test.skip(!isPhone(testInfo), "Sheets from the bottom on a phone");
  await recordMoves(page);
  const id = await createSheet(page, { title: newMark(), content });
  await page.goto(`/sheets/${id}`);

  const keyPanel = page.getByRole("dialog", { name: "Key" });
  await page.getByRole("button", { name: /^Key / }).click();
  await expect(keyPanel).toBeVisible();
  const key = await moveOf(page, "key-panel-in", "key-panel");
  await page.keyboard.press("Escape");
  await expect(keyPanel).toBeHidden();

  await page.goto("/sheets");
  await page.getByRole("button", { name: "New sheet" }).click();
  await page.getByRole("menuitem", { name: "From photos…" }).click();
  await expect(
    page.getByRole("dialog", { name: "Import from photos" }),
  ).toBeVisible();
  const photos = await moveOf(page, "overlay-slide-in", "photo-import-dialog");
  expect(photos.duration).toBeGreaterThan(key.duration);
});

// Scenario "The ways rise in turn".
test("the New sheet ways rise in turn on a phone, and leave together", async ({
  page,
}, testInfo) => {
  test.skip(!isPhone(testInfo), "The floating button is on phones");
  await recordMoves(page);
  await page.goto("/sheets");
  const newSheet = page.getByRole("button", { name: "New sheet" });
  await newSheet.click();
  const ways = page.getByRole("dialog", { name: "New sheet" });
  await expect(
    ways.getByRole("menuitem", { name: "From Ultimate Guitar…" }),
  ).toBeVisible();

  const rising = await movesOf(
    page,
    "floating-menu-rise",
    "floating-menu-item",
    {
      count: 3,
    },
  );
  const delay = (way: string) =>
    rising.find((move) => move.on.includes(way))?.delay;
  expect(delay("From Ultimate Guitar…")).toBe(0);
  expect(delay("From photos…")).toBeGreaterThan(0);
  expect(delay("Write a new sheet")).toBeGreaterThan(
    delay("From photos…") ?? Infinity,
  );
  await moveOf(page, "overlay-fade-in", "floating-menu", {
    pseudo: "::backdrop",
  });
  await moveOf(page, "overlay-fade-in", "floating-menu-close");

  await ways.getByRole("button", { name: "Close" }).click();
  const sinking = await movesOf(
    page,
    "floating-menu-sink",
    "floating-menu-item",
    {
      count: 3,
    },
  );
  expect(sinking.map((move) => move.delay)).toEqual([0, 0, 0]);
  expect(sinking[0]?.duration).toBeLessThan(rising[0]?.duration ?? 0);
  await expect(ways).toBeHidden();
  await expect(newSheet).toBeFocused();
});

// Clicks `trigger` in the page, or presses Escape on it, and waits for the
// overlay `selector` to be gone (removed, or a closed dialog). Gives the
// longest animation in it, delay included, in milliseconds, read each frame
// while it was closing. Done inside the page, so no frame is missed.
async function exitLength(
  page: Page,
  {
    trigger,
    escape = false,
    selector,
  }: { trigger: string; escape?: boolean; selector: string },
): Promise<number> {
  return page.evaluate(
    async ([trigger, escape, selector]) => {
      const target = document.querySelector(trigger);
      if (!(target instanceof HTMLElement)) throw new Error(`no ${trigger}`);
      if (escape) {
        target.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      } else {
        target.click();
      }
      let longest = 0;
      for (;;) {
        const overlay = document.querySelector(selector);
        if (
          !overlay ||
          (overlay instanceof HTMLDialogElement && !overlay.open)
        ) {
          return longest;
        }
        if (overlay.hasAttribute("data-closing")) {
          for (const animation of overlay.getAnimations({ subtree: true })) {
            const timing = animation.effect?.getComputedTiming();
            longest = Math.max(
              longest,
              Number(timing?.duration ?? 0) + (timing?.delay ?? 0),
            );
          }
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    },
    [trigger, escape, selector] as const,
  );
}

// The longest animation duration set on `selector` and inside it, in
// milliseconds.
async function longestSet(page: Page, selector: string): Promise<number> {
  return page.evaluate((selector) => {
    const overlay = document.querySelector(selector);
    if (!overlay) throw new Error(`no ${selector}`);
    const seconds = (element: Element) =>
      getComputedStyle(element)
        .animationDuration.split(", ")
        .map((value) => Number.parseFloat(value) * 1000);
    return Math.max(
      ...[overlay, ...overlay.querySelectorAll("*")].flatMap(seconds),
    );
  }, selector);
}

// Scenario "Closing a dialog" of design-system's reduced motion. Each comes
// and goes with its moves taking no time.
test("menus, dialogs and the New sheet ways come and go at once with reduced motion", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const title = newMark();
  const id = await createSheet(page, { title: title, content });
  await page.goto(`/sheets/${id}`);

  await menuButton(page).click();
  await expect(page.getByRole("menu")).toBeVisible();
  expect(await longestSet(page, ".menu-list")).toBe(0);
  expect(
    await exitLength(page, {
      trigger: ".menu-list",
      escape: true,
      selector: ".menu-list",
    }),
  ).toBe(0);

  const dialog = await openDelete(page, title);
  expect(await longestSet(page, ".confirm-dialog")).toBe(0);
  expect(
    await exitLength(page, {
      trigger: ".confirm-dialog .button-text",
      selector: ".confirm-dialog",
    }),
  ).toBe(0);
  await expect(dialog).toBeHidden();

  if (isPhone(testInfo)) {
    await page.goto("/sheets");
    await page.getByRole("button", { name: "New sheet" }).click();
    await expect(page.getByRole("dialog", { name: "New sheet" })).toBeVisible();
    expect(await longestSet(page, ".floating-menu")).toBe(0);
    expect(
      await exitLength(page, {
        trigger: ".floating-menu-close",
        selector: ".floating-menu",
      }),
    ).toBe(0);
  }
});
