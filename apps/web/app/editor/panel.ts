import { useEffect, useRef, useState } from "react";

import { phone } from "../breakpoints";

// A button beside the sheet's title that opens a panel: a dialog under the
// button, or a bottom sheet on a phone. It opens with the marked item
// focused. Escape, a click outside or the button closes it, with the focus
// back on the button. Used by the key button and the capo button.
export function usePanel() {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  // As a sheet, the panel slides out before it closes, since a dialog leaves
  // the page at once when it closes. With reduced motion there is no
  // animation to wait for, so it closes at once.
  function close() {
    const panel = dialog.current;
    if (!panel?.open || panel.hasAttribute("data-closing")) return;
    if (!panel.matches(":modal")) {
      panel.close();
      return;
    }
    panel.setAttribute("data-closing", "");
    void Promise.allSettled(
      panel.getAnimations({ subtree: true }).map((a) => a.finished),
    ).then(() => {
      panel.removeAttribute("data-closing");
      panel.close();
    });
  }

  useEffect(() => {
    const panel = dialog.current;
    if (!open || !panel) return;
    const sheet = window.matchMedia(phone);
    panel.style.left = "";
    if (sheet.matches) panel.showModal();
    else {
      panel.show();
      // Moved left if it would stick out of the window.
      const gutter = 16;
      const box = panel.getBoundingClientRect();
      const over = box.right - (document.documentElement.clientWidth - gutter);
      if (over > 0) {
        const left = Math.max(gutter - box.left, -over);
        panel.style.left = `${String(left)}px`;
      }
    }
    panel.querySelector<HTMLElement>("[aria-pressed=true]")?.focus();

    // A click outside closes the panel. Below a phone's width the backdrop
    // takes the click (see onClick on the dialog).
    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as globalThis.Node)) close();
    }
    // Escape closes the panel wherever the focus is.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    }
    // The panel is a sheet only on a phone.
    function onChange() {
      close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    sheet.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      sheet.removeEventListener("change", onChange);
    };
  }, [open]);

  return {
    open,
    close,
    dialog,
    // Spread on the element holding the button and the dialog.
    wrapperProps: { ref: wrapper },
    // Spread on the button.
    toggleProps: {
      ref: button,
      "aria-haspopup": "dialog" as const,
      "aria-expanded": open,
      onClick: () => {
        if (open) close();
        else setOpen(true);
      },
    },
    // Spread on the dialog.
    dialogProps: {
      ref: dialog,
      onClose: () => {
        setOpen(false);
        button.current?.focus();
      },
      // As a sheet, the dialog fills its box, so a click on it itself was
      // on the backdrop.
      onClick: (event: { target: unknown; currentTarget: unknown }) => {
        if (event.target === event.currentTarget) close();
      },
    },
  };
}
