// Docking at the bottom of the visible area, above the keyboard when it is
// open, as the section toolbar and the chord input do in a compact layout.
// The element is `position: fixed` at the bottom; the dock lifts it where the
// keyboard covers the page, and marks it `data-moving` while the visible area
// moves, so the app can hide it until it is placed again.

export interface DockOptions {
  // Whether the element is docked now.
  docked: () => boolean;
  // Places the element, docked or not. Called when the visible area moves.
  place: () => void;
  // Called when the visible area changes size, as when the keyboard opens.
  // By default, the element is placed again.
  onResize?: () => void;
}

// Room kept between a box and the docked element above which it is kept.
const margin = 8;
// On iOS, how long the visible area must be still before the docked element
// shows again, in milliseconds.
const settleDelay = 150;

export class Dock {
  private settleTimer = 0;
  // Whether a finger is on the screen. While it is, the page may be held
  // past its end, about to bounce back.
  private fingerDown = false;

  constructor(
    private element: HTMLElement | null,
    private options: DockOptions,
  ) {
    window.visualViewport?.addEventListener("resize", this.onResize);
    window.visualViewport?.addEventListener("scroll", this.moved);
    window.addEventListener("scroll", this.moved, { passive: true });
    window.addEventListener("touchstart", this.onFingerDown, { passive: true });
    window.addEventListener("touchend", this.onFingerUp, { passive: true });
    window.addEventListener("touchcancel", this.onFingerUp, { passive: true });
  }

  destroy() {
    window.visualViewport?.removeEventListener("resize", this.onResize);
    window.visualViewport?.removeEventListener("scroll", this.moved);
    window.removeEventListener("scroll", this.moved);
    window.removeEventListener("touchstart", this.onFingerDown);
    window.removeEventListener("touchend", this.onFingerUp);
    window.removeEventListener("touchcancel", this.onFingerUp);
    clearTimeout(this.settleTimer);
    if (this.element) {
      setStyle(this.element, "bottom", "");
      setFlag(this.element, "moving", false);
    }
  }

  // The browser keeps the element at the bottom of the page's viewport
  // itself, so it doesn't lag while scrolling. On Android, the page shrinks
  // for the keyboard (see `interactive-widget` in the viewport meta tag). On
  // iOS it doesn't, so the element is lifted by the part of the page the
  // keyboard covers.
  lift() {
    if (!this.element) return;
    const keyboard = coveredByKeyboard();
    setStyle(
      this.element,
      "bottom",
      keyboard > 0 ? `${String(keyboard)}px` : "",
    );
  }

  // Scrolls `box`, in window coordinates, into the part of the visible area
  // above the docked element, when it is hidden. Where the element ends up
  // counts, not where it is while it slides in.
  keepAbove(box: { top: number; bottom: number }) {
    if (!this.element || !this.options.docked()) return;
    const top = window.visualViewport?.offsetTop ?? 0;
    const bottom =
      this.element.getBoundingClientRect().top - slidBy(this.element) - margin;
    if (box.bottom > bottom) window.scrollBy(0, box.bottom - bottom);
    else if (box.top < top + margin) {
      window.scrollBy(0, box.top - top - margin);
    }
  }

  // Where the keyboard covers part of the page, as on iOS, the browser moves
  // the visible area inside the page while scrolling, lets the page scroll
  // past its end and pulls it back, and the element moves with all that
  // until it is placed again. So it hides while the page or the visible
  // area moves, and shows again once both are still and no finger is down.
  moved = () => {
    const element = this.element;
    if (!element) return;
    const lifted = element.style.bottom !== "";
    this.options.place();
    if (!this.options.docked() || !(lifted || element.style.bottom !== "")) {
      return;
    }
    setFlag(element, "moving", true);
    this.settle();
  };

  private onResize = () => {
    if (this.options.onResize) this.options.onResize();
    else this.moved();
  };

  private settle() {
    clearTimeout(this.settleTimer);
    this.settleTimer = window.setTimeout(() => {
      if (this.fingerDown) return;
      this.options.place();
      if (this.element) setFlag(this.element, "moving", false);
    }, settleDelay);
  }

  private onFingerDown = (event: TouchEvent) => {
    this.fingerDown = event.touches.length > 0;
  };

  private onFingerUp = (event: TouchEvent) => {
    this.fingerDown = event.touches.length > 0;
    if (this.element?.dataset.moving !== undefined) this.settle();
  };
}

// Writes an inline style only when it changes, so placing an element again
// doesn't make the browser lay out the page again for nothing.
export function setStyle(
  element: HTMLElement,
  name: "top" | "bottom" | "height",
  value: string,
) {
  if (element.style[name] !== value) element.style[name] = value;
}

export function setFlag(
  element: HTMLElement,
  name: "docked" | "moving",
  on: boolean,
) {
  element.toggleAttribute(`data-${name}`, on);
}

// How far the element is moved down by its `translate`, as while it slides.
function slidBy(element: HTMLElement) {
  const [, y = "0"] = getComputedStyle(element).translate.split(" ");
  return parseFloat(y) || 0;
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
