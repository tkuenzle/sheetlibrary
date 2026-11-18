import { useEffect, useRef, useState } from "react";

import { phone } from "../breakpoints";
import { closeAfterExit, stopExit } from "../ui/exit";

// A button beside the sheet's title that opens a panel: a dialog under the
// button, or a bottom sheet on a phone. It opens with the marked item
// focused. Escape, a click outside or the button closes it, with the focus
// back on the button. Used by the key button and the capo button.
export function usePanel() {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  // The panel plays its exit before it closes (see ui/exit.ts). Under the
  // button the page stays usable, so the focus goes back to the button as it
  // starts; a sheet gives it back once it has closed.
  function close() {
    const panel = dialog.current;
    if (!panel?.open || panel.hasAttribute("data-closing")) return;
    if (!panel.matches(":modal")) button.current?.focus();
    closeAfterExit(panel);
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
    // Escape closes the panel wherever the focus is, unless something in it,
    // such as a menu, took it.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
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
      // While the panel leaves, the button brings it back.
      onClick: () => {
        const panel = dialog.current;
        if (stopExit(panel)) {
          panel?.querySelector<HTMLElement>("[aria-pressed=true]")?.focus();
        } else if (open) close();
        else setOpen(true);
      },
    },
    // Spread on the dialog.
    dialogProps: {
      ref: dialog,
      // The focus goes back to the button, unless it moved on while the
      // panel left, as to the sheet after a click there.
      onClose: () => {
        setOpen(false);
        const active = document.activeElement;
        if (
          !active ||
          active === document.body ||
          dialog.current?.contains(active)
        ) {
          button.current?.focus();
        }
      },
      // As a sheet, the dialog fills its box, so a click on it itself was
      // on the backdrop.
      onClick: (event: { target: unknown; currentTarget: unknown }) => {
        if (event.target === event.currentTarget) close();
      },
    },
  };
}
