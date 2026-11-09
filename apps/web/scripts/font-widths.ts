// Writes app/sheet-view/font-widths.json: how wide each character of the
// lyrics font is, in em, at the weight of the lyrics and of the chords.
// Usage: pnpm --filter web font-widths, after the font package changes.
//
// The sheet view works out where chords need room from these widths. See
// openspec/specs/sheet-view.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { create, type Font } from "fontkit";
import { decompress } from "wawoff2";

// The weights the sheet view uses for lyrics and for chords.
const weights = [400, 700];

const files = ["latin", "latin-ext"].map((subset) =>
  fileURLToPath(
    import.meta.resolve(
      `@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-${subset}-wght-normal.woff2`,
    ),
  ),
);

const widths: Record<string, Record<string, number>> = {};
for (const weight of weights) widths[weight] = {};

for (const file of files) {
  // fontkit can't set the weight of a woff2 font: its glyphs come back empty.
  // The same font unpacked to TTF works.
  const ttf = Buffer.from(await decompress(readFileSync(file)));
  const font = create(ttf) as Font;
  for (const weight of weights) {
    const instance = font.getVariation({ wght: weight });
    const table = widths[weight] ?? {};
    for (const codePoint of font.characterSet) {
      // Control characters never show in lyrics.
      if (codePoint < 0x20 || (codePoint >= 0x7f && codePoint < 0xa0)) {
        continue;
      }
      const char = String.fromCodePoint(codePoint);
      if (char in table) continue;
      const { id } = font.glyphForCodePoint(codePoint);
      const width = instance.getGlyph(id).advanceWidth / font.unitsPerEm;
      table[char] = Math.round(width * 10000) / 10000;
    }
  }
}

const out = new URL("../app/sheet-view/font-widths.json", import.meta.url);
// One character per line, as Prettier writes it, so a new font shows as a diff.
writeFileSync(out, JSON.stringify(widths, null, 2) + "\n");
console.log(
  `Wrote ${String(Object.keys(widths[400] ?? {}).length)} characters to ${fileURLToPath(out)}`,
);
