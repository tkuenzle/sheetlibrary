import fontWidths from "./font-widths.json";

// How wide each character of the lyrics font is, in em, by weight. Written
// by scripts/font-widths.ts from the font files.
export type Weight = 400 | 700;
export type Widths = Record<Weight, Partial<Record<string, number>>>;

export const lyricsFontWidths: Widths = fontWidths;

// How wide `text` is in the lyrics font, in em, without kerning. A character
// the font doesn't have counts as 1em: too wide gives a chord more room than
// it needs, never less.
export function widthOf(text: string, weight: Weight, widths: Widths): number {
  let width = 0;
  for (const char of text) width += widths[weight][char] ?? 1;
  return width;
}
