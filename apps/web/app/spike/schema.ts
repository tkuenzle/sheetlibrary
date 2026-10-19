import { type Mark, type Node, Schema } from "prosemirror-model";

// Throwaway editor spike (M1). See openspec/changes/editor-spike.

export interface Chord {
  // Tells a chord that was deleted apart from one that was only moved.
  id: string;
  // The text the user typed, for example "Bb" or "A#". Never parsed.
  name: string;
}

export function newChordId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const schema = new Schema({
  nodes: {
    doc: { content: "line+" },
    line: {
      content: "text*",
      marks: "chord",
      parseDOM: [{ tag: "p" }],
      toDOM: () => ["p", { class: "line" }, 0],
    },
    text: {},
  },
  marks: {
    // The chords on one letter, in order. The editor keeps this mark on a
    // single letter and never lets it spread to typed text.
    chord: {
      attrs: { chords: {} },
      inclusive: false,
      parseDOM: [
        {
          tag: "span.chorded",
          getAttrs: (dom) => ({
            chords: JSON.parse(dom.dataset.chords ?? "[]") as Chord[],
          }),
        },
      ],
      toDOM: (mark) => [
        "span",
        { class: "chorded", "data-chords": JSON.stringify(chordsOf(mark)) },
        0,
      ],
    },
  },
});

export function chordsOf(mark: Mark): Chord[] {
  return (mark.attrs as { chords: Chord[] }).chords;
}

export function chordMark(chords: Chord[]): Mark {
  return schema.marks.chord.create({ chords });
}

// The chords on the letter of a text node, if any.
export function chordsOn(node: Node | null | undefined): Chord[] {
  const mark = node ? schema.marks.chord.isInSet(node.marks) : undefined;
  return mark ? chordsOf(mark) : [];
}
