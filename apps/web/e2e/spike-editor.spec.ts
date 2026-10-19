import { expect, type Page, test } from "@playwright/test";

// Throwaway editor spike (M1). See openspec/changes/editor-spike.

test.beforeEach(async ({ page }) => {
  await page.goto("/spike/editor");
  await expect(page.locator(".chord-label").first()).toBeVisible();
});

test("shows chords above their letters without overlaps", async ({ page }) => {
  await expect(page.locator(".chord-label")).toHaveCount(24);
  await expect.poll(() => misplacedChords(page)).toEqual([]);
  await expect.poll(() => overlappingChords(page)).toEqual([]);
});

test("keeps chords above their letters when lines wrap", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await type(page, "before", "Amazing", " oh so very very");
  const lineHeight = await page
    .locator(".line")
    .first()
    .evaluate((line) => line.getBoundingClientRect().height);
  const singleLine = await page
    .locator(".line")
    .nth(1)
    .evaluate((line) => line.getBoundingClientRect().height);
  expect(lineHeight).toBeGreaterThan(singleLine * 1.5);
  await expect.poll(() => misplacedChords(page)).toEqual([]);
  await expect.poll(() => overlappingChords(page)).toEqual([]);
});

test("spreads lyrics for wide chords and piles", async ({ page }) => {
  await clickChar(page, "before", "grace,");
  const letters = "grace, how sweet ".length;
  for (let i = 1; i < letters; i++) {
    await page.keyboard.press("Shift+ArrowRight");
  }
  await afterSelectionChange(page, () =>
    page.keyboard.press("Shift+ArrowRight"),
  );
  await page.keyboard.press("Backspace");
  await page.getByRole("button", { name: "Chords" }).click();
  await addChord(page, "the", 0, "Cmaj7");
  await addChord(page, "the", 1, "Dsus4");
  await expect(chordPro(page)).toContainText(
    "[G]Amazing [G7][C][Cmaj7]t[Dsus4]he [G]sound",
  );
  await expect.poll(() => misplacedChords(page)).toEqual([]);
  await expect.poll(() => overlappingChords(page)).toEqual([]);
});

test("moves the caret past a chord with one arrow press", async ({ page }) => {
  await clickChar(page, "before", "Amazing");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.type("X");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.type("Y");
  await expect(chordPro(page)).toContainText("Y[G]AXmazing");
});

test("keeps a chord on its letter when typing before it", async ({ page }) => {
  await type(page, "before", "grace,", "so ");
  await expect(chordPro(page)).toContainText("[G]Amazing so [G7]grace,");
});

test("leaves a chord on the next letter when its letter is retyped", async ({
  page,
}) => {
  await clickChar(page, "after", "lieved");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("l");
  await expect(chordPro(page)).toContainText("rel[D]ieved");
});

test("deletes the letter, not the chord, with Delete", async ({ page }) => {
  await clickChar(page, "before", "lieved");
  await page.keyboard.press("Delete");
  await expect(chordPro(page)).toContainText("re[D]ieved");
});

test("restores a rescued chord with one undo", async ({ page }) => {
  await clickChar(page, "before", "lieved");
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.type("L");
  await expect(chordPro(page)).toContainText("re[D]Lieved");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(chordPro(page)).toContainText("re[D]lieved");
});

test("adds a chord with the keyboard shortcut", async ({ page }) => {
  await clickChar(page, "before", "wretch");
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByLabel("Chord")).toBeFocused();
  await page.keyboard.type("Em");
  await page.keyboard.press("Enter");
  await expect(chordPro(page)).toContainText("a [Em]wretch");
});

test("moves a chord by dragging it", async ({ page }, testInfo) => {
  await dragLabel(page, "Cmaj7", "to fear", testInfo.project.name === "phone");
  await expect(chordPro(page)).toContainText("my heart [Cmaj7]to [G]fear");
  await expect.poll(() => misplacedChords(page)).toEqual([]);
});

test.describe("chord mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: "Chords" }).click();
  });

  test("makes the lyrics read-only", async ({ page }) => {
    await expect(page.locator(".ProseMirror")).toHaveAttribute(
      "contenteditable",
      "false",
    );
  });

  test("adds a chord to a tapped letter", async ({ page }) => {
    await addChord(page, "wretch", 2, "Am");
    await expect(chordPro(page)).toContainText("wr[Am]etch like [D]me");
  });

  test("changes, moves and deletes a chord", async ({ page }) => {
    await clickLabel(page, "Cmaj7");
    await page.getByLabel("Chord").fill("C");
    await page.getByRole("button", { name: "OK" }).click();
    await expect(chordPro(page)).toContainText("my [C]heart");

    await clickLabel(page, "D", 2);
    await clickChar(page, "before", "fears");
    await expect(chordPro(page)).toContainText("my [D]fears relieved");

    await clickLabel(page, "D", 2);
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(chordPro(page)).toContainText("my fears relieved");
  });
});

function chordPro(page: Page) {
  return page.getByTestId("chordpro");
}

async function type(
  page: Page,
  side: "before" | "after",
  needle: string,
  text: string,
) {
  await clickChar(page, side, needle);
  await page.keyboard.type(text);
}

async function addChord(
  page: Page,
  needle: string,
  offset: number,
  name: string,
) {
  await clickChar(page, "before", needle, offset);
  await page.getByLabel("Chord").fill(name);
  await page.keyboard.press("Enter");
}

async function clickLabel(page: Page, name: string, nth = 0) {
  await page
    .locator(".chord-label", { hasText: new RegExp(`^${name}$`) })
    .nth(nth)
    .click();
}

// Drags a chord label so its left edge lands on the first letter of
// `needle`, with the mouse or with touch.
async function dragLabel(
  page: Page,
  name: string,
  needle: string,
  touch: boolean,
) {
  const label = page.locator(".chord-label", {
    hasText: new RegExp(`^${name}$`),
  });
  const from = await label.first().boundingBox();
  const target = await charBox(page, needle, 0);
  if (!from) throw new Error(`chord ${name} not found`);
  const start = { x: from.x + 2, y: from.y + from.height / 2 };
  const end = { x: start.x + target.left - from.x, y: start.y };
  const steps = [0.25, 0.5, 0.75, 1].map((t) => ({
    x: start.x + (end.x - start.x) * t,
    y: start.y,
  }));
  if (!touch) {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (const point of steps) await page.mouse.move(point.x, point.y);
    await page.mouse.up();
    return;
  }
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [start],
  });
  for (const point of steps) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [point],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
}

// Clicks just inside the left or right edge of the first letter of `needle`
// (at `offset`).
async function clickChar(
  page: Page,
  side: "before" | "after",
  needle: string,
  offset = 0,
) {
  const box = await charBox(page, needle, offset);
  const x = side === "before" ? box.left + 1 : box.right - 1;
  await afterSelectionChange(page, () => page.mouse.click(x, box.y));
}

// ProseMirror reads a new selection from a "selectionchange" event, which
// arrives a moment after a click or key press. People never type that fast,
// so tests wait for it. In chord mode there is none, so give up after a while.
async function afterSelectionChange(page: Page, action: () => Promise<void>) {
  await page.evaluate(() => {
    const target = window as unknown as Record<string, unknown>;
    target.selectionChanged = new Promise<void>((resolve) => {
      const done = () => setTimeout(resolve, 20);
      document.addEventListener("selectionchange", done, { once: true });
      setTimeout(resolve, 300);
    });
  });
  await action();
  await page.evaluate(
    () => (window as unknown as Record<string, unknown>).selectionChanged,
  );
}

async function charBox(page: Page, needle: string, offset: number) {
  // Chord layout runs on the next frame after a change.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const box = await page.evaluate(
    ([needle, offset]) => {
      for (const line of document.querySelectorAll(".ProseMirror .line")) {
        const chars: [Text, number][] = [];
        let text = "";
        const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const textNode = node as Text;
          for (let i = 0; i < textNode.length; i++) chars.push([textNode, i]);
          text += textNode.data;
        }
        const found = text.indexOf(needle);
        if (found < 0) continue;
        const char = chars[found + offset];
        if (!char) break;
        const range = document.createRange();
        range.setStart(char[0], char[1]);
        range.setEnd(char[0], char[1] + 1);
        const rect = range.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          y: rect.top + rect.height / 2,
        };
      }
      return null;
    },
    [needle, offset] as const,
  );
  if (!box) throw new Error(`"${needle}" not found`);
  return box;
}

// Chords whose label doesn't start at their letter, or isn't above it. Only
// the first chord on a letter is checked; the others sit next to it.
function misplacedChords(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    const letters = document.querySelectorAll<HTMLElement>(
      ".ProseMirror span.chorded",
    );
    for (const letter of letters) {
      const [id] = (letter.dataset.chordIds ?? "").split(" ");
      const label = document.querySelector(`[data-chord-id="${id ?? ""}"]`);
      if (!label) {
        problems.push(`no label over "${letter.textContent}"`);
        continue;
      }
      const box = letter.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      if (
        Math.abs(labelBox.left - box.left) > 1 ||
        labelBox.bottom > box.top + 4
      ) {
        problems.push(`${label.textContent} over "${letter.textContent}"`);
      }
    }
    return problems;
  });
}

function overlappingChords(page: Page) {
  return page.evaluate(() => {
    const labels = [...document.querySelectorAll(".chord-layer .chord-label")];
    const boxes = labels.map((label) => ({
      name: label.textContent,
      box: label.getBoundingClientRect(),
    }));
    const problems: string[] = [];
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) {
        const sameRow = Math.abs(a.box.top - b.box.top) < 2;
        if (sameRow && a.box.right > b.box.left && b.box.right > a.box.left) {
          problems.push(`${a.name} and ${b.name}`);
        }
      }
    }
    return problems;
  });
}
