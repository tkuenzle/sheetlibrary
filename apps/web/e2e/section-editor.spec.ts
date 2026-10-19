import { expect, type Page, test } from "@playwright/test";

interface Section {
  lines: { text: string; chords: { at: number; chord: string }[] }[];
}

test.beforeEach(async ({ page }) => {
  await page.goto("/section-editor");
  await expect(page.locator(".chord-label").first()).toBeVisible();
});

test.describe("chords above their letters", () => {
  test("shows each chord above its letter without overlaps", async ({
    page,
  }) => {
    await expect(page.locator(".chord-label")).toHaveCount(12);
    await expect.poll(() => misplacedChords(page)).toEqual([]);
    await expect.poll(() => overlappingChords(page)).toEqual([]);
  });

  test("keeps chords above their letters when lines wrap", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await clickChar(page, "before", "Amazing");
    await page.keyboard.type(" oh so very very");
    const wrapped = await lineHeight(page, 0);
    expect(wrapped).toBeGreaterThan((await lineHeight(page, 1)) * 1.5);
    await expect.poll(() => misplacedChords(page)).toEqual([]);
    await expect.poll(() => overlappingChords(page)).toEqual([]);
  });

  test("spreads lyrics for wide chords and piles", async ({ page }) => {
    await selectText(page, "grace, how sweet ");
    await page.keyboard.press("Backspace");
    await addChord(page, "the", 1, "Cmaj7");
    await addChord(page, "the", 2, "Dsus4");
    await expect.poll(() => misplacedChords(page)).toEqual([]);
    await expect.poll(() => overlappingChords(page)).toEqual([]);
    expect((await handBack(page))[0]).toBe(
      "[G]Amazing [G7][C]t[Cmaj7]h[Dsus4]e [G]sound",
    );
  });
});

test.describe("adding and editing chords", () => {
  test("adds a chord with the keyboard", async ({ page }) => {
    await addChord(page, "wretch", 1, "Am");
    expect((await handBack(page))[1]).toBe(
      "That saved a w[Am]retch like [D]me",
    );
  });

  test("edits the chord at the caret with the keyboard", async ({ page }) => {
    await clickChar(page, "before", "me");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByLabel("Chord")).toHaveValue("D");
    await page.getByLabel("Chord").fill("D7");
    await page.keyboard.press("Enter");
    expect((await handBack(page))[1]).toBe("That saved a wretch like [D7]me");
  });

  test("closes the chord input with Escape", async ({ page }) => {
    await clickChar(page, "before", "wretch");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByLabel("Chord")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByLabel("Chord")).toHaveCount(0);
    await page.keyboard.type("x");
    expect((await handBack(page))[1]).toBe("That saved a xwretch like [D]me");
  });

  test("changes and deletes a chord by clicking its label", async ({
    page,
  }) => {
    await clickLabel(page, "G7");
    await page.getByLabel("Chord").fill("C");
    await page.getByRole("button", { name: "OK" }).click();
    await clickLabel(page, "D");
    await page.getByRole("button", { name: "Delete" }).click();
    const lines = await handBack(page);
    expect(lines[0]).toBe("[G]Amazing [C]grace, how [C]sweet the [G]sound");
    expect(lines[1]).toBe("That saved a wretch like me");
  });
});

test.describe("editing lyrics", () => {
  test("moves the caret past a chord with one arrow press", async ({
    page,
  }) => {
    await clickChar(page, "before", "Amazing");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.type("X");
    expect((await handBack(page))[0]).toMatch(/^\[G\]AXmazing/);
  });

  test("rescues a chord and undoes it in one step", async ({ page }) => {
    await selectText(page, "me");
    await page.keyboard.type("you");
    await expect.poll(() => misplacedChords(page)).toEqual([]);
    await page.keyboard.press("ControlOrMeta+z");
    expect((await handBack(page))[1]).toBe("That saved a wretch like [D]me");
  });
});

test.describe("handing back the section", () => {
  test("hands back an unchanged section as it was, and loads it again", async ({
    page,
  }) => {
    const before = await handBack(page);
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.locator(".chord-label")).toHaveCount(12);
    expect(await handBack(page)).toEqual(before);
    expect(before[3]).toBe("Was [Em]blind, but [D]now I [G]see");
  });

  test("drops an empty line", async ({ page }) => {
    await clickChar(page, "after", "sound", 4);
    await page.keyboard.press("Enter");
    expect(await handBack(page)).toHaveLength(4);
  });

  test("removes the section when nothing is left", async ({ page }) => {
    await clickChar(page, "before", "Amazing");
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByTestId("section")).toHaveText(
      "Nothing is left, so the section is removed.",
    );
  });
});

// Clicks Done and returns the handed-back section's lines, with chords in
// brackets before their letter.
async function handBack(page: Page) {
  await page.getByRole("button", { name: "Done" }).click();
  const json = await page.getByTestId("section").textContent();
  const section = JSON.parse(json ?? "") as Section;
  return section.lines.map(({ text, chords }) => {
    let result = "";
    let start = 0;
    for (const { at, chord } of chords) {
      result += `${text.slice(start, at)}[${chord}]`;
      start = at;
    }
    return result + text.slice(start);
  });
}

async function addChord(
  page: Page,
  needle: string,
  offset: number,
  chord: string,
) {
  await clickChar(page, "before", needle, offset);
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByLabel("Chord").fill(chord);
  await page.keyboard.press("Enter");
}

async function clickLabel(page: Page, chord: string) {
  await page
    .locator(".chord-label", { hasText: new RegExp(`^${chord}$`) })
    .first()
    .click();
}

async function selectText(page: Page, needle: string) {
  await clickChar(page, "before", needle);
  for (let i = 1; i < needle.length; i++) {
    await page.keyboard.press("Shift+ArrowRight");
  }
  await afterSelectionChange(page, () =>
    page.keyboard.press("Shift+ArrowRight"),
  );
}

function lineHeight(page: Page, nth: number) {
  return page
    .locator(".line")
    .nth(nth)
    .evaluate((line) => line.getBoundingClientRect().height);
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
// so tests wait for it.
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
