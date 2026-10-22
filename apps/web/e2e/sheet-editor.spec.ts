import { expect, type Locator, type Page, test } from "@playwright/test";

import { harnessURL } from "./servers";

interface Sheet {
  sections: {
    lines: { text: string; chords: { at: number; chord: string }[] }[];
  }[];
}

// The editor is tested on the harness, a page that is never deployed.
test.use({ baseURL: harnessURL });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
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
    // The pile pushes the "h" past its last label.
    const c = await box(label(page, "C"));
    expect((await charBox(page, "the", 1)).left).toBeGreaterThanOrEqual(
      c.x + c.width,
    );
    expect((await firstSection(page))[0]).toBe(
      "[G]Amazing [G7][C]t[Cmaj7]h[Dsus4]e [G]sound",
    );
  });
});

test.describe("piles and chords on spaces", () => {
  test("starts the letter after a pile past its labels, with a dash", async ({
    page,
  }) => {
    await selectText(page, "grace, how sweet ");
    await page.keyboard.press("Backspace");
    const c = await box(label(page, "C"));
    const t = await charBox(page, "the", 0);
    const h = await charBox(page, "the", 1);
    expect(h.left).toBeGreaterThanOrEqual(c.x + c.width);
    await expect(page.locator(".chord-dash")).toHaveCount(1);
    const dash = await box(page.locator(".chord-dash"));
    expect(dash.x).toBeGreaterThanOrEqual(t.right);
    expect(dash.x + dash.width).toBeLessThanOrEqual(h.left);
    expect((await firstSection(page))[0]).toBe(
      "[G]Amazing [G7][C]the [G]sound",
    );
  });

  test("starts the word after a chord on a space past its label", async ({
    page,
  }) => {
    await addChord(page, "That", 4, "Am");
    const am = await box(label(page, "Am"));
    expect((await charBox(page, "saved", 0)).left).toBeGreaterThanOrEqual(
      am.x + am.width,
    );
    await expect(page.locator(".chord-dash")).toHaveCount(0);
    expect((await firstSection(page))[1]).toBe(
      "That[Am] saved a wretch like [D]me",
    );
  });

  test("keeps a gap with a dash at least 0.6em wide", async ({ page }) => {
    // Retyping "my" puts both chords on the new "m", in order.
    await addChord(page, "my heart", 0, "I");
    await addChord(page, "my heart", 1, "V");
    await selectText(page, "my");
    await page.keyboard.type("my");
    const m = await charBox(page, "my heart", 0);
    const y = await charBox(page, "my heart", 1);
    const fontSize = await page
      .locator(".ProseMirror")
      .evaluate((editor) => parseFloat(getComputedStyle(editor).fontSize));
    expect(y.left - m.right).toBeGreaterThanOrEqual(fontSize * 0.6 - 0.1);
    await expect(page.locator(".chord-dash")).toHaveCount(1);
    expect((await handBack(page))[1]?.[0]).toBe(
      "'Twas [G]grace that [G7]taught [I][V]my [Cmaj7]heart to [G]fear",
    );
  });

  test("shows a dash where long labels split a word", async ({ page }) => {
    await addChord(page, "the sound", 0, "Cmaj7");
    await addChord(page, "the sound", 1, "Dsus4");
    const t = await charBox(page, "the sound", 0);
    const h = await charBox(page, "the sound", 1);
    const cmaj7 = await box(label(page, "Cmaj7"));
    expect(h.left).toBeGreaterThanOrEqual(cmaj7.x + cmaj7.width);
    await expect(page.locator(".chord-dash")).toHaveCount(1);
    const dash = await box(page.locator(".chord-dash"));
    expect(dash.x).toBeGreaterThanOrEqual(t.right);
    expect(dash.x + dash.width).toBeLessThanOrEqual(h.left);
  });

  test("shows the caret where typed text appears in front of a pushed letter", async ({
    page,
  }) => {
    await addChord(page, "the sound", 0, "Cmaj7");
    await addChord(page, "the sound", 1, "Dsus4");
    const t = await charBox(page, "the sound", 0);
    const h = await charBox(page, "the sound", 1);
    await afterSelectionChange(page, () => page.mouse.click(h.left - 2, h.y));
    const caret = await caretBox(page);
    expect(Math.abs((caret?.left ?? 0) - t.right)).toBeLessThan(1);
    await page.keyboard.type("X");
    const x = await charBox(page, "tXhe", 1);
    expect(Math.abs(x.left - t.right)).toBeLessThan(1);
  });

  test("lets a single chord's label reach over the next letters", async ({
    page,
  }) => {
    await addChord(page, "wretch", 0, "Cmaj7");
    const cmaj7 = await box(label(page, "Cmaj7"));
    expect((await charBox(page, "wretch", 1)).left).toBeLessThan(
      cmaj7.x + cmaj7.width,
    );
  });

  test("shows a chord and the pushed word in the same frame", async ({
    page,
  }) => {
    await addChord(page, "That", 4, "Am");
    await clickLabel(page, "Am");
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(label(page, "Am")).toHaveCount(0);
    // Undo, and read the layout before the browser gets to a new frame.
    const layout = await page.locator(".ProseMirror").evaluate((editor) => {
      const mac = /Mac|iP(hone|[oa]d)/.test(navigator.platform);
      editor.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: !mac,
          metaKey: mac,
          bubbles: true,
          cancelable: true,
        }),
      );
      const am = [...document.querySelectorAll(".chord-label")].find(
        (label) => label.textContent === "Am",
      );
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      let text: Text | null = null;
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if ((node as Text).data.includes("saved")) text = node as Text;
      }
      if (!am || !text) return null;
      const range = document.createRange();
      const start = text.data.indexOf("saved");
      range.setStart(text, start);
      range.setEnd(text, start + 1);
      return {
        label: am.getBoundingClientRect().right,
        word: range.getBoundingClientRect().left,
      };
    });
    expect(layout).not.toBeNull();
    expect(layout?.word).toBeGreaterThanOrEqual(layout?.label ?? Infinity);
  });

  test("shows the caret at the end of a gap when it is clicked", async ({
    page,
  }) => {
    await selectText(page, "grace, how sweet ");
    await page.keyboard.press("Backspace");
    const t = await charBox(page, "the", 0);
    const h = await charBox(page, "the", 1);
    // The third click finds the caret there already. Clicks this far apart
    // don't count as a double click.
    for (const x of [t.right + 2, h.left - 2, t.right + 2]) {
      await afterSelectionChange(page, () => page.mouse.click(x, t.y));
      const caret = await caretBox(page);
      expect(Math.abs((caret?.left ?? 0) - h.left)).toBeLessThan(1);
      await page.keyboard.type("X");
      await expect(page.locator(".ProseMirror .line").first()).toContainText(
        "tXhe",
      );
      await page.keyboard.press("Backspace");
    }
  });

  test("lays out a long song once per edit", async ({ page }) => {
    // A pile and a chord on a space push letters, then the song is copied.
    await selectText(page, "grace, how sweet ");
    await page.keyboard.press("Backspace");
    await addChord(page, "That", 4, "Am");
    const html = await page.locator(".ProseMirror").innerHTML();
    await clickChar(page, "after", "believed", 7);
    for (let i = 0; i < 8; i++) await paste(page, "", html);
    await expect(page.locator(".chord-label")).toHaveCount(25 * 9);
    await expect(page.locator(".chord-dash")).toHaveCount(9);
    await clickChar(page, "before", "Amazing");
    // Chrome counts how often it lays out the page. Unlike time, the count
    // doesn't depend on how fast the machine is.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    const layouts = async () => {
      const { metrics } = await cdp.send("Performance.getMetrics");
      return metrics.find((m) => m.name === "LayoutCount")?.value ?? NaN;
    };
    const before = await layouts();
    const edits = 20;
    await page.locator(".ProseMirror").evaluate((editor, edits) => {
      for (let i = 0; i < edits; i++) {
        const data = new DataTransfer();
        data.setData("text/plain", "x");
        editor.dispatchEvent(
          new ClipboardEvent("paste", {
            clipboardData: data,
            bubbles: true,
            cancelable: true,
          }),
        );
      }
    }, edits);
    expect((await layouts()) - before).toBeLessThanOrEqual(edits * 2);
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

  test("keeps the chord input inside the window", async ({ page }) => {
    await place(page, "Amazing", 0);
    // The chord at the end of a line, edited, so the form is at its widest.
    await press(page, label(page, "D"));
    const form = await box(page.locator(".chord-input"));
    const width = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(form.x + form.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
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

test.describe("adding chords by mouse", () => {
  test.skip(({ hasTouch }) => hasTouch, "Needs a mouse");

  test("shows a caret in front of the letter and a + under it", async ({
    page,
  }) => {
    await clickChar(page, "before", "Amazing");
    await page.mouse.move(...(await below(page, "wretch", 1)));
    const r = await charBox(page, "wretch", 1);
    const caret = await box(page.locator(".chord-drop-caret"));
    expect(Math.abs(caret.x - r.left)).toBeLessThan(2);
    expect(Math.abs(caret.y - r.top)).toBeLessThan(2);
    const plus = await box(page.locator(".chord-add"));
    expect(Math.abs(plus.x + plus.width / 2 - caret.x)).toBeLessThan(2);
    expect(plus.y).toBeGreaterThanOrEqual(r.bottom - 1);
    await page.mouse.move(r.left + 1, r.y);
    await expect(page.locator(".chord-add")).toHaveCount(0);
    await expect(page.locator(".chord-drop-caret")).toHaveCount(0);
  });

  test("shows no + below another section", async ({ page }) => {
    await clickChar(page, "before", "Amazing");
    await page.mouse.move(...(await below(page, "Twas", 1)));
    await nextLayout(page);
    await expect(page.locator(".chord-add")).toHaveCount(0);
  });

  test("adds a chord on a letter, in one undo step, keeping the caret", async ({
    page,
  }) => {
    await clickChar(page, "before", "Amazing");
    await addBelow(page, "wretch", 1, "Am");
    const r = await charBox(page, "wretch", 1);
    const am = await box(label(page, "Am"));
    expect(Math.abs(am.x - r.left)).toBeLessThan(2);
    await expect(activeSection(page)).toContainText("Amazing grace");
    await page.keyboard.press("ControlOrMeta+z");
    await expect(page.locator(".chord-label", { hasText: "Am" })).toHaveCount(
      0,
    );
    await page.keyboard.type("X");
    const [lines = []] = await handBack(page);
    expect(lines[0]).toBe("X[G]Amazing [G7]grace, how [C]sweet the [G]sound");
    expect(lines[1]).toBe("That saved a wretch like [D]me");
  });

  test("adds a chord after the chords on a letter", async ({ page }) => {
    await clickChar(page, "before", "Amazing");
    await addBelow(page, "grace", 0, "C");
    expect((await firstSection(page))[0]).toBe(
      "[G]Amazing [G7][C]grace, how [C]sweet the [G]sound",
    );
  });

  test("adds a chord at the end of a line", async ({ page }) => {
    await clickChar(page, "before", "Amazing");
    const e = await charBox(page, "me", 1);
    await page.mouse.click(e.right + 20, e.bottom + 6);
    await page.getByLabel("Chord").fill("A");
    await page.keyboard.press("Enter");
    expect((await firstSection(page))[1]).toBe(
      "That saved a wretch like [D]me[A]",
    );
  });

  test("places the caret on a click on the lyrics", async ({ page }) => {
    await clickChar(page, "before", "wretch");
    await expect(page.getByLabel("Chord")).toHaveCount(0);
    await page.keyboard.type("X");
    expect((await firstSection(page))[1]).toBe(
      "That saved a Xwretch like [D]me",
    );
  });
});

test.describe("tapping below the lyrics", () => {
  test("places the caret", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), "Needs touch");
    await clickChar(page, "before", "Amazing");
    const r = await charBox(page, "wretch", 1);
    await afterSelectionChange(page, () =>
      page.touchscreen.tap(r.left + 1, r.bottom + 6),
    );
    await expect(page.locator(".chord-add")).toHaveCount(0);
    await expect(page.getByLabel("Chord")).toHaveCount(0);
    await page.keyboard.type("X");
    expect((await firstSection(page))[1]).toBe(
      "That saved a wXretch like [D]me",
    );
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
    // The active section's lines are taller, so make it active first.
    await clickChar(page, "before", "blind");
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

test.describe("dragging chords", () => {
  test("moves a chord onto a letter, in one undo step", async ({
    page,
  }, testInfo) => {
    await clickChar(page, "before", "Amazing");
    const target = await charBox(page, "wretch", 0);
    const drag = await startDrag(page, label(page, "D"), isPhone(testInfo));
    await drag.moveLabelTo(target.left, target.top - drag.height);
    await expect(page.locator(".chord-drop-caret")).toBeVisible();
    await drag.release();
    await expect(page.locator(".chord-drop-caret")).toHaveCount(0);
    await page.keyboard.press("ControlOrMeta+z");
    await page.keyboard.press("ControlOrMeta+Shift+z");
    await page.keyboard.type("X");
    const [lines = []] = await handBack(page);
    expect(lines[0]).toBe("X[G]Amazing [G7]grace, how [C]sweet the [G]sound");
    expect(lines[1]).toBe("That saved a [D]wretch like me");
  });

  test("cancels a drag on Escape", async ({ page }, testInfo) => {
    await clickChar(page, "before", "Amazing");
    const target = await charBox(page, "wretch", 0);
    const drag = await startDrag(page, label(page, "D"), isPhone(testInfo));
    await drag.moveLabelTo(target.left, target.top - drag.height);
    await page.keyboard.press("Escape");
    await expect(page.locator(".chord-drop-caret")).toHaveCount(0);
    await drag.release();
    await expect(activeSection(page)).toContainText("Amazing grace");
    expect((await firstSection(page))[1]).toBe(
      "That saved a wretch like [D]me",
    );
  });

  test("closes the chord input when a drag starts", async ({
    page,
  }, testInfo) => {
    await clickChar(page, "before", "Amazing");
    // The input opens below its chord, so use one below the dragged chord.
    await clickLabel(page, "Em");
    await page.getByLabel("Chord").fill("Am");
    const target = await charBox(page, "wretch", 0);
    const drag = await startDrag(page, label(page, "D"), isPhone(testInfo));
    await drag.moveLabelTo(target.left, target.top - drag.height);
    await expect(page.getByLabel("Chord")).toHaveCount(0);
    await drag.release();
    const [lines = []] = await handBack(page);
    expect(lines[1]).toBe("That saved a [D]wretch like me");
    expect(lines[3]).toBe("Was [Em]blind, but [D]now I [G]see");
  });

  test("only drops in the active section", async ({ page }, testInfo) => {
    await clickChar(page, "before", "Amazing");
    const target = await charBox(page, "Twas", 0);
    const drag = await startDrag(page, label(page, "D"), isPhone(testInfo));
    await drag.moveLabelTo(target.left, target.top - drag.height);
    await expect(page.locator(".chord-drop-caret")).toHaveCount(0);
    await drag.release();
    await expect(activeSection(page)).toContainText("Amazing grace");
    const [first = [], second = []] = await handBack(page);
    expect(first[1]).toBe("That saved a wretch like [D]me");
    expect(second[0]).toMatch(/^'Twas \[G\]grace/);
  });

  test("reorders a pile", async ({ page }, testInfo) => {
    await selectText(page, "grace, how sweet the ");
    await page.keyboard.press("Backspace");
    const g7 = await box(label(page, "G7"));
    const drag = await startDrag(page, label(page, "C"), isPhone(testInfo));
    await drag.moveLabelTo(g7.x, g7.y);
    const caret = await box(page.locator(".chord-drop-caret"));
    expect(Math.abs(caret.y - g7.y)).toBeLessThan(2);
    expect(caret.x).toBeLessThan(g7.x);
    await drag.release();
    expect((await firstSection(page))[0]).toBe("[G]Amazing [C][G7][G]sound");
  });

  test("drops a chord into a pile", async ({ page }, testInfo) => {
    await selectText(page, "grace, how sweet the ");
    await page.keyboard.press("Backspace");
    const c = await box(label(page, "C"));
    const drag = await startDrag(page, label(page, "G"), isPhone(testInfo));
    await drag.moveLabelTo(c.x - 2, c.y);
    await drag.release();
    expect((await firstSection(page))[0]).toBe("Amazing [G7][G][C][G]sound");
  });

  test("scrolls the page near the window's edge", async ({
    page,
  }, testInfo) => {
    // Tall enough that, scrolled to the end, the last line is clear of the
    // zone at the top. On touch, the page ends with room for the toolbar.
    await page.setViewportSize({ width: 412, height: 280 });
    const chord = label(page, "Cmaj7");
    await page.evaluate(
      (top) => {
        window.scrollBy(0, top - 60);
      },
      (await box(chord)).y,
    );
    await clickChar(page, "before", "Twas");
    const drag = await startDrag(page, chord, isPhone(testInfo));
    await drag.moveTo({ x: 100, y: 275 });
    await expect(page.locator(".chord-label.is-dragging")).toHaveCount(1);
    await page.waitForFunction(
      () =>
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 1,
    );
    const target = await charBox(page, "The hour", 0);
    await drag.moveLabelTo(target.left, target.top - drag.height);
    await drag.release();
    const [, second = []] = await handBack(page);
    expect(second[0]).not.toContain("Cmaj7");
    expect(second[3]).toBe("[Cmaj7]The [Em]hour I [D]first be[G]lieved");
  });

  test("drops a chord on the letter after a pile", async ({
    page,
  }, testInfo) => {
    await selectText(page, "grace, how sweet ");
    await page.keyboard.press("Backspace");
    const target = await charBox(page, "the", 1);
    const drag = await startDrag(page, label(page, "G"), isPhone(testInfo));
    await drag.moveLabelTo(target.left, target.top - drag.height);
    await drag.release();
    expect((await firstSection(page))[0]).toBe(
      "Amazing [G7][C]t[G]he [G]sound",
    );
  });
});

test.describe("dragging by touch", () => {
  test("lifts the label and the caret above the finger", async ({
    page,
  }, testInfo) => {
    test.skip(!isPhone(testInfo), "touch only");
    await clickChar(page, "before", "Amazing");
    const chord = label(page, "D");
    const before = await box(chord);
    const drag = await startDrag(page, chord, true);
    const lift = await liftOf(page);
    const lifted = await box(chord);
    expect(lifted.y).toBeCloseTo(before.y - lift, 0);
    // The label slid up while the finger held still, and the caret followed.
    const caret = await box(page.locator(".chord-drop-caret"));
    expect(caret.y).toBeGreaterThanOrEqual(lifted.y + lifted.height - 1);
    expect(caret.y + caret.height).toBeLessThan(drag.pointer().y);
    await drag.release();
  });

  test("drops on the letter under the label, not under the finger", async ({
    page,
  }, testInfo) => {
    test.skip(!isPhone(testInfo), "touch only");
    await clickChar(page, "before", "Amazing");
    const target = await charBox(page, "wretch", 0);
    const drag = await startDrag(page, label(page, "D"), true);
    await drag.moveLabelTo(target.left, target.top - drag.height);
    expect(drag.pointer().y).toBeGreaterThan(target.bottom);
    await drag.release();
    expect((await firstSection(page))[1]).toBe(
      "That saved a [D]wretch like me",
    );
  });

  test("keeps a label dragged by mouse under the pointer", async ({
    page,
  }, testInfo) => {
    test.skip(isPhone(testInfo), "mouse only");
    await clickChar(page, "before", "Amazing");
    const chord = label(page, "D");
    const drag = await startDrag(page, chord, false);
    const dragged = await box(chord);
    const { x, y } = drag.pointer();
    expect(x).toBeGreaterThanOrEqual(dragged.x);
    expect(x).toBeLessThanOrEqual(dragged.x + dragged.width);
    expect(y).toBeGreaterThanOrEqual(dragged.y);
    expect(y).toBeLessThanOrEqual(dragged.y + dragged.height);
    await drag.release();
  });

  test("scrolls up when the label nears the window's top", async ({
    page,
  }, testInfo) => {
    test.skip(!isPhone(testInfo), "touch only");
    await page.setViewportSize({ width: 412, height: 300 });
    const chord = label(page, "Cmaj7");
    const scrollLabelTo100 = async () => {
      await page.evaluate(
        (top) => {
          window.scrollBy(0, top - 100);
        },
        (await box(chord)).y,
      );
    };
    await scrollLabelTo100();
    await clickChar(page, "before", "Twas");
    // Again: the room for the active section's move buttons pushed it down.
    await scrollLabelTo100();
    const scrolled = await page.evaluate(() => window.scrollY);
    const drag = await startDrag(page, chord, true);
    // Well outside the 48px zone at the top.
    expect(drag.pointer().y).toBeGreaterThan(90);
    await page.waitForFunction(
      (before) => window.scrollY < before - 20,
      scrolled,
    );
    await drag.release();
  });
});

test.describe("the section toolbar", () => {
  test("shows above the active section only, with a mouse", async ({
    page,
  }) => {
    test.skip(await isTouch(page), "Needs a mouse");
    await expect(toolbar(page)).toHaveCount(0);
    await clickChar(page, "before", "Twas");
    const section = await box(activeSection(page));
    const bar = await box(toolbar(page));
    const firstLine = await box(activeSection(page).locator(".line").first());
    expect(bar.y).toBeGreaterThanOrEqual(section.y - 1);
    expect(bar.y + bar.height).toBeLessThanOrEqual(firstLine.y + 1);
    expect(bar.height).toBeGreaterThanOrEqual(44);
    await expect(addChordButton(page)).toBeVisible();
    await expect(moveButton(page, "up")).toBeEnabled();
    await expect(moveButton(page, "down")).toBeDisabled();
    const amazing = await charBox(page, "Amazing", 0);
    await page.mouse.move(amazing.left + 1, amazing.y);
    await expect(toolbar(page)).toHaveCount(1);
    expect((await box(toolbar(page))).y).toBe(bar.y);
  });

  test("is docked at the bottom of the window on touch", async ({ page }) => {
    test.skip(!(await isTouch(page)), "Needs touch");
    await tapChar(page, "Twas", 0);
    const height = page.viewportSize()?.height ?? 0;
    const atBottom = async () => {
      const bar = await box(toolbar(page));
      expect(Math.abs(bar.y + bar.height - height)).toBeLessThan(1);
    };
    await atBottom();
    expect(
      await addChordButton(page).evaluate((b: HTMLElement) => b.offsetHeight),
    ).toBe(44);
    await page.evaluate(() => {
      window.scrollBy(0, 80);
    });
    await nextLayout(page);
    await atBottom();
    await expect(toolbar(page)).toHaveCount(1);
  });

  test("keeps the caret above the docked toolbar", async ({ page }) => {
    test.skip(!(await isTouch(page)), "Needs touch");
    const height = page.viewportSize()?.height ?? 0;
    // The line near the window's bottom, where the toolbar will be.
    const r = await charBox(page, "relieved", 0);
    await page.evaluate(
      (y) => {
        window.scrollBy(0, y);
      },
      r.y - (height - 25),
    );
    await tapChar(page, "relieved", 0);
    await nextLayout(page);
    const caret = await caretLineBox(page);
    const bar = await box(toolbar(page));
    expect(caret.y + caret.height).toBeLessThanOrEqual(bar.y);
  });

  test("draws the docked toolbar over the chord input", async ({ page }) => {
    test.skip(!(await isTouch(page)), "Needs touch");
    // Room to scroll the chord input down to the toolbar.
    await page.evaluate(() => {
      const main = document.querySelector("main");
      if (main) main.style.paddingTop = "1500px";
      window.scrollTo(0, 1500);
    });
    await tapChar(page, "wretch", 1);
    await press(page, addChordButton(page));
    const input = await box(page.locator(".chord-input"));
    const bar = await box(toolbar(page));
    // Scrolls the chord input under the toolbar.
    await page.evaluate(
      (by) => {
        window.scrollBy(0, by);
      },
      input.y - (bar.y + 4),
    );
    await nextLayout(page);
    const x = input.x + input.width / 2;
    const y = (await box(toolbar(page))).y + 20;
    expect(
      await page.evaluate(
        ([x, y]) =>
          document.elementFromPoint(x, y)?.closest(".section-toolbar") !== null,
        [x, y] as const,
      ),
    ).toBe(true);
  });

  test("disables moving the first section up", async ({ page }) => {
    await place(page, "Amazing", 0);
    await expect(moveButton(page, "up")).toBeDisabled();
    await expect(moveButton(page, "down")).toBeEnabled();
  });

  test("has no move buttons with a single section", async ({ page }) => {
    await place(page, "'Twas", 0);
    await page.keyboard.press("Backspace");
    await expect(page.locator(".section")).toHaveCount(1);
    await expect(moveButton(page, "up")).toBeHidden();
    await expect(addChordButton(page)).toBeVisible();
  });

  test("moves a section up, keeping the caret and the active section", async ({
    page,
  }) => {
    await splitAfterMe(page);
    await place(page, "Was ", 3);
    await press(page, moveButton(page, "up"));
    await expect(page.locator(".section").first()).toContainText("I once");
    await expect(activeSection(page)).toContainText("I once");
    await expect(page.locator(".ProseMirror")).toBeFocused();
    await page.keyboard.type("X");
    const sections = await handBack(page);
    expect(sections.map((lines) => lines[0]?.split(" ")[0])).toEqual([
      "I",
      "[G]Amazing",
      "'Twas",
    ]);
    expect(sections[0]?.[1]).toBe("WasX [Em]blind, but [D]now I [G]see");
  });

  test("undoes a move in one step, with the section active", async ({
    page,
  }) => {
    await splitAfterMe(page);
    await place(page, "Was", 0);
    await press(page, moveButton(page, "down"));
    await expect(page.locator(".section").last()).toContainText("I once");
    await page.keyboard.press("ControlOrMeta+z");
    await expect(page.locator(".section").nth(1)).toContainText("I once");
    await expect(activeSection(page)).toContainText("I once");
  });

  test("keeps the move button in place to press again", async ({ page }) => {
    await splitAfterMe(page);
    await place(page, "'Twas", 0);
    // Room to scroll both ways.
    await page.evaluate(() => {
      const main = document.querySelector("main");
      if (main) main.style.padding = "1500px 0";
    });
    await moveButton(page, "up").scrollIntoViewIfNeeded();
    await nextLayout(page);
    const up = await box(moveButton(page, "up"));
    const x = up.x + up.width / 2;
    const y = up.y + up.height / 2;
    const touch = await isTouch(page);
    const pressAgain = () =>
      touch ? page.touchscreen.tap(x, y) : page.mouse.click(x, y);
    await pressAgain();
    await expect(page.locator(".section").nth(1)).toContainText("'Twas");
    await nextLayout(page);
    expect(Math.abs((await box(moveButton(page, "up"))).y - up.y)).toBeLessThan(
      1,
    );
    await pressAgain();
    await expect(page.locator(".section").first()).toContainText("'Twas");
    // The caret stays in view, above the toolbar.
    const caret = await caretLineBox(page);
    expect(caret.y).toBeGreaterThanOrEqual(0);
    if (touch) {
      expect(caret.y + caret.height).toBeLessThanOrEqual(
        (await box(toolbar(page))).y,
      );
    }
  });

  test("adds a chord on a letter, in one undo step, keeping the caret", async ({
    page,
  }) => {
    await place(page, "wretch", 1);
    await press(page, addChordButton(page));
    await page.getByLabel("Chord").fill("Am");
    await page.keyboard.press("Enter");
    const r = await charBox(page, "wretch", 1);
    const am = await box(label(page, "Am"));
    expect(Math.abs(am.x - r.left)).toBeLessThan(2);
    await page.keyboard.press("ControlOrMeta+z");
    await expect(page.locator(".chord-label", { hasText: "Am" })).toHaveCount(
      0,
    );
    await page.keyboard.type("X");
    expect((await firstSection(page))[1]).toBe(
      "That saved a wXretch like [D]me",
    );
  });

  test("adds a chord after the chords on a letter", async ({ page }) => {
    await place(page, "grace", 0);
    await press(page, addChordButton(page));
    await page.getByLabel("Chord").fill("C");
    await page.keyboard.press("Enter");
    expect((await firstSection(page))[0]).toBe(
      "[G]Amazing [G7][C]grace, how [C]sweet the [G]sound",
    );
  });

  test("adds a chord at the caret's end of a selection", async ({ page }) => {
    await place(page, "wretch", 0);
    await page.keyboard.press("Shift+ArrowRight");
    await afterSelectionChange(page, () =>
      page.keyboard.press("Shift+ArrowRight"),
    );
    await press(page, addChordButton(page));
    await page.getByLabel("Chord").fill("Am");
    await page.keyboard.press("Enter");
    expect((await firstSection(page))[1]).toBe(
      "That saved a wr[Am]etch like [D]me",
    );
  });
});

function activeSection(page: Page) {
  return page.locator(".section.is-active");
}

function toolbar(page: Page) {
  return page.getByRole("toolbar", { name: "Section" });
}

function addChordButton(page: Page) {
  return toolbar(page).getByRole("button", { name: "+ Chord" });
}

function moveButton(page: Page, direction: "up" | "down") {
  return toolbar(page).getByRole("button", {
    name: `Move section ${direction}`,
  });
}

// Whether the page's main pointer is a finger, as on the phone project. The
// toolbar uses the same rule.
function isTouch(page: Page) {
  return page.evaluate(() => matchMedia("(pointer: coarse)").matches);
}

// Puts the caret in front of the letter of `needle` at `offset`: by tap on
// a touch device, by click otherwise.
async function place(page: Page, needle: string, offset: number) {
  if (await isTouch(page)) await tapChar(page, needle, offset);
  else await clickChar(page, "before", needle, offset);
}

// The box of the line with the text caret, chords included.
function caretLineBox(page: Page) {
  return page.evaluate(() => {
    const node = getSelection()?.focusNode;
    const element = node instanceof Element ? node : node?.parentElement;
    const line = element?.closest(".line");
    if (!line) throw new Error("no caret");
    const { x, y, width, height } = line.getBoundingClientRect();
    return { x, y, width, height };
  });
}

// Taps on a touch device, clicks otherwise.
async function press(page: Page, button: Locator) {
  await ((await isTouch(page)) ? button.tap() : button.click());
}

// Splits the seed song's first section after "me", which makes three
// sections: "Amazing grace", "I once was lost" and "'Twas grace".
async function splitAfterMe(page: Page) {
  await clickChar(page, "after", "me", 1);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(page.locator(".section")).toHaveCount(3);
}

function linesOf(page: Page, section: number) {
  return page.locator(".section").nth(section).locator(".line");
}

function isPhone(testInfo: { project: { name: string } }) {
  return testInfo.project.name === "phone";
}

function label(page: Page, chord: string) {
  return page
    .locator(".chord-label", { hasText: new RegExp(`^${chord}$`) })
    .first();
}

async function box(locator: Locator) {
  await nextLayout(locator.page());
  const found = await locator.boundingBox();
  if (!found) throw new Error("no box");
  return found;
}

interface Point {
  x: number;
  y: number;
}

// Presses on a chord label, with the mouse or by touch, moves it far enough
// to start dragging, and returns a way to move it and let go. The label
// keeps its offset to the pointer, which is larger once a touch lifts it.
async function startDrag(page: Page, chord: Locator, touch: boolean) {
  const from = await box(chord);
  const cdp = touch ? await page.context().newCDPSession(page) : null;
  const send = (
    type: "touchStart" | "touchMove" | "touchEnd",
    points: Point[],
  ) => cdp?.send("Input.dispatchTouchEvent", { type, touchPoints: points });
  let at = { x: from.x + 2, y: from.y + from.height / 2 };
  if (touch) await send("touchStart", [at]);
  else {
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
  }
  const moveTo = async (to: Point, steps = [0.25, 0.5, 0.75, 1]) => {
    for (const t of steps) {
      const point = {
        x: at.x + (to.x - at.x) * t,
        y: at.y + (to.y - at.y) * t,
      };
      if (touch) await send("touchMove", [point]);
      else await page.mouse.move(point.x, point.y);
    }
    at = to;
  };
  // One move starts the drag, then the pointer holds still while a lifted
  // label slides up.
  await moveTo({ x: at.x + 8, y: at.y }, [1]);
  await chord.evaluate((label) =>
    Promise.all(label.getAnimations().map((animation) => animation.finished)),
  );
  const lifted = await chord.boundingBox();
  if (!lifted) throw new Error("no box");
  const grip = { x: at.x - lifted.x, y: at.y - lifted.y };
  return {
    height: from.height,
    // The pointer, for tests that check where it is.
    pointer: () => at,
    moveTo,
    // Moves the pointer so the label's top left corner is at `left`, `top`.
    moveLabelTo: (left: number, top: number) =>
      moveTo({ x: left + grip.x, y: top + grip.y }),
    release: async () => {
      if (touch) await send("touchEnd", []);
      else await page.mouse.up();
    },
  };
}

// How far a touch lifts a dragged label, in pixels.
function liftOf(page: Page) {
  return page
    .locator(".chord-layer")
    .evaluate((layer) =>
      parseFloat(
        getComputedStyle(layer).getPropertyValue("--chord-layer-lift"),
      ),
    );
}

// Pastes plain text, or HTML, at the caret, as the browser does.
async function paste(page: Page, text: string, html?: string) {
  await page.locator(".ProseMirror").evaluate(
    (editor, [text, html]) => {
      const data = new DataTransfer();
      data.setData("text/plain", text);
      if (html) data.setData("text/html", html);
      editor.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
    },
    [text, html] as const,
  );
}

// Where the browser draws the caret.
function caretBox(page: Page) {
  return page.evaluate(() => {
    const range = window.getSelection()?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();
    return rect ? { left: rect.left, top: rect.top } : null;
  });
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

// A point just below the letter of `needle` at `offset`, in the band under
// the lyrics.
async function below(
  page: Page,
  needle: string,
  offset: number,
): Promise<[number, number]> {
  const char = await charBox(page, needle, offset);
  return [(char.left + char.right) / 2, char.bottom + 6];
}

// Clicks below a letter and enters a chord in the chord input.
async function addBelow(
  page: Page,
  needle: string,
  offset: number,
  chord: string,
) {
  await page.mouse.click(...(await below(page, needle, offset)));
  await page.getByLabel("Chord").fill(chord);
  await page.keyboard.press("Enter");
}

// Taps just inside the left edge of the letter of `needle` at `offset`, so
// the caret lands in front of it.
async function tapChar(page: Page, needle: string, offset: number) {
  const box = await charBox(page, needle, offset);
  await afterSelectionChange(page, () =>
    page.touchscreen.tap(box.left + 1, box.y),
  );
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

// Waits until the browser has drawn the latest change.
async function nextLayout(page: Page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}

async function charBox(page: Page, needle: string, offset: number) {
  await nextLayout(page);
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
          top: rect.top,
          bottom: rect.bottom,
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
