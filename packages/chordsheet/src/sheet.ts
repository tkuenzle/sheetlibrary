// The stored content of a chord sheet, version 1. Metadata such as the title
// belongs to the sheet around it and is not part of this model.

export const FORMAT = "chordsheet";
export const VERSION = 1;

export interface ChordSheet {
  format: typeof FORMAT;
  version: typeof VERSION;
  sections: Section[];
}

// The longest label a section can have, in UTF-16 code units.
export const LABEL_MAX = 40;

// A group of lines, such as a verse.
export interface Section {
  // A name such as "Chorus" or "Verse 2": free text, never parsed. Left out
  // when the section has none. One line, not empty, at most LABEL_MAX long.
  label?: string;
  lines: Line[];
}

export interface Line {
  // No line breaks. In NFC: whatever writes text into a sheet, such as the
  // editor or an import, normalizes it.
  text: string;
  // Sorted by `at`. Chords at the same position keep their order (a pile).
  chords: Chord[];
}

export interface Chord {
  // An index into the line's text in UTF-16 code units, like a JS string
  // index. 0 is before the first letter, `text.length` after the last.
  at: number;
  // The text the user typed, for example "Bb" or "A#". Never parsed.
  chord: string;
}
