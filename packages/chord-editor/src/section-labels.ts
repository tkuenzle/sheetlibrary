import type { Node } from "prosemirror-model";
import { Plugin, TextSelection } from "prosemirror-state";
import type {
  Decoration,
  EditorView,
  NodeView,
  ViewMutationRecord,
} from "prosemirror-view";

import { getActiveSection } from "./active-section";
import { labelOf } from "./schema";

// Each section's label sits in a row above its lyrics, outside the editable
// text, so it can't take the caret. The row holds the label, a button for
// adding one in the active section, or nothing, and keeps its height either
// way. The app edits the label: the editor tells it where.

// Where the app lays its label field, in window coordinates.
export interface LabelBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SectionLabelOptions {
  // A click or tap on the active section's label or its "Add label" button,
  // or Ctrl+Shift+L, with the position right before the section and the box
  // of the label or the button. The app opens its label field there.
  onLabelClick?: (pos: number, box: LabelBox) => void;
}

export function sectionLabels(options: SectionLabelOptions = {}) {
  return new Plugin({
    props: {
      nodeViews: {
        section: (node, view, getPos, decorations) =>
          new SectionView(node, view, getPos, decorations, options),
      },
    },
  });
}

// Opens the active section's label field, as Ctrl+Shift+L does.
export function editActiveLabel(
  view: EditorView,
  options: SectionLabelOptions,
): boolean {
  const pos = getActiveSection(view.state);
  const dom = pos === null ? null : view.nodeDOM(pos);
  const target =
    dom instanceof HTMLElement
      ? dom.querySelector(".section-label-row > *")
      : null;
  if (pos === null || !target || !options.onLabelClick) return false;
  options.onLabelClick(pos, boxOf(target));
  return true;
}

class SectionView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private row: HTMLElement;
  // What the row shows, so it is only drawn again when that changes.
  private label: string | null | undefined;
  private active = false;

  constructor(
    private node: Node,
    private view: EditorView,
    private getPos: () => number | undefined,
    decorations: readonly Decoration[],
    private options: SectionLabelOptions,
  ) {
    this.dom = document.createElement("section");
    this.dom.className = "section";
    this.row = document.createElement("div");
    this.row.className = "section-label-row";
    this.row.contentEditable = "false";
    this.contentDOM = document.createElement("div");
    this.contentDOM.className = "section-lines";
    this.dom.appendChild(this.row);
    this.dom.appendChild(this.contentDOM);
    // Keeps the editor's focus, so the caret stays where it is.
    this.row.addEventListener("pointerdown", keepFocus);
    this.row.addEventListener("mousedown", keepFocus);
    this.row.addEventListener("click", this.onClick);
    this.draw(decorations);
  }

  update(node: Node, decorations: readonly Decoration[]) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.draw(decorations);
    return true;
  }

  // The editor handles no events in the row; its click is handled here.
  stopEvent(event: Event) {
    return event.target instanceof Element && this.row.contains(event.target);
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    return (
      mutation.type !== "selection" &&
      !this.contentDOM.contains(mutation.target)
    );
  }

  destroy() {
    this.row.removeEventListener("pointerdown", keepFocus);
    this.row.removeEventListener("mousedown", keepFocus);
    this.row.removeEventListener("click", this.onClick);
  }

  private draw(decorations: readonly Decoration[]) {
    const label = labelOf(this.node);
    const active = decorations.some(
      (decoration) =>
        (decoration.spec as { activeSection?: boolean }).activeSection,
    );
    if (label === this.label && active === this.active) return;
    this.label = label;
    this.active = active;
    if (label !== null) {
      const text = document.createElement("span");
      text.className = "section-label";
      text.textContent = label;
      this.row.replaceChildren(text);
    } else if (active) {
      // Its word is the app's --chord-editor-add-label.
      const add = document.createElement("button");
      add.type = "button";
      add.className = "section-label-add";
      add.tabIndex = -1;
      this.row.replaceChildren(add);
    } else {
      this.row.replaceChildren();
    }
  }

  // In the active section, the label or "Add label" opens the app's label
  // field. Anywhere in another section's row, a click makes that section
  // active, with the caret at its start.
  private onClick = (event: MouseEvent) => {
    const pos = this.getPos();
    if (pos === undefined) return;
    if (!this.active) {
      const { state } = this.view;
      this.view.dispatch(
        state.tr.setSelection(TextSelection.create(state.doc, pos + 2)),
      );
      this.view.focus();
      return;
    }
    const target = this.row.firstElementChild;
    if (
      target &&
      event.target instanceof Element &&
      target.contains(event.target)
    ) {
      this.options.onLabelClick?.(pos, boxOf(target));
    }
  };
}

function boxOf(element: Element): LabelBox {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

function keepFocus(event: Event) {
  event.preventDefault();
}
