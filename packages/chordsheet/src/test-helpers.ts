import type { ChordSheet, Line, Section } from "./sheet";

export function sheet(...sections: Section[]): ChordSheet {
  return { format: "chordsheet", version: 1, sections };
}

export function section(...lines: Line[]): Section {
  return { lines };
}

// A line with chords given as [at, chord] pairs.
export function line(text: string, ...chords: [number, string][]): Line {
  return { text, chords: chords.map(([at, chord]) => ({ at, chord })) };
}
