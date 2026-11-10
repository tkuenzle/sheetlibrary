import { expect, type Page, test } from "@playwright/test";

import { harnessURL } from "./servers";

// The sheet view on its harness page (harness/sheet-view.tsx), with lines
// that are hard to lay out. See openspec/specs/sheet-view.
test.use({ baseURL: harnessURL });

// The layout depends on the width, not on touch: one project is enough.
test.skip(({ isMobile }) => isMobile, "Widths are set per test");

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/sheet-view.html");
  await expect(page.locator(".sheet-view-line").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

// Measures the view: what goes wrong where, as text for the failure message.
function measure(page: Page) {
  return page.evaluate(() => {
    const view = document.querySelector<HTMLElement>(".sheet-view");
    if (!view) throw new Error("No sheet view");
    const em = parseFloat(getComputedStyle(view).fontSize);
    const sameRow = (a: DOMRect, b: DOMRect) => Math.abs(a.top - b.top) < 2;
    const isLetter = (char: string | undefined) =>
      char !== undefined && /[\p{L}\p{M}\p{N}'’]/u.test(char);
    const overlaps: string[] = [];
    const extraSpace: string[] = [];
    const narrowDashes: string[] = [];
    const gapsWithoutDash: string[] = [];

    for (const line of document.querySelectorAll(".sheet-view-line")) {
      const where = line.textContent.slice(0, 24);
      const names = [...line.querySelectorAll(".sheet-view-chord")].map(
        (name) => name.getBoundingClientRect(),
      );
      for (const [i, name] of names.entries()) {
        const before = names[i - 1];
        // A name's box ends with the space after it.
        if (before && sameRow(before, name)) {
          if (name.left < before.right - 0.3 * em - 0.5) overlaps.push(where);
        }
      }

      const pieces = [...line.querySelectorAll(".sheet-view-piece")];
      for (const [i, piece] of pieces.entries()) {
        const text = piece.querySelector(".sheet-view-text");
        if (!text) continue;
        const words = text.textContent;
        const box = piece.getBoundingClientRect();
        const textBox = text.getBoundingClientRect();
        const gap = (box.width - textBox.width) / em;

        const next = pieces[i + 1];
        const nextText = next?.querySelector(".sheet-view-text")?.textContent;
        // Space at the end of a row doesn't show.
        if (!next || !sameRow(box, next.getBoundingClientRect())) continue;
        if (gap * em < 0.5) continue;
        const desc = `${where}… after "${words}": ${gap.toFixed(2)}em`;
        const chords = piece.querySelectorAll(".sheet-view-chord").length;
        const nextHasChords = next.querySelector(".sheet-view-chord") !== null;
        const pileOrSpace = chords > 1 || /^ ?$/.test(words);
        if (chords > 0 && !nextHasChords && !pileOrSpace) {
          extraSpace.push(desc);
        }
        const inWord = isLetter(words.at(-1)) && isLetter(nextText?.[0]);
        if (inWord && piece.classList.contains("has-dash")) {
          if (gap < 0.6 - 0.02) narrowDashes.push(desc);
        } else if (inWord && gap > 0.05) {
          gapsWithoutDash.push(desc);
        }
      }
    }
    return {
      overlaps,
      extraSpace,
      narrowDashes,
      gapsWithoutDash,
      scrollsSideways: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
}

for (const width of [320, 480, 800]) {
  test(`lays out the awkward lines ${String(width)}px wide`, async ({
    page,
  }) => {
    await open(page, width);
    expect(await measure(page)).toEqual({
      overlaps: [],
      extraSpace: [],
      narrowDashes: [],
      gapsWithoutDash: [],
      scrollsSideways: false,
    });
  });
}

// The width table has to fit the font, the weights and the chords' size.
// Words are drawn a little narrower than the table: it leaves out kerning,
// and browsers on Linux fit letters to whole pixels. The layout's margin
// covers that. Each letter on its own, at 200px, has neither, so a
// difference is a font or a style that changed without running the
// font-widths script.
test("draws each letter as wide as the width table says", async ({ page }) => {
  await open(page, 800);
  const off = await page.evaluate(() => {
    const view = document.querySelector<HTMLElement>(".sheet-view");
    if (!view) throw new Error("No sheet view");
    view.style.setProperty("--sheet-view-font-size", "200px");
    const em = 200;
    const chordSize = parseFloat(
      getComputedStyle(view).getPropertyValue("--sheet-view-chord-size"),
    );
    // Set by the harness page.
    const { textWidth } = window as unknown as {
      textWidth: (text: string, weight: 400 | 700) => number;
    };
    const letters = new Set(
      [
        ...document.querySelectorAll(".sheet-view-text, .sheet-view-chord"),
      ].flatMap((element) => Array.from(element.textContent)),
    );
    const probe = (className: string) => {
      const span = document.createElement("span");
      span.className = className;
      span.style.whiteSpace = "pre";
      view.append(span);
      return span;
    };
    const lyric = probe("");
    const chord = probe("sheet-view-chord");
    const space = parseFloat(getComputedStyle(chord).paddingRight);
    const off: string[] = [];
    const compare = (what: string, drawn: number, expected: number) => {
      if (Math.abs(drawn - expected) > 0.01) {
        off.push(
          `${what}: ${drawn.toFixed(3)} drawn, ${expected.toFixed(3)} in the table`,
        );
      }
    };
    for (const letter of letters) {
      lyric.textContent = letter;
      chord.textContent = letter;
      compare(
        `"${letter}"`,
        lyric.getBoundingClientRect().width / em,
        textWidth(letter, 400),
      );
      compare(
        `"${letter}" in a chord`,
        (chord.getBoundingClientRect().width - space) / em,
        textWidth(letter, 700) * chordSize,
      );
    }
    return off;
  });
  expect(off).toEqual([]);
});

test("keeps every row of lyrics the same distance apart", async ({ page }) => {
  await open(page, 800);
  const section = page
    .locator(".sheet-view-section")
    .filter({ hasText: "Chords only, no chords" });
  const lines = await section
    .locator(".sheet-view-line")
    .evaluateAll((all) => all.map((line) => line.getBoundingClientRect()));
  const [chordsOnly, noChords, withChords] = lines;
  if (!chordsOnly || !noChords || !withChords) throw new Error("Lines missing");
  // A line without chords is as tall as one with them, and a line of
  // chords only is shorter: it has no row of lyrics.
  expect(noChords.height).toBeCloseTo(withChords.height, 0);
  expect(chordsOnly.height).toBeLessThan(noChords.height * 0.6);
});

// Where the page breaks is up to the browser. This checks what the view asks
// of it, so a line keeps its chords and a label its first line, and that the
// dashes are drawn in a way that prints.
test("prints with its lines whole and its dashes on the paper", async ({
  page,
}) => {
  await open(page, 800);
  await page.emulateMedia({ media: "print" });
  const print = await page.evaluate(() => {
    const all = (selector: string) => [...document.querySelectorAll(selector)];
    return {
      linesWhole: all(".sheet-view-line").every(
        (line) => getComputedStyle(line).breakInside === "avoid",
      ),
      labelsWithFirstLine: all(".sheet-view-label").every(
        (label) => getComputedStyle(label).breakAfter === "avoid",
      ),
      dashes: all(".has-dash .sheet-view-dash").map((dash) => {
        const style = getComputedStyle(dash, "::after");
        return {
          // Chromium rounds a border's width to whole device pixels.
          border:
            style.borderTopStyle === "solid" &&
            parseFloat(style.borderTopWidth) > 0,
          background: style.backgroundImage,
        };
      }),
    };
  });
  expect(print.linesWhole).toBe(true);
  expect(print.labelsWithFirstLine).toBe(true);
  expect(print.dashes.length).toBeGreaterThan(0);
  for (const dash of print.dashes) {
    expect(dash).toEqual({ border: true, background: "none" });
  }
  const pdf = await page.pdf({ format: "A4" });
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
});
