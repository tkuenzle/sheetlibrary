import type { Node } from "prosemirror-model";

import { type Chord, chordMark, chordsOn, newChordId, schema } from "./schema";

// Just enough ChordPro to write seed songs and test cases: one line per line,
// chords in brackets before their letter. Directives are not supported.

export function docFromChordPro(text: string): Node {
  return schema.nodes.doc.create(null, text.split("\n").map(lineFromChordPro));
}

function lineFromChordPro(line: string): Node {
  const content: Node[] = [];
  let chords: Chord[] = [];
  const parts = line.split(/\[([^\]]*)\]/);
  for (const [index, part] of parts.entries()) {
    if (index % 2 === 1) {
      chords.push({ id: newChordId(), name: part });
      continue;
    }
    // Chords after the last letter sit on a trailing space.
    const last = index === parts.length - 1;
    const text = chords.length > 0 && !part && last ? " " : part;
    if (!text) continue;
    if (chords.length === 0) {
      content.push(schema.text(text));
      continue;
    }
    content.push(schema.text(text.slice(0, 1), [chordMark(chords)]));
    chords = [];
    if (text.length > 1) content.push(schema.text(text.slice(1)));
  }
  return schema.nodes.line.create(null, content);
}

export function docToChordPro(doc: Node): string {
  const lines: string[] = [];
  doc.forEach((line) => {
    let text = "";
    line.forEach((child) => {
      text += chordsOn(child)
        .map((chord) => `[${chord.name}]`)
        .join("");
      text += child.text ?? "";
    });
    lines.push(text);
  });
  return lines.join("\n");
}
