// Chord suggestions for the chord input: the chords a sheet uses, the
// chords of its key, and completions of what is typed.

import type { ChordMark } from "./chord-mark";
import { type ChordSymbol, readChord, writeChord } from "./chord-symbol";
import { chordsOfKey, type Key } from "./keys";

export interface Suggestion {
  // Without a mark: the input puts back the one typed.
  chord: ChordSymbol;
  // Whether the sheet already uses the chord.
  inSheet: boolean;
}

// Common suffixes, in the order completions are offered.
const SUFFIXES = [
  "",
  "m",
  "7",
  "maj7",
  "m7",
  "sus4",
  "sus2",
  "6",
  "m6",
  "9",
  "m9",
  "add9",
  "7sus4",
  "dim",
  "aug",
  "m7b5",
];

// Bass notes offered after a "/" when the sheet has no key.
const NATURALS = ["C", "D", "E", "F", "G", "A", "B"];

const OPENERS: Record<string, ChordMark> = { "(": "held", "[": "optional" };
const CLOSERS: Record<ChordMark, string> = { held: ")", optional: "]" };

// The mark typed before the chord, as in "(d", even before the bracket is
// closed.
export function typedMark(text: string): ChordMark | undefined {
  return OPENERS[text.trim().charAt(0)];
}

// The suggestions for the typed text, in order, each chord once. With no
// text, the sheet's chords, the most used first, then the key's chords. With
// text, those that start with it, then completions of the typed root.
export function suggestChords(
  text: string,
  sheetChords: ChordSymbol[],
  key: Key | null,
): Suggestion[] {
  const typed = withoutMark(text);
  const prefix = prefixOf(typed);
  const inSheet = new Set(sheetChords.map(writeChord));
  const shown = new Set<string>();
  const suggestions: Suggestion[] = [];
  const offer = (chord: ChordSymbol) => {
    const written = writeChord(chord);
    if (shown.has(written) || !written.startsWith(prefix)) return;
    shown.add(written);
    suggestions.push({ chord: plain(chord), inSheet: inSheet.has(written) });
  };
  byUse(sheetChords).forEach(offer);
  if (key) chordsOfKey(key).forEach(offer);
  if (typed) completions(typed, key).forEach(offer);
  return suggestions;
}

// The text inside a typed mark, closed or not.
function withoutMark(text: string): string {
  const typed = text.trim();
  const mark = typedMark(typed);
  if (!mark) return typed;
  const inner = typed.slice(1);
  return (inner.endsWith(CLOSERS[mark]) ? inner.slice(0, -1) : inner).trim();
}

// What a suggestion starts with: the chord's canonical form when the text
// reads as one, else the text with the root's letter in upper case.
function prefixOf(typed: string): string {
  const chord = readChord(typed);
  if (chord) return writeChord(chord);
  const text = typed.replaceAll("♭", "b").replaceAll("♯", "#");
  return /^[a-g]/.test(text)
    ? text.charAt(0).toUpperCase() + text.slice(1)
    : text;
}

// The sheet's chords, each once, the most used first. A tie goes to the one
// used first.
function byUse(chords: ChordSymbol[]): ChordSymbol[] {
  const counts = new Map<string, { chord: ChordSymbol; count: number }>();
  for (const chord of chords) {
    const written = writeChord(chord);
    const entry = counts.get(written);
    if (entry) entry.count++;
    else counts.set(written, { chord, count: 1 });
  }
  // Map keeps the order of first use, and the sort is stable.
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map(({ chord }) => chord);
}

// The typed root with common suffixes, or, after a "/", the typed chord over
// the notes of the key.
function completions(typed: string, key: Key | null): ChordSymbol[] {
  const slash = typed.lastIndexOf("/");
  if (slash >= 0) {
    const chord = readChord(typed.slice(0, slash));
    if (!chord) return [];
    const notes = key
      ? [...new Set(chordsOfKey(key).map((c) => c.root))]
      : NATURALS;
    return notes
      .filter((note) => note !== chord.root)
      .map((bass) => ({ ...plain(chord), bass }));
  }
  const root = readChord(/^[A-Ga-g][#b♭♯]?/.exec(typed)?.[0] ?? "")?.root;
  if (!root) return [];
  return SUFFIXES.map((suffix) => (suffix ? { root, suffix } : { root }));
}

function plain({ root, suffix, bass }: ChordSymbol): ChordSymbol {
  return {
    root,
    ...(suffix ? { suffix } : {}),
    ...(bass ? { bass } : {}),
  };
}
