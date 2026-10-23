import type { EditorView } from "prosemirror-view";

// The letter at a point on screen, as the position right before it. Past
// the last letter of a line, this is the end of the line.
export function letterAt(view: EditorView, x: number, y: number) {
  const hit = view.posAtCoords({ left: x, top: y });
  if (!hit) return null;
  const $pos = view.state.doc.resolve(hit.pos);
  if (!$pos.parent.inlineContent) return null;
  const before = hit.pos > $pos.start() ? hit.pos - 1 : null;
  const after = hit.pos < $pos.end() ? hit.pos : null;
  for (const pos of [before, after]) {
    if (pos === null) continue;
    const start = view.coordsAtPos(pos, 1);
    const end = view.coordsAtPos(pos + 1, -1);
    if (start.top === end.top && x >= start.left && x <= end.left) return pos;
  }
  return after ?? $pos.end();
}

// Where the app places something for the letter after `pos`, such as the
// chord input: the letter's left edge, top and bottom, in window
// coordinates.
export interface Anchor {
  left: number;
  top: number;
  bottom: number;
}

export function anchorAt(view: EditorView, pos: number): Anchor {
  const { left, top, bottom } = view.coordsAtPos(pos);
  return { left, top, bottom };
}
