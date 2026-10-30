// Chord marks: how a chord is played in a song, written as brackets around
// the chord, such as "(C)" or "[C]".

import { type ChordSymbol, readChord, writeChord } from "./chord-symbol";

// "held": the chord before it is still sounding, written "(C)".
// "optional": the chord may be left out, written "[C]".
export type ChordMark = "held" | "optional";

export const CHORD_MARKS: readonly ChordMark[] = ["held", "optional"];

// A chord with its mark. The mark is left out when the chord has none.
export interface MarkedChord extends ChordSymbol {
  mark?: ChordMark;
}

const BRACKETS = { held: ["(", ")"], optional: ["[", "]"] } as const;

// Reads typed chord text, such as "(C)" or "Am", or returns null when it
// isn't a chord. Brackets around the whole chord give its mark.
export function readMarkedChord(text: string): MarkedChord | null {
  const typed = text.trim();
  for (const mark of CHORD_MARKS) {
    const [open, close] = BRACKETS[mark];
    if (typed.startsWith(open) && typed.endsWith(close)) {
      const chord = readChord(typed.slice(open.length, -close.length));
      return chord && { ...chord, mark };
    }
  }
  return readChord(typed);
}

export function writeMarkedChord(chord: MarkedChord): string {
  const text = writeChord(chord);
  if (!chord.mark) return text;
  const [open, close] = BRACKETS[chord.mark];
  return `${open}${text}${close}`;
}
