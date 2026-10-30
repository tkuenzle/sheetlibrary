import { type EditorState, Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import { getActiveSection } from "./active-section";
import { Dock, setFlag, setStyle } from "./dock";
import { type Anchor, anchorAt } from "./letter";
import { moveSection } from "./sections";

// The active section's actions in one toolbar: adding a chord at the caret
// and moving the section. The app draws the toolbar and its buttons; the
// editor places it and says what it shows. Beside the section, the element
// spans the section's height, so the app can keep its buttons in view with
// `position: sticky`. In a compact layout, as on a touch device, it is
// docked at the bottom of the visible area, above the keyboard when it is
// open.

export interface SectionToolbarState {
  // The active section's index, counted from 0, and the number of sections.
  index: number;
  count: number;
  docked: boolean;
}

export interface SectionToolbarOptions {
  // The app's element for the toolbar. The editor writes only its inline
  // `top`, `bottom` and `height`, and its `data-section-toolbar`,
  // `data-docked` and `data-moving` attributes. The app hides it while
  // there is no active section.
  toolbar?: HTMLElement;
  // What the toolbar shows, or null when no section is active. The editor
  // places the toolbar right after this, in the same frame, so the app
  // should render the change before it returns (with React, in
  // `flushSync`). Otherwise the old content shows once in the new place.
  onSectionToolbar?: (state: SectionToolbarState | null) => void;
  // A media query for when the layout is compact: the toolbar docks, and the
  // editor's element gets `data-compact`. By default, when the main pointer
  // is a finger. It doesn't change with each tap, so the toolbar doesn't jump
  // between its two places.
  compact?: string;
  // "Add chord", with the position of the caret and its letter. The app
  // opens the chord input there.
  onAddChord?: (pos: number, anchor: Anchor) => void;
}

const toolbars = new WeakMap<EditorView, SectionToolbar>();

// "Add chord" in the app's toolbar: opens the chord input at the caret.
export function addChordAtCaret(view: EditorView) {
  toolbars.get(view)?.addChord();
}

// "Move section up" or "Move section down" in the app's toolbar.
export function moveActiveSection(view: EditorView, direction: -1 | 1) {
  toolbars.get(view)?.move(direction);
}

export function sectionToolbar(options: SectionToolbarOptions = {}) {
  return new Plugin({
    view: (view) => new SectionToolbar(view, options),
  });
}

class SectionToolbar {
  private bar: HTMLElement | null;
  private media: MediaQueryList;
  private shown: SectionToolbarState | null = null;
  private dock: Dock;
  // Placed again when the editor's size changes, as when labels push text
  // onto a new line.
  private observer = new ResizeObserver(() => {
    this.place();
  });
  // And when the app shows the toolbar or changes what it holds, which it
  // does after the editor told it to. Not by watching the toolbar's size:
  // placing it sets its height.
  private changes = new MutationObserver(() => {
    this.place();
  });

  constructor(
    private view: EditorView,
    private options: SectionToolbarOptions,
  ) {
    this.bar = options.toolbar ?? null;
    this.media = window.matchMedia(options.compact ?? "(pointer: coarse)");
    this.dock = new Dock(this.bar, {
      docked: () => this.docked,
      place: this.place,
      onResize: this.onViewportChange,
    });
    toolbars.set(view, this);
    if (this.bar) {
      this.bar.dataset.sectionToolbar = "";
      // Keeps the editor's focus, so the section stays active and the
      // keyboard stays open on phones.
      this.bar.addEventListener("pointerdown", keepFocus);
      this.bar.addEventListener("mousedown", keepFocus);
      this.changes.observe(this.bar, {
        attributeFilter: ["hidden"],
        childList: true,
        subtree: true,
      });
    }
    this.markCompact();
    this.media.addEventListener("change", this.onViewportChange);
    this.observer.observe(view.dom);
    this.update(view, null);
  }

  update(view: EditorView, previous: EditorState | null) {
    const { state } = view;
    const pos = getActiveSection(state);
    if (pos === null) {
      this.hide();
      return;
    }
    this.show({
      index: state.doc.resolve(pos).index(0),
      count: state.doc.childCount,
      docked: this.docked,
    });
    this.place();
    if (
      previous &&
      (previous.doc !== state.doc || !previous.selection.eq(state.selection))
    ) {
      this.keepCaretInView();
    }
  }

  destroy() {
    toolbars.delete(this.view);
    this.observer.disconnect();
    this.changes.disconnect();
    this.media.removeEventListener("change", this.onViewportChange);
    this.dock.destroy();
    this.bar?.removeEventListener("pointerdown", keepFocus);
    this.bar?.removeEventListener("mousedown", keepFocus);
    this.hide();
    delete this.view.dom.parentElement?.dataset.compact;
  }

  addChord() {
    const { head } = this.view.state.selection;
    this.options.onAddChord?.(head, anchorAt(this.view, head));
  }

  move(direction: -1 | 1) {
    const before = this.bar?.getBoundingClientRect().top ?? 0;
    if (!moveSection(direction)(this.view.state, this.view.dispatch)) return;
    // Docked, the toolbar stays put and the update keeps the caret in view.
    // Beside the section, it moved with it: scroll by as much, so it stays
    // under the pointer and can be pressed again.
    if (!this.docked && this.bar) {
      window.scrollBy(0, this.bar.getBoundingClientRect().top - before);
    }
  }

  private get docked() {
    return this.media.matches;
  }

  // Tells the app what to show, when it changed.
  private show(next: SectionToolbarState | null) {
    if (sameState(this.shown, next)) return;
    this.shown = next;
    this.options.onSectionToolbar?.(next);
  }

  private hide() {
    this.show(null);
    this.bar?.style.removeProperty("top");
    this.bar?.style.removeProperty("bottom");
    this.bar?.style.removeProperty("height");
    this.makeRoomBelow(false);
  }

  // The editor's element gets `data-compact`, so the app's styles can follow
  // the same rule as the toolbar.
  private markCompact() {
    const frame = this.view.dom.parentElement;
    if (!frame) return;
    if (this.docked) frame.dataset.compact = "";
    else delete frame.dataset.compact;
  }

  // Docked, the toolbar covers the bottom of the window, so the page gets
  // room for it after all its content, and the end of the page can be
  // scrolled clear of it.
  private makeRoomBelow(room: boolean) {
    const root = document.documentElement;
    root.classList.toggle("has-docked-section-toolbar", room);
    if (room && this.bar) {
      root.style.setProperty(
        "--section-toolbar-height",
        `${String(this.bar.offsetHeight)}px`,
      );
    } else root.style.removeProperty("--section-toolbar-height");
  }

  // Beside the active section, as high as it, or docked at the bottom of the
  // visible area. The keyboard changes the visible area, so this runs again
  // when it does. The app shows the toolbar after the editor tells it to, so
  // until then there is nothing to place.
  private place = () => {
    const bar = this.bar;
    if (!bar || this.shown === null || !isShown(bar)) return;
    const docked = this.docked;
    setFlag(bar, "docked", docked);
    this.makeRoomBelow(docked);
    if (docked) {
      setStyle(bar, "top", "");
      setStyle(bar, "height", "");
      this.dock.lift();
      return;
    }
    setStyle(bar, "bottom", "");
    const pos = getActiveSection(this.view.state);
    const section = pos === null ? null : this.view.nodeDOM(pos);
    if (!(section instanceof HTMLElement)) return;
    const box = section.getBoundingClientRect();
    const origin = (bar.offsetParent ?? document.body).getBoundingClientRect();
    setStyle(bar, "top", `${String(box.top - origin.top)}px`);
    setStyle(bar, "height", `${String(box.height)}px`);
  };

  private onViewportChange = () => {
    this.markCompact();
    this.update(this.view, null);
    this.dock.moved();
    this.keepCaretInView();
  };

  // Docked, the toolbar covers the bottom of the visible area. Scrolls the
  // caret's line into the part above it, when it is hidden.
  private keepCaretInView() {
    const bar = this.bar;
    if (!this.docked || !bar || !isShown(bar) || !this.view.hasFocus()) {
      return;
    }
    this.dock.keepAbove(this.view.coordsAtPos(this.view.state.selection.head));
  }
}

function sameState(
  a: SectionToolbarState | null,
  b: SectionToolbarState | null,
) {
  if (!a || !b) return a === b;
  return a.index === b.index && a.count === b.count && a.docked === b.docked;
}

// Whether the app shows the toolbar. Docked, it is fixed, so it has no
// offset parent.
function isShown(element: HTMLElement) {
  return element.getClientRects().length > 0;
}

function keepFocus(event: Event) {
  event.preventDefault();
}
