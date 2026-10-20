import { type EditorState, Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import { getActiveSection } from "./active-section";
import { getSelectedChord, moveChord } from "./chords";
import { letterAt } from "./letter";
import { type Chord, chordsOf, chordsOn } from "./schema";

// Chord labels live in a layer on top of the editor, outside the editable
// text. The text holds only letters, so phone keyboards never see chords,
// and the labels are real elements that can be tapped and dragged.

export interface ChordLayerOptions {
  // A click or tap on a chord's label, with the chord's id.
  onChordClick?: (id: string) => void;
  // A chord's label starts being dragged, with the chord's id.
  onDragStart?: (id: string) => void;
}

// Moving the pointer this far turns a press on a label into a drag.
const dragThreshold = 6;
// While dragging this close to the window's top or bottom, the page scrolls,
// up to `scrollSpeed` pixels per frame at the very edge.
const scrollZone = 48;
const scrollSpeed = 16;

export function chordLayer(options: ChordLayerOptions) {
  return new Plugin({
    props: {
      markViews: {
        chord: (mark) => {
          const dom = document.createElement("span");
          dom.className = "chorded";
          dom.dataset.chords = JSON.stringify(chordsOf(mark));
          dom.dataset.chordIds = chordsOf(mark)
            .map((chord) => chord.id)
            .join(" ");
          // The layer adds spacing to this span; the editor can ignore that.
          return {
            dom,
            ignoreMutation: (mutation) =>
              mutation.type === "attributes" && mutation.target === dom,
          };
        },
      },
    },
    view: (view) => new ChordLayerView(view, options),
  });
}

// Where a dragged chord lands: the letter after `pos`, at `index` among its
// chords, or after them.
interface Target {
  pos: number;
  index?: number;
}

interface Drag {
  id: string;
  label: HTMLElement;
  pointerId: number;
  // Where the drag started, and where the pointer is now.
  x: number;
  y: number;
  pointerX: number;
  pointerY: number;
  moved: boolean;
  // A finger covers what is under it, so a label dragged by touch is lifted
  // above it, and the chord lands under the lifted label.
  lifted: boolean;
  target: Target | null;
}

// A chorded letter and its labels, as one render lays them out.
interface Letter {
  span: HTMLElement;
  labels: HTMLElement[];
  sizes: { width: number; height: number }[];
  dimmed: boolean;
}

class ChordLayerView {
  private layer = document.createElement("div");
  private caret = document.createElement("div");
  // Labels by chord id, reused across renders so a label stays the same
  // element while it is tapped or dragged.
  private labels = new Map<string, HTMLElement>();
  // Dashes in words split by a pile, reused across renders.
  private dashes: HTMLElement[] = [];
  private drag: Drag | null = null;
  private scrollFrame = 0;
  // Called after layout and before paint, and once right after `observe`.
  private observer = new ResizeObserver(() => {
    this.render();
  });

  constructor(
    private view: EditorView,
    private options: ChordLayerOptions,
  ) {
    this.layer.className = "chord-layer";
    this.caret.className = "chord-drop-caret";
    view.dom.insertAdjacentElement("afterend", this.layer);
    this.layer.addEventListener("pointerdown", this.onPointerDown);
    this.layer.addEventListener("pointermove", this.onPointerMove);
    this.layer.addEventListener("pointerup", this.onPointerUp);
    this.layer.addEventListener("pointercancel", this.onPointerCancel);
    this.observer.observe(view.dom);
  }

  // Runs after the editor has updated its DOM, before the browser paints, so
  // the lyrics never show without their labels' spacing.
  update(view: EditorView, previous: EditorState) {
    if (
      view.state.doc !== previous.doc ||
      getSelectedChord(view.state) !== getSelectedChord(previous) ||
      getActiveSection(view.state) !== getActiveSection(previous)
    ) {
      this.render();
    } else if (!view.state.selection.eq(previous.selection)) {
      this.caretPastGap();
    }
  }

  destroy() {
    this.endDrag();
    this.observer.disconnect();
    this.layer.remove();
  }

  // Places every label above its letter, and makes room for the labels in
  // the lyrics. It runs on every change, so it reads the layout as few times
  // as it can: it writes a margin only when it changes, and places labels
  // and dashes last.
  private render() {
    if (this.drag) return;
    const letters = this.letters();
    const space = spacing(this.view.dom);
    this.spaceOut(letters, space);
    this.place(letters, space);
    this.caretPastGap();
  }

  // Both sides of a gap are the same position in the text, and typed text
  // lands after the gap. The browser draws the caret before the gap, so this
  // moves it to the start of the text after it. Not when the next letter has
  // chords: typing at its start could give them to the typed text.
  private caretPastGap() {
    const { selection } = this.view.state;
    const { $from } = selection;
    if (!selection.empty || !this.view.hasFocus()) return;
    if (chordsOn($from.nodeBefore).length === 0) return;
    if ($from.pos >= $from.end() || chordsOn($from.nodeAfter).length > 0) {
      return;
    }
    const letter = this.view.domAtPos($from.pos - 1, 1).node.parentElement;
    const span = letter?.closest<HTMLElement>("span.chorded");
    if (!span || marginOf(span, "marginRight") <= 0) return;
    const after = this.view.domAtPos($from.pos, 1);
    const text =
      after.node instanceof Text
        ? after.node
        : after.node.childNodes[after.offset];
    const dom = document.getSelection();
    if (!(text instanceof Text) || !dom) return;
    const offset = text === after.node ? after.offset : 0;
    if (dom.anchorNode === text && dom.anchorOffset === offset) return;
    dom.collapse(text, offset);
  }

  // The chorded letters with their labels, which are created, updated or
  // removed to match the chords.
  private letters(): Letter[] {
    const selected = getSelectedChord(this.view.state);
    const editing = getActiveSection(this.view.state) !== null;
    const seen = new Set<string>();
    const spans = this.view.dom.querySelectorAll<HTMLElement>("span.chorded");
    const letters = [...spans].map((span): Letter => {
      const chords = JSON.parse(span.dataset.chords ?? "[]") as Chord[];
      // Labels are outside their section, so they follow it here: only the
      // active section's labels can be clicked, and the others are dimmed.
      const active = span.closest(".section.is-active") !== null;
      const dimmed = editing && !active;
      const labels = chords.map((chord) => {
        seen.add(chord.id);
        return this.label(chord, selected, active, dimmed);
      });
      return { span, labels, sizes: [], dimmed };
    });
    for (const [id, label] of this.labels) {
      if (seen.has(id)) continue;
      label.remove();
      this.labels.delete(id);
    }
    for (const letter of letters) {
      letter.sizes = letter.labels.map((label) =>
        label.getBoundingClientRect(),
      );
    }
    return letters;
  }

  // Makes room for the labels, one line at a time. Where a label would run
  // into the previous one on the same row, the letter gets space in front of
  // it. After a pile, or chords on a space, the next letter starts past the
  // last label.
  private spaceOut(letters: Letter[], space: number) {
    let line: Element | null = null;
    let row: DOMRect | null = null;
    let end = -Infinity;
    for (const { span, sizes } of letters) {
      if (span.closest(".line") !== line) {
        line = span.closest(".line");
        row = null;
        end = -Infinity;
      }
      let box = span.getBoundingClientRect();
      let pushed = marginOf(span, "marginLeft");
      // The letter may only be on a new row because of its margin.
      if (pushed > 0 && !sameRow(box, row)) {
        setMargin(span, "marginLeft", 0);
        pushed = 0;
        box = span.getBoundingClientRect();
      }
      const pos = this.view.posAtDOM(span, 0);
      let clear = sameRow(box, row)
        ? Math.max(0, end + space - (box.left - pushed))
        : 0;
      // A gap inside a word gets a dash, and is at least 0.6em wide so the
      // dash stays visible.
      if (clear > 0 && this.inWord(pos)) clear = Math.max(clear, 2 * space);
      if (setMargin(span, "marginLeft", clear)) {
        box = span.getBoundingClientRect();
      }
      const width = labelsWidth(sizes, space);
      let gap =
        sizes.length > 1 || isSpace(span)
          ? Math.max(0, box.left + width + space - box.right)
          : 0;
      if (gap > 0 && this.inWord(pos + 1)) gap = Math.max(gap, 2 * space);
      // A margin can move the whole word to the next row.
      if (setMargin(span, "marginRight", gap)) {
        box = span.getBoundingClientRect();
      }
      end = box.left + width;
      row = box;
    }
  }

  // Places the labels above their letters, and the dashes in split words.
  // All reads come before the writes.
  private place(letters: Letter[], space: number) {
    const origin = this.layer.getBoundingClientRect();
    const spots = letters.map((letter) => ({
      box: letter.span.getBoundingClientRect(),
      dashes: this.dashesAround(letter),
    }));
    let dashes = 0;
    for (const [i, { labels, sizes, dimmed }] of letters.entries()) {
      const spot = spots[i];
      if (!spot) continue;
      let x = spot.box.left;
      for (const [j, label] of labels.entries()) {
        const size = sizes[j] ?? { width: 0, height: 0 };
        label.style.left = `${String(x - origin.left)}px`;
        label.style.top = `${String(spot.box.top - origin.top - size.height)}px`;
        x += size.width + space;
      }
      for (const gap of spot.dashes) {
        const dash = this.dash(dashes++, dimmed);
        const inset = (gap.right - gap.left) * 0.2;
        dash.style.left = `${String(gap.left + inset - origin.left)}px`;
        dash.style.width = `${String(gap.right - gap.left - 2 * inset)}px`;
        dash.style.top = `${String(gap.y - origin.top)}px`;
      }
    }
    for (const dash of this.dashes.splice(dashes)) dash.remove();
  }

  // The gaps inside a word next to a chorded letter, where dashes go: in
  // front of it, where its labels push it away from the letter before, and
  // after it, where a pile pushes the next letter away. A gap between two
  // chorded letters belongs to the one after it.
  private dashesAround({ span }: Letter) {
    const pos = this.view.posAtDOM(span, 0);
    const gaps = [];
    if (marginOf(span, "marginLeft") > 0) gaps.push(this.gapAt(pos));
    const next = span.nextSibling;
    const nextPushed =
      next instanceof HTMLElement && marginOf(next, "marginLeft") > 0;
    if (marginOf(span, "marginRight") > 0 && !nextPushed) {
      gaps.push(this.gapAt(pos + 1));
    }
    return gaps.filter((gap) => gap !== null);
  }

  // The gap at `pos` between two letters of a word on the same row.
  private gapAt(pos: number) {
    if (!this.inWord(pos)) return null;
    const before = this.view.coordsAtPos(pos, -1);
    const after = this.view.coordsAtPos(pos, 1);
    const y = (after.top + after.bottom) / 2;
    const height = after.bottom - after.top;
    if (Math.abs((before.top + before.bottom) / 2 - y) > height / 2) {
      return null;
    }
    if (after.left - before.right < 1) return null;
    return { left: before.right, right: after.left, y };
  }

  // Whether `pos` lies between two letters of one word.
  private inWord(pos: number) {
    const { doc } = this.view.state;
    const $pos = doc.resolve(pos);
    if (pos <= $pos.start() || pos >= $pos.end()) return false;
    return /^\S\S$/.test(doc.textBetween(pos - 1, pos + 1));
  }

  private dash(index: number, dimmed: boolean) {
    let dash = this.dashes[index];
    if (!dash) {
      dash = document.createElement("span");
      this.layer.appendChild(dash);
      this.dashes.push(dash);
    }
    const name = dimmed ? "chord-dash is-dimmed" : "chord-dash";
    if (dash.className !== name) dash.className = name;
    return dash;
  }

  // The label for a chord. It only changes what is different, so an
  // unchanged label doesn't make the browser lay out the page again.
  private label(
    chord: Chord,
    selected: string | null,
    active: boolean,
    dimmed: boolean,
  ) {
    let label = this.labels.get(chord.id);
    if (!label) {
      label = document.createElement("span");
      label.dataset.chordId = chord.id;
      this.layer.appendChild(label);
      this.labels.set(chord.id, label);
    }
    const name = [
      "chord-label",
      chord.id === selected ? "is-selected" : "",
      active ? "" : "is-inert",
      dimmed ? "is-dimmed" : "",
    ]
      .filter(Boolean)
      .join(" ");
    if (label.className !== name) label.className = name;
    if (label.textContent !== chord.chord) label.textContent = chord.chord;
    if (label.style.transform) label.style.transform = "";
    return label;
  }

  private onPointerDown = (event: PointerEvent) => {
    if (this.drag || !event.isPrimary || event.button !== 0) return;
    const label = (event.target as Element).closest<HTMLElement>(
      ".chord-label",
    );
    const id = label?.dataset.chordId;
    if (!label || !id) return;
    // Keeps the focus and the caret where they are.
    event.preventDefault();
    label.setPointerCapture(event.pointerId);
    this.drag = {
      id,
      label,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      pointerX: event.clientX,
      pointerY: event.clientY,
      moved: false,
      lifted: event.pointerType === "touch",
      target: null,
    };
    window.addEventListener("keydown", this.onKeyDown, true);
  };

  private onPointerMove = (event: PointerEvent) => {
    const drag = this.drag;
    if (drag?.pointerId !== event.pointerId) return;
    drag.pointerX = event.clientX;
    drag.pointerY = event.clientY;
    if (!drag.moved) {
      const distance = Math.hypot(
        event.clientX - drag.x,
        event.clientY - drag.y,
      );
      if (distance < dragThreshold) return;
      drag.moved = true;
      // A dragged label is fixed to the window, so it doesn't make the page
      // longer while it scrolls.
      const box = drag.label.getBoundingClientRect();
      drag.label.classList.add("is-dragging");
      if (drag.lifted) drag.label.classList.add("is-lifted");
      drag.label.style.left = `${String(box.left)}px`;
      drag.label.style.top = `${String(box.top)}px`;
      this.scrollFrame = requestAnimationFrame(this.scroll);
      this.options.onDragStart?.(drag.id);
    }
    this.follow(drag);
  };

  private onPointerUp = (event: PointerEvent) => {
    const drag = this.drag;
    if (drag?.pointerId !== event.pointerId) return;
    this.endDrag();
    if (!drag.moved) this.options.onChordClick?.(drag.id);
    else if (drag.target) {
      const { pos, index } = drag.target;
      moveChord(drag.id, pos, index)(this.view.state, this.view.dispatch);
    }
    this.render();
  };

  private onPointerCancel = (event: PointerEvent) => {
    if (this.drag?.pointerId !== event.pointerId) return;
    this.cancelDrag();
  };

  // Escape cancels a drag. It is caught before the editor sees it, so it
  // doesn't end editing too.
  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !this.drag) return;
    event.preventDefault();
    event.stopPropagation();
    this.cancelDrag();
  };

  private cancelDrag() {
    const drag = this.drag;
    this.endDrag();
    if (drag?.label.hasPointerCapture(drag.pointerId)) {
      drag.label.releasePointerCapture(drag.pointerId);
    }
    this.render();
  }

  private endDrag() {
    this.drag?.label.classList.remove("is-dragging", "is-lifted");
    this.drag = null;
    cancelAnimationFrame(this.scrollFrame);
    window.removeEventListener("keydown", this.onKeyDown, true);
    this.caret.remove();
  }

  // Keeps the dragged label under the pointer, and shows where it lands.
  private follow(drag: Drag) {
    const dx = drag.pointerX - drag.x;
    const dy = drag.pointerY - drag.y;
    drag.label.style.transform = `translate(${String(dx)}px, ${String(dy)}px)`;
    drag.target = this.dropTarget(drag);
  }

  // Scrolls the page while the pointer is near the window's top or bottom.
  // A lifted label reaches the top long before the finger, so there its top
  // counts instead. Pointer events stop while a finger holds still, so this
  // runs every frame.
  private scroll = () => {
    const drag = this.drag;
    if (!drag) return;
    const top = Math.max(
      0,
      drag.lifted ? drag.label.getBoundingClientRect().top : drag.pointerY,
    );
    const bottom = window.innerHeight - drag.pointerY;
    let speed = 0;
    if (top < scrollZone) speed = -scrollSpeed * (1 - top / scrollZone);
    else if (bottom < scrollZone)
      speed = scrollSpeed * (1 - bottom / scrollZone);
    const before = window.scrollY;
    if (speed !== 0) window.scrollBy(0, Math.round(speed));
    // A lifted label slides up while the finger may hold still, so its
    // target is updated every frame.
    if (drag.lifted || window.scrollY !== before) this.follow(drag);
    this.scrollFrame = requestAnimationFrame(this.scroll);
  };

  // A spot in a pile under the dragged label's left edge, or else the letter
  // under it. Only the active section takes drops; elsewhere there is none.
  private dropTarget(drag: Drag): Target | null {
    const box = drag.label.getBoundingClientRect();
    const x = box.left + 1;
    const pile = this.pileAt(drag, x, box);
    if (pile) {
      this.showCaret(pile.caret);
      return pile.target;
    }
    const pos = letterAt(this.view, x, box.bottom + box.height);
    if (pos === null || !this.inActiveSection(pos)) {
      this.caret.remove();
      return null;
    }
    const coords = this.view.coordsAtPos(pos, 1);
    this.showCaret({
      left: coords.left,
      top: coords.top,
      height: coords.bottom - coords.top,
    });
    return { pos };
  }

  // The pile of the active section whose labels are under `x`, on the row of
  // the dragged label. The dragged chord itself doesn't count, so a pile it
  // belongs to can be reordered.
  private pileAt(drag: Drag, x: number, box: DOMRect) {
    const spans = this.view.dom.querySelectorAll<HTMLElement>(
      ".section.is-active span.chorded",
    );
    for (const span of spans) {
      const ids = (span.dataset.chordIds ?? "").split(" ");
      if (ids.length < 2) continue;
      const boxes = ids
        .filter((id) => id !== drag.id)
        .map((id) => this.labels.get(id)?.getBoundingClientRect())
        .filter((rect) => rect !== undefined);
      const [first] = boxes;
      const last = boxes.at(-1);
      if (!first || !last) continue;
      const space = spacing(span);
      if (Math.abs(box.top - first.top) > first.height) continue;
      if (x < first.left - space / 2 || x > last.right + space / 2) continue;
      const index = boxes.filter((b) => (b.left + b.right) / 2 < x).length;
      const before = boxes[index - 1];
      return {
        target: { pos: this.view.posAtDOM(span, 0), index },
        caret: {
          left: before ? before.right + space / 2 : first.left - space / 2,
          top: first.top,
          height: first.height,
        },
      };
    }
    return null;
  }

  private inActiveSection(pos: number) {
    const start = getActiveSection(this.view.state);
    const section = start === null ? null : this.view.state.doc.nodeAt(start);
    return (
      start !== null &&
      !!section &&
      pos > start &&
      pos < start + section.nodeSize
    );
  }

  // Shows the drop caret at a spot given in window coordinates.
  private showCaret(at: { left: number; top: number; height: number }) {
    const origin = this.layer.getBoundingClientRect();
    this.caret.style.left = `${String(at.left - origin.left)}px`;
    this.caret.style.top = `${String(at.top - origin.top)}px`;
    this.caret.style.height = `${String(at.height)}px`;
    this.layer.appendChild(this.caret);
  }
}

// The space between labels, and between a label and the next letter.
function spacing(element: HTMLElement) {
  return parseFloat(getComputedStyle(element).fontSize) * 0.3;
}

// How wide a pile's labels are, side by side.
function labelsWidth(sizes: { width: number }[], space: number) {
  const widths = sizes.reduce((sum, size) => sum + size.width, 0);
  return widths + space * Math.max(0, sizes.length - 1);
}

function isSpace(span: HTMLElement) {
  return /^\s$/.test(span.textContent);
}

function sameRow(box: DOMRect, row: DOMRect | null) {
  return row !== null && Math.abs(box.top - row.top) < 2;
}

type Side = "marginLeft" | "marginRight";

function marginOf(span: HTMLElement, side: Side) {
  return parseFloat(span.style[side]) || 0;
}

// Sets a margin, rounded up to a hundredth of a pixel so labels never
// touch. Returns whether it changed.
function setMargin(span: HTMLElement, side: Side, px: number) {
  const value = px > 0 ? `${String(Math.ceil(px * 100) / 100)}px` : "";
  if (span.style[side] === value) return false;
  span.style[side] = value;
  return true;
}
