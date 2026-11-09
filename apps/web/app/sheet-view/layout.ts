import { type ChordSheet, type Line, writeMarkedChord } from "chordsheet";

import { widthOf, type Widths } from "./widths";

// Lays a sheet out for the sheet view: chords in the text flow, above their
// letters. CSS does the rest: a piece is as wide as the wider of its chords
// and its text, so a chord pushes the lyrics only when its name needs the
// room. The widths here only decide where pieces end and where dashes go.
// See openspec/specs/sheet-view and the sheet-view change's design.

// Sizes in em of the lyrics. sheet-view.css gets them from SheetView, so the
// widths worked out here match what the browser draws.
export const CHORD_SIZE = 0.75;
// After each chord name, before the next name or letter.
export const CHORD_SPACE = 0.3;
// Room for what the widths leave out, such as kerning.
const MARGIN = 0.15;
// The narrowest space inside a word, so its dash shows.
export const DASH_MIN = 0.6;

// Lyrics with the chords above their start. `minWidth` is in em.
export interface Piece {
  chords: string[];
  text: string;
  dash: boolean;
  minWidth?: number;
}

// Pieces that stay on one row. A line wraps only between units.
export type Unit = Piece[];

export interface LaidOutLine {
  units: Unit[];
  // A line of chords only gets no row of lyrics.
  chordsOnly: boolean;
}

export interface LaidOutSection {
  label: string | null;
  lines: LaidOutLine[];
}

export function layoutSheet(
  sheet: ChordSheet,
  widths: Widths,
): LaidOutSection[] {
  return sheet.sections.map((section) => ({
    label: section.label ?? null,
    lines: section.lines.map((line) => layoutLine(line, widths)),
  }));
}

export function layoutLine(line: Line, widths: Widths): LaidOutLine {
  const units: Unit[] = [[]];
  for (const piece of piecesOf(line, widths)) {
    units.at(-1)?.push(piece);
    if (piece.text.endsWith(" ")) units.push([]);
  }
  return {
    units: units.filter((unit) => unit.length > 0),
    chordsOnly: line.text.trim() === "" && line.chords.length > 0,
  };
}

// The chords at each spot, with several at one spot as a pile.
function spotsOf(line: Line) {
  const spots: { at: number; chords: string[] }[] = [];
  for (const chord of line.chords) {
    const last = spots.at(-1);
    if (last?.at === chord.at) last.chords.push(writeMarkedChord(chord));
    else spots.push({ at: chord.at, chords: [writeMarkedChord(chord)] });
  }
  return spots;
}

function piecesOf(line: Line, widths: Widths): Piece[] {
  const { text } = line;
  const spots = spotsOf(line);
  const pieces: Piece[] = [];
  pieces.push(...plain(text.slice(0, spots[0]?.at ?? text.length)));
  for (const [i, { at, chords }] of spots.entries()) {
    const stretch = text.slice(at, spots[i + 1]?.at ?? text.length);
    const head = headOf(stretch, chords, widths);
    pieces.push(chorded(chords, head, text[at + head.length], widths));
    pieces.push(...plain(stretch.slice(head.length)));
  }
  return pieces;
}

// Where a chord's piece ends. A pile, or a chord on a space or at the end,
// holds one character, so the next letter starts past the names. A single
// chord on a letter runs to the next chord, or to the first space once its
// text is wider than the name: from there nothing can run into it.
function headOf(stretch: string, chords: string[], widths: Widths): string {
  if (chords.length > 1 || stretch === "" || stretch.startsWith(" ")) {
    return stretch.slice(0, 1);
  }
  const room = namesWidth(chords, widths) + MARGIN;
  for (let space = stretch.indexOf(" "); space !== -1;) {
    const before = stretch.slice(0, space);
    if (widthOf(before, 400, widths) >= room) return before;
    space = stretch.indexOf(" ", space + 1);
  }
  return stretch;
}

// A piece that ends inside a word gets a dash where its names may push the
// next letter away, and room for the dash to show. Where the names would
// come close to the next ones, a dash is better than a gap that may open in
// some browsers and not in others.
function chorded(
  chords: string[],
  text: string,
  next: string | undefined,
  widths: Widths,
): Piece {
  const inWord = isLetter(text.at(-1)) && isLetter(next);
  const textWidth = widthOf(text, 400, widths);
  const gap = namesWidth(chords, widths) - textWidth;
  const dash = inWord && gap > -MARGIN;
  return dash && gap < DASH_MIN
    ? { chords, text, dash, minWidth: round(textWidth + DASH_MIN) }
    : { chords, text, dash };
}

// Text without chords, as words with the spaces after them.
function plain(text: string): Piece[] {
  return (text.match(/[^ ]*(?: +|$)/g) ?? [])
    .filter((word) => word !== "")
    .map((word) => ({ chords: [], text: word, dash: false }));
}

// How wide a pile's names are side by side, each with the space after it.
function namesWidth(chords: string[], widths: Widths): number {
  return chords.reduce(
    (sum, name) => sum + widthOf(name, 700, widths) * CHORD_SIZE + CHORD_SPACE,
    0,
  );
}

function isLetter(char: string | undefined): boolean {
  return char !== undefined && /[\p{L}\p{M}\p{N}'’]/u.test(char);
}

function round(em: number): number {
  return Math.ceil(em * 1000) / 1000;
}
