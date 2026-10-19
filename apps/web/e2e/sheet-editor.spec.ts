import { expect, type Page, test } from "@playwright/test";

interface Sheet {
  sections: {
    lines: { text: string; chords: { at: number; chord: string }[] }[];
  }[];
}

test.beforeEach(async ({ page }) => {
  await page.goto("/sheet-editor");
  await expect(page.locator(".chord-label").first()).toBeVisible();
});

test.describe("chords above their letters", () => {
  test("shows each chord above its letter without overlaps", async ({
    page,
  }) => {
    await expect(page.locator(".chord-label")).toHaveCount(24);
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
    expect((await firstSection(page))[0]).toBe(
      "[G]Amazing [G7][C]t[Cmaj7]h[Dsus4]e [G]sound",
    );
  });
});

test.describe("adding and editing chords", () => {
  test("adds a chord with the keyboard", async ({ page }) => {
    await addChord(page, "wretch", 1, "Am");
    expect((await firstSection(page))[1]).toBe(
      "That saved a w[Am]retch like [D]me",
    );
  });

  test("edits the chord at the caret with the keyboard", async ({ page }) => {
    await clickChar(page, "before", "me");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByLabel("Chord")).toHaveValue("D");
    await page.getByLabel("Chord").fill("D7");
    await page.keyboard.press("Enter");
    expect((await firstSection(page))[1]).toBe(
      "That saved a wretch like [D7]me",
    );
  });

  test("closes the chord input with Escape", async ({ page }) => {
    await clickChar(page, "before", "wretch");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByLabel("Chord")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByLabel("Chord")).toHaveCount(0);
    await page.keyboard.type("x");
    expect((await firstSection(page))[1]).toBe(
      "That saved a xwretch like [D]me",
    );
  });

  test("changes and deletes a chord by clicking its label", async ({
    page,
  }) => {
    await clickChar(page, "before", "Amazing");
    await clickLabel(page, "G7");
    await page.getByLabel("Chord").fill("C");
    await page.getByRole("button", { name: "OK" }).click();
    await clickLabel(page, "D");
    await page.getByRole("button", { name: "Delete" }).click();
    const [lines = []] = await handBack(page);
    expect(lines[0]).toBe("[G]Amazing [C]grace, how [C]sweet the [G]sound");
    expect(lines[1]).toBe("That saved a wretch like me");
  });

  test("keeps the section active after the chord input's buttons", async ({
    page,
  }) => {
    await clickChar(page, "before", "Amazing");
    for (const button of ["Cancel", "OK"]) {
      await clickLabel(page, "G7");
      await page.getByRole("button", { name: button }).click();
      await expect(page.getByLabel("Chord")).toHaveCount(0);
      await expect(activeSection(page)).toContainText("Amazing grace");
      await expect(page.locator(".chord-label.is-dimmed")).toHaveCount(12);
    }
  });

  test("makes a section active on a click on one of its labels", async ({
    page,
  }) => {
    await clickChar(page, "before", "Amazing");
    const label = page.locator(".chord-label", { hasText: "Cmaj7" });
    const box = await label.boundingBox();
    if (!box) throw new Error("Cmaj7 has no box");
    await afterSelectionChange(page, () =>
      page.mouse.click(box.x + box.width / 2, box.y + box.height / 2),
    );
    await expect(activeSection(page)).toContainText("'Twas grace");
    await expect(page.getByLabel("Chord")).toHaveCount(0);
    await clickLabel(page, "Cmaj7");
    await expect(page.getByLabel("Chord")).toHaveValue("Cmaj7");
  });
});

test.describe("editing lyrics", () => {
  test("moves the caret past a chord with one arrow press", async ({
    page,
  }) => {
    await clickChar(page, "before", "Amazing");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.type("X");
    expect((await firstSection(page))[0]).toMatch(/^\[G\]AXmazing/);
  });

  test("rescues a chord and undoes it in one step", async ({ page }) => {
    await selectText(page, "me");
    await page.keyboard.type("you");
    await expect.poll(() => misplacedChords(page)).toEqual([]);
    await page.keyboard.press("ControlOrMeta+z");
    expect((await firstSection(page))[1]).toBe(
      "That saved a wretch like [D]me",
    );
  });
});

test.describe("handing back the sheet", () => {
  test("hands back an unchanged sheet as it was, and loads it again", async ({
    page,
  }) => {
    const before = await handBack(page);
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.locator(".chord-label")).toHaveCount(24);
    expect(await handBack(page)).toEqual(before);
    expect(before[0]?.[3]).toBe("Was [Em]blind, but [D]now I [G]see");
  });

  test("drops empty lines from the active section", async ({ page }) => {
    await clickChar(page, "after", "sound", 4);
    await page.keyboard.press("Enter");
    const [first = []] = await handBack(page);
    expect(first).toHaveLength(4);
  });
});

test.describe("the active section", () => {
  test("follows the caret into the next section", async ({ page }) => {
    await clickChar(page, "before", "Was blind");
    await expect(activeSection(page)).toContainText("Amazing grace");
    await afterSelectionChange(page, () => page.keyboard.press("ArrowDown"));
    await expect(activeSection(page)).toContainText("'Twas grace");
    await expect(page.locator(".section").first()).not.toHaveClass(/is-active/);
  });

  test("keeps a selection inside its section", async ({ page }) => {
    const from = await charBox(page, "blind", 0);
    const to = await charBox(page, "Twas", 2);
    await page.mouse.move(from.left + 1, from.y);
    await page.mouse.down();
    await page.mouse.move(to.left + 1, to.y, { steps: 5 });
    await afterSelectionChange(page, () => page.mouse.up());
    await page.keyboard.type("X");
    const [first = [], second = []] = await handBack(page);
    expect(first[3]).toBe("Was [Em][D][G]X");
    expect(second[0]).toBe(
      "'Twas [G]grace that [G7]taught my [Cmaj7]heart to [G]fear",
    );
  });
});

test.describe("finishing a section", () => {
  test("drops an empty line when the caret leaves", async ({ page }) => {
    await clickChar(page, "after", "sound", 4);
    await page.keyboard.press("Enter");
    await expect(linesOf(page, 0)).toHaveCount(5);
    await clickChar(page, "before", "Twas");
    await expect(linesOf(page, 0)).toHaveCount(4);
  });

  test("removes an emptied section on Escape", async ({ page }) => {
    await clickChar(page, "before", "Amazing");
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Escape");
    await expect(page.locator(".section")).toHaveCount(1);
    const sections = await handBack(page);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.[0]).toMatch(/^'Twas/);
  });

  test("keeps the section active while the chord input is open", async ({
    page,
  }) => {
    await clickChar(page, "after", "sound", 4);
    await page.keyboard.press("Enter");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByLabel("Chord")).toBeFocused();
    await expect(activeSection(page)).toContainText("Amazing grace");
    await expect(linesOf(page, 0)).toHaveCount(5);
    await page.keyboard.press("Escape");
    await expect(linesOf(page, 0)).toHaveCount(5);
  });
});

test.describe("section breaks", () => {
  test("splits a section on Enter on an empty line", async ({ page }) => {
    await clickChar(page, "after", "me", 1);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("X");
    const sections = await handBack(page);
    expect(sections.map((lines) => lines.length)).toEqual([2, 2, 4]);
    expect(sections[1]?.[0]).toBe(
      "XI [G]once was [G7]lost, but [C]now am [G]found",
    );
  });

  test("joins a section with the one before on Backspace", async ({ page }) => {
    await clickChar(page, "before", "'Twas");
    await page.keyboard.press("Backspace");
    await expect(page.locator(".section")).toHaveCount(1);
    expect((await handBack(page)).map((lines) => lines.length)).toEqual([8]);
  });

  test("makes sections from pasted text with blank lines", async ({ page }) => {
    await clickChar(page, "before", "Amazing");
    await paste(page, "a\nb\n\nc");
    const sections = await handBack(page);
    expect(sections.map((lines) => lines.length)).toEqual([2, 4, 4]);
    expect(sections[0]).toEqual(["a", "b"]);
    expect(sections[1]?.[0]).toMatch(/^c\[G\]Amazing/);
  });
});

test.describe("undo across sections", () => {
  test("brings back a removed section in one step", async ({ page }) => {
    const before = await handBack(page);
    await page.getByRole("button", { name: "Edit" }).click();
    await clickChar(page, "before", "Amazing");
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");
    await clickChar(page, "before", "Twas");
    await expect(page.locator(".section")).toHaveCount(1);
    await page.keyboard.press("ControlOrMeta+z");
    await expect(page.locator(".section")).toHaveCount(2);
    expect(await handBack(page)).toEqual(before);
  });
});

function activeSection(page: Page) {
  return page.locator(".section.is-active");
}

function linesOf(page: Page, section: number) {
  return page.locator(".section").nth(section).locator(".line");
}

// Pastes plain text at the caret, as the browser does.
async function paste(page: Page, text: string) {
  await page.locator(".ProseMirror").evaluate((editor, text) => {
    const data = new DataTransfer();
    data.setData("text/plain", text);
    editor.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, text);
}

// Clicks Done and returns the handed-back sheet's sections as lists of
// lines, with chords in brackets before their letter.
async function handBack(page: Page) {
  await page.getByRole("button", { name: "Done" }).click();
  const json = await page.getByTestId("sheet").textContent();
  const sheet = JSON.parse(json ?? "") as Sheet;
  return sheet.sections.map((section) =>
    section.lines.map(({ text, chords }) => {
      let result = "";
      let start = 0;
      for (const { at, chord } of chords) {
        result += `${text.slice(start, at)}[${chord}]`;
        start = at;
      }
      return result + text.slice(start);
    }),
  );
}

// The lines of the handed-back sheet's first section.
async function firstSection(page: Page) {
  const [first = []] = await handBack(page);
  return first;
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
