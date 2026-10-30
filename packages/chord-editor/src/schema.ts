import { isBlank, type MarkedChord } from "chordsheet";
import { type Mark, type Node, Schema } from "prosemirror-model";

// The editor's own model of a sheet: sections of lines. The adapter converts
// it to and from the stored model in `chordsheet`.

// A chord in its canonical form, as stored, with an id instead of a position.
export interface Chord extends MarkedChord {
  // Tells a chord that was deleted apart from one that was only moved. Only
  // the editor uses ids; they are not stored.
  id: string;
}

// The chord's parts and mark without its id.
export function symbolOf({
  root,
  suffix,
  bass,
  mark,
}: MarkedChord): MarkedChord {
  return {
    root,
    ...(suffix === undefined ? {} : { suffix }),
    ...(bass === undefined ? {} : { bass }),
    ...(mark === undefined ? {} : { mark }),
  };
}

export function newChordId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const schema = new Schema({
  nodes: {
    doc: { content: "section+" },
    section: {
      // Null when the section has no label. The section's node view draws
      // it; it isn't part of the editable text or the clipboard.
      attrs: { label: { default: null } },
      content: "line+",
      parseDOM: [{ tag: "section" }],
      toDOM: () => ["section", { class: "section" }, 0],
    },
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

// The section's label, or null when it has none.
export function labelOf(section: Node): string | null {
  return (section.attrs as { label: string | null }).label;
}

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

// Calls `f` for every line, with the position right before it.
export function forEachLine(doc: Node, f: (line: Node, pos: number) => void) {
  doc.descendants((node, pos) => {
    if (node.type !== schema.nodes.line) return true;
    f(node, pos);
    return false;
  });
}

// A line without chords whose text is empty or only spaces. The chord sheet
// model drops such lines.
export function isEmptyLine(line: Node): boolean {
  if (!isBlank(line.textContent)) return false;
  let empty = true;
  line.forEach((child) => {
    if (chordsOn(child).length > 0) empty = false;
  });
  return empty;
}
