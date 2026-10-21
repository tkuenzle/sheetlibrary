import { type EditorState, Plugin } from "prosemirror-state";
import { Decoration, DecorationSet, type EditorView } from "prosemirror-view";

import { getActiveSection } from "./active-section";
import { moveSection } from "./sections";

// The active section's actions in one toolbar: adding a chord at the caret
// and moving the section. Other sections get none. With a mouse, it sits
// above the section. On a touch device, it is docked at the bottom of the
// visible area, above the keyboard when it is open.

export interface SectionToolbarOptions {
  // "+ Chord", with the position of the caret. The app opens the chord
  // input there.
  onAddChord?: (pos: number) => void;
}

// Whether the main pointer is a finger. It doesn't change with each tap, so
// the toolbar doesn't jump between its two places.
const touch = "(pointer: coarse)";

// Room kept between the caret's line and the docked toolbar.
const caretMargin = 8;
// On iOS, how long the visible area must be still before the docked toolbar
// shows again, in milliseconds.
const settleDelay = 150;

export function sectionToolbar(options: SectionToolbarOptions = {}) {
  return new Plugin({
    props: {
      // Makes room above the active section for the toolbar, with a mouse.
      decorations: (state) => {
        const pos = getActiveSection(state);
        const section = pos === null ? null : state.doc.nodeAt(pos);
        if (pos === null || !section) return null;
        return DecorationSet.create(state.doc, [
          Decoration.node(pos, pos + section.nodeSize, {
            class: "has-toolbar",
          }),
        ]);
      },
    },
    view: (view) => new SectionToolbar(view, options),
  });
}

class SectionToolbar {
  private bar = document.createElement("div");
  private add = button("+ Chord");
  private up = button("↑", "Move section up");
  private down = button("↓", "Move section down");
  private media = window.matchMedia(touch);
  private settleTimer = 0;
  // Whether a finger is on the screen. While it is, the page may be held
  // past its end, about to bounce back.
  private fingerDown = false;
  // Placed again when the editor's size changes, as when labels push text
  // onto a new line.
  private observer = new ResizeObserver(() => {
    this.place();
  });

  constructor(
    private view: EditorView,
    private options: SectionToolbarOptions,
  ) {
    this.bar.className = "section-toolbar";
    this.bar.setAttribute("role", "toolbar");
    this.bar.setAttribute("aria-label", "Section");
    for (const element of [this.add, this.up, this.down]) {
      this.bar.appendChild(element);
      // Keeps the editor's focus, so the section stays active and the
      // keyboard stays open on phones.
      element.addEventListener("pointerdown", keepFocus);
      element.addEventListener("mousedown", keepFocus);
    }
    this.add.addEventListener("click", this.onAdd);
    this.up.addEventListener("click", () => {
      this.move(-1);
    });
    this.down.addEventListener("click", () => {
      this.move(1);
    });
    this.media.addEventListener("change", this.onViewportChange);
    window.visualViewport?.addEventListener("resize", this.onViewportChange);
    window.visualViewport?.addEventListener("scroll", this.onViewportMove);
    window.addEventListener("scroll", this.onViewportMove, { passive: true });
    window.addEventListener("touchstart", this.onFingerDown, { passive: true });
    window.addEventListener("touchend", this.onFingerUp, { passive: true });
    window.addEventListener("touchcancel", this.onFingerUp, { passive: true });
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
    const index = state.doc.resolve(pos).index(0);
    const single = state.doc.childCount < 2;
    this.up.hidden = single;
    this.down.hidden = single;
    this.up.disabled = index === 0;
    this.down.disabled = index === state.doc.childCount - 1;
    if (!this.bar.isConnected) {
      view.dom.insertAdjacentElement("afterend", this.bar);
    }
    this.place();
    if (
      previous &&
      (previous.doc !== state.doc || !previous.selection.eq(state.selection))
    ) {
      this.keepCaretInView();
    }
  }

  destroy() {
    this.observer.disconnect();
    this.media.removeEventListener("change", this.onViewportChange);
    window.visualViewport?.removeEventListener("resize", this.onViewportChange);
    window.visualViewport?.removeEventListener("scroll", this.onViewportMove);
    window.removeEventListener("scroll", this.onViewportMove);
    window.removeEventListener("touchstart", this.onFingerDown);
    window.removeEventListener("touchend", this.onFingerUp);
    window.removeEventListener("touchcancel", this.onFingerUp);
    clearTimeout(this.settleTimer);
    this.hide();
  }

  private get docked() {
    return this.media.matches;
  }

  private hide() {
    this.bar.remove();
    this.view.dom.parentElement?.classList.remove("has-docked-toolbar");
    this.makeRoomBelow(false);
  }

  // Docked, the toolbar covers the bottom of the window, so the page gets
  // room for it after all its content, and the end of the page can be
  // scrolled clear of it.
  private makeRoomBelow(room: boolean) {
    const root = document.documentElement;
    root.classList.toggle("has-docked-section-toolbar", room);
    if (room) {
      root.style.setProperty(
        "--section-toolbar-height",
        `${String(this.bar.offsetHeight)}px`,
      );
    } else root.style.removeProperty("--section-toolbar-height");
  }

  // Above the active section, at its right edge, or docked at the bottom of
  // the visible area. The keyboard changes the visible area, so this runs
  // again when it does.
  private place = () => {
    if (!this.bar.isConnected) return;
    const frame = this.view.dom.parentElement;
    frame?.classList.toggle("has-docked-toolbar", this.docked);
    this.bar.classList.toggle("is-docked", this.docked);
    this.makeRoomBelow(this.docked);
    if (this.docked) {
      // The browser keeps the toolbar at the bottom of the page's viewport
      // itself, so it doesn't lag while scrolling. On Android, the page
      // shrinks for the keyboard (see `interactive-widget` in the viewport
      // meta tag). On iOS it doesn't, so the toolbar is lifted by the part
      // of the page the keyboard covers.
      this.bar.style.top = "";
      const keyboard = coveredByKeyboard();
      this.bar.style.bottom = keyboard > 0 ? `${String(keyboard)}px` : "";
      return;
    }
    this.bar.style.bottom = "";
    const pos = getActiveSection(this.view.state);
    const section = pos === null ? null : this.view.nodeDOM(pos);
    if (!(section instanceof HTMLElement) || !frame) return;
    const top =
      section.getBoundingClientRect().top - frame.getBoundingClientRect().top;
    this.bar.style.top = `${String(top)}px`;
  };

  private onViewportChange = () => {
    this.onViewportMove();
    this.keepCaretInView();
  };

  // Where the keyboard covers part of the page, as on iOS, the browser moves
  // the visible area inside the page while scrolling, lets the page scroll
  // past its end and pulls it back, and the toolbar moves with all that
  // until it is placed again. So it hides while the page or the visible
  // area moves, and shows again once both are still and no finger is down.
  private onViewportMove = () => {
    const lifted = this.bar.style.bottom !== "";
    this.place();
    if (!this.docked || !(lifted || this.bar.style.bottom !== "")) return;
    this.bar.classList.add("is-moving");
    this.settle();
  };

  private settle() {
    clearTimeout(this.settleTimer);
    this.settleTimer = window.setTimeout(() => {
      if (this.fingerDown) return;
      this.place();
      this.bar.classList.remove("is-moving");
    }, settleDelay);
  }

  private onFingerDown = (event: TouchEvent) => {
    this.fingerDown = event.touches.length > 0;
  };

  private onFingerUp = (event: TouchEvent) => {
    this.fingerDown = event.touches.length > 0;
    if (this.bar.classList.contains("is-moving")) this.settle();
  };

  // Docked, the toolbar covers the bottom of the visible area. Scrolls the
  // caret's line into the part above it, when it is hidden.
  private keepCaretInView() {
    if (!this.docked || !this.bar.isConnected || !this.view.hasFocus()) {
      return;
    }
    const caret = this.view.coordsAtPos(this.view.state.selection.head);
    const top = window.visualViewport?.offsetTop ?? 0;
    const bottom = this.bar.getBoundingClientRect().top - caretMargin;
    if (caret.bottom > bottom) window.scrollBy(0, caret.bottom - bottom);
    else if (caret.top < top + caretMargin) {
      window.scrollBy(0, caret.top - top - caretMargin);
    }
  }

  private onAdd = () => {
    this.options.onAddChord?.(this.view.state.selection.head);
  };

  private move(direction: -1 | 1) {
    const before = this.bar.getBoundingClientRect().top;
    if (!moveSection(direction)(this.view.state, this.view.dispatch)) return;
    // Docked, the toolbar stays put and the update keeps the caret in view.
    // Above the section, it moved with it: scroll by as much, so it stays
    // under the pointer and can be pressed again.
    if (!this.docked) {
      window.scrollBy(0, this.bar.getBoundingClientRect().top - before);
    }
  }
}

function button(text: string, name?: string) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "section-toolbar-button";
  element.textContent = text;
  element.tabIndex = -1;
  if (name) element.setAttribute("aria-label", name);
  return element;
}

// How much of the bottom of the page's viewport is hidden, by the keyboard
// on iOS. Zero where the page shrinks for the keyboard, as on Android.
function coveredByKeyboard() {
  const viewport = window.visualViewport;
  if (!viewport) return 0;
  const covered =
    document.documentElement.clientHeight -
    (viewport.offsetTop + viewport.height);
  return covered >= 1 ? Math.round(covered) : 0;
}

function keepFocus(event: Event) {
  event.preventDefault();
}
