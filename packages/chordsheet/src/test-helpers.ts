import { readChord } from "./chord-symbol";
import type { ChordSheet, Line, Section } from "./sheet";

export function sheet(...sections: Section[]): ChordSheet {
  return { format: "chordsheet", version: 1, sections };
}

export function section(...lines: Line[]): Section {
  return { lines };
}

export function labeled(label: string, ...lines: Line[]): Section {
  return { label, lines };
}

// A line with chords given as [at, chord text] pairs.
export function line(text: string, ...chords: [number, string][]): Line {
  return {
    text,
    chords: chords.map(([at, chord]) => ({ at, ...read(chord) })),
  };
}

// Reads chord text, and throws when it isn't a chord, so a typo in a test
// fails loudly.
export function read(chord: string) {
  const symbol = readChord(chord);
  if (!symbol) throw new Error(`Not a chord: ${chord}`);
  return symbol;
}
