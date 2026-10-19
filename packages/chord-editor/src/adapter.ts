import {
  type ChordSheet,
  checkSheet,
  cleanUpSection,
  FORMAT,
  type Line,
  type Problem,
  type Section,
  VERSION,
} from "chordsheet";
import type { Node } from "prosemirror-model";

import { type Chord, chordMark, chordsOn, newChordId, schema } from "./schema";

// Converts between a stored sheet (`chordsheet`) and the editor. The editor
// puts chords after the last letter on a trailing space and gives every
// chord an id; the stored sheet has neither.

export function docFromSheet(sheet: ChordSheet): Node {
  const sections = sheet.sections.map(sectionToEditor);
  // The editor needs one section to type in, even for an empty sheet.
  return schema.nodes.doc.create(
    null,
    sections.length > 0 ? sections : [emptySection()],
  );
}

export function emptySection(): Node {
  return schema.nodes.section.create(null, schema.nodes.line.create());
}

function sectionToEditor(section: Section): Node {
  return schema.nodes.section.create(null, section.lines.map(lineToEditor));
}

function lineToEditor(line: Line): Node {
  const piles = new Map<number, Chord[]>();
  for (const { at, chord } of line.chords) {
    piles.set(at, [...(piles.get(at) ?? []), { id: newChordId(), chord }]);
  }
  const text = piles.has(line.text.length) ? `${line.text} ` : line.text;
  const content: Node[] = [];
  let start = 0;
  for (const [at, chords] of [...piles].sort(([a], [b]) => a - b)) {
    if (at > start) content.push(schema.text(text.slice(start, at)));
    content.push(schema.text(text.slice(at, at + 1), [chordMark(chords)]));
    start = at + 1;
  }
  if (start < text.length) content.push(schema.text(text.slice(start)));
  return schema.nodes.line.create(null, content);
}

export type HandBack =
  { ok: true; sheet: ChordSheet } | { ok: false; problems: Problem[] };

// Turns the editor's draft back into a stored sheet: every section cleaned
// up, and the result checked against the model's rules.
export function handBackSheet(doc: Node): HandBack {
  const sections: Section[] = [];
  doc.forEach((node) => {
    const section = sectionFromEditor(node);
    if (section) sections.push(section);
  });
  const sheet: ChordSheet = { format: FORMAT, version: VERSION, sections };
  const problems = checkSheet(sheet);
  return problems.length > 0 ? { ok: false, problems } : { ok: true, sheet };
}

// The section as stored, cleaned up. Undefined when nothing is left.
function sectionFromEditor(node: Node): Section | undefined {
  const lines: Line[] = [];
  node.forEach((line) => {
    lines.push(normalize(lineFromEditor(line)));
  });
  return cleanUpSection({ lines });
}

function lineFromEditor(node: Node): Line {
  let text = "";
  const chords: Line["chords"] = [];
  node.forEach((child) => {
    for (const { chord } of chordsOn(child)) {
      chords.push({ at: text.length, chord });
    }
    text += child.text ?? "";
  });
  // A trailing space with chords only carries them. Without it, the
  // chords' position is the text's length, which is the same number.
  const last = text.length - 1;
  if (text.endsWith(" ") && chords.some((chord) => chord.at === last)) {
    text = text.slice(0, last);
  }
  return { text, chords };
}

// Normalizes text to NFC one run at a time between chord positions, so each
// chord keeps its place.
function normalize(line: Line): Line {
  const moved = new Map<number, number>();
  let text = "";
  let start = 0;
  for (const at of new Set(line.chords.map((chord) => chord.at))) {
    text += line.text.slice(start, at).normalize("NFC");
    moved.set(at, text.length);
    start = at;
  }
  text += line.text.slice(start).normalize("NFC");
  const chords = line.chords.map(({ at, chord }) => ({
    at: moved.get(at) ?? at,
    chord,
  }));
  return { text, chords };
}
