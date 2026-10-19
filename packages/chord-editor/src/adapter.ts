import {
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

// Converts between a stored section (`chordsheet`) and the editor. The
// editor puts chords after the last letter on a trailing space and gives
// every chord an id; the stored section has neither.

export function docFromSection(section: Section): Node {
  const lines = section.lines.map(lineToEditor);
  return schema.nodes.doc.create(
    null,
    lines.length > 0 ? lines : [schema.nodes.line.create()],
  );
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
  // No section means that nothing was left after clean-up.
  | { ok: true; section: Section | undefined }
  | { ok: false; problems: Problem[] };

// Turns the editor's draft back into a stored section: cleaned up, and
// checked against the model's rules.
export function handBackSection(doc: Node): HandBack {
  const lines: Line[] = [];
  doc.forEach((node) => {
    lines.push(normalize(lineFromEditor(node)));
  });
  const section = cleanUpSection({ lines });
  if (!section) return { ok: true, section: undefined };
  const problems = checkSheet({
    format: FORMAT,
    version: VERSION,
    sections: [section],
  });
  return problems.length > 0 ? { ok: false, problems } : { ok: true, section };
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
