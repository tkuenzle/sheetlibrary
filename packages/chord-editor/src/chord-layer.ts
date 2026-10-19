import { type EditorState, Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import { getSelectedChord } from "./chords";
import { type Chord, chordsOf } from "./schema";

// Chord labels live in a layer on top of the editor, outside the editable
// text. The text holds only letters, so phone keyboards never see chords,
// and the labels are real elements that can be clicked.

export interface ChordLayerOptions {
  // A click or tap on a chord's label, with the chord's id.
  onChordClick?: (id: string) => void;
}

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

class ChordLayerView {
  private layer = document.createElement("div");
  // Labels by chord id, reused across renders so a label stays the same
  // element while it is clicked.
  private labels = new Map<string, HTMLElement>();
  private frame = 0;
  private observer = new ResizeObserver(() => {
    this.schedule();
  });

  constructor(
    private view: EditorView,
    private options: ChordLayerOptions,
  ) {
    this.layer.className = "chord-layer";
    view.dom.insertAdjacentElement("afterend", this.layer);
    this.layer.addEventListener("click", this.onClick);
    this.observer.observe(view.dom);
    this.schedule();
  }

  update(view: EditorView, previous: EditorState) {
    if (
      view.state.doc !== previous.doc ||
      getSelectedChord(view.state) !== getSelectedChord(previous)
    ) {
      this.schedule();
    }
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.layer.remove();
  }

  private schedule() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      this.render();
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
      const labels = chords.map((chord) => {
        seen.add(chord.id);
        return this.label(chord, selected);
      });
      const space = parseFloat(getComputedStyle(span).fontSize) * 0.3;
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

  private label(chord: Chord, selected: string | null) {
    let label = this.labels.get(chord.id);
    if (!label) {
      label = document.createElement("span");
      label.dataset.chordId = chord.id;
      this.layer.appendChild(label);
      this.labels.set(chord.id, label);
    }
    label.className = "chord-label";
    if (chord.id === selected) label.classList.add("is-selected");
    label.textContent = chord.chord;
    return label;
  }

  private onClick = (event: MouseEvent) => {
    const label = (event.target as Element).closest<HTMLElement>(
      ".chord-label",
    );
    const id = label?.dataset.chordId;
    if (id) this.options.onChordClick?.(id);
  };
}
