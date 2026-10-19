import { type EditorState, Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import { getActiveSection } from "./active-section";
import { getSelectedChord, moveChord } from "./chords";
import { letterAt } from "./letter";
import { type Chord, chordsOf } from "./schema";

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
  target: Target | null;
}

class ChordLayerView {
  private layer = document.createElement("div");
  private caret = document.createElement("div");
  // Labels by chord id, reused across renders so a label stays the same
  // element while it is tapped or dragged.
  private labels = new Map<string, HTMLElement>();
  private frame = 0;
  private drag: Drag | null = null;
  private scrollFrame = 0;
  private observer = new ResizeObserver(() => {
    this.schedule();
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
    this.schedule();
  }

  update(view: EditorView, previous: EditorState) {
    if (
      view.state.doc !== previous.doc ||
      getSelectedChord(view.state) !== getSelectedChord(previous) ||
      getActiveSection(view.state) !== getActiveSection(previous)
    ) {
      this.schedule();
    }
  }

  destroy() {
    this.endDrag();
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.layer.remove();
  }

  private schedule() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      if (!this.drag) this.render();
    });
  }

  // Places every label above its letter. Where a label would run into the
  // previous one on the same row, the letter gets space in front of it.
  private render() {
    const spans = [
      ...this.view.dom.querySelectorAll<HTMLElement>("span.chorded"),
    ];
    for (const span of spans) span.style.marginLeft = "";
    const seen = new Set<string>();
    const origin = this.layer.getBoundingClientRect();
    const selected = getSelectedChord(this.view.state);
    const editing = getActiveSection(this.view.state) !== null;
    let line: Element | null = null;
    let end = -Infinity;
    let top = NaN;
    for (const span of spans) {
      if (span.closest(".line") !== line) {
        line = span.closest(".line");
        end = -Infinity;
        top = NaN;
      }
      const chords = JSON.parse(span.dataset.chords ?? "[]") as Chord[];
      // Labels are outside their section, so they follow it here: only the
      // active section's labels can be clicked, and the others are dimmed.
      const active = span.closest(".section.is-active") !== null;
      const labels = chords.map((chord) => {
        seen.add(chord.id);
        return this.label(chord, selected, active, editing && !active);
      });
      const space = spacing(span);
      let box = span.getBoundingClientRect();
      if (Math.abs(box.top - top) < 2 && box.left < end + space) {
        span.style.marginLeft = `${String(end + space - box.left)}px`;
        box = span.getBoundingClientRect();
      }
      let x = box.left;
      for (const label of labels) {
        const size = label.getBoundingClientRect();
        label.style.left = `${String(x - origin.left)}px`;
        label.style.top = `${String(box.top - origin.top - size.height)}px`;
        x += size.width + space;
      }
      end = x - space;
      top = box.top;
    }
    for (const [id, label] of this.labels) {
      if (seen.has(id)) continue;
      label.remove();
      this.labels.delete(id);
    }
  }

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
    label.className = "chord-label";
    if (chord.id === selected) label.classList.add("is-selected");
    if (!active) label.classList.add("is-inert");
    if (dimmed) label.classList.add("is-dimmed");
    label.textContent = chord.chord;
    label.style.transform = "";
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
    this.drag?.label.classList.remove("is-dragging");
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
  // Pointer events stop while a finger holds still, so this runs every frame.
  private scroll = () => {
    const drag = this.drag;
    if (!drag) return;
    const y = drag.pointerY;
    const bottom = window.innerHeight - y;
    let speed = 0;
    if (y < scrollZone) speed = -scrollSpeed * (1 - y / scrollZone);
    else if (bottom < scrollZone)
      speed = scrollSpeed * (1 - bottom / scrollZone);
    if (speed !== 0) {
      const before = window.scrollY;
      window.scrollBy(0, Math.round(speed));
      if (window.scrollY !== before) this.follow(drag);
    }
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
function spacing(span: HTMLElement) {
  return parseFloat(getComputedStyle(span).fontSize) * 0.3;
}
