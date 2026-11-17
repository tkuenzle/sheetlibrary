import "./edge-panel.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

// How the content closes the panel, as "Close" does: sliding out.
export interface EdgePanelControls {
  slideOut: () => void;
}

// A modal panel the full height of the window, from the left or the right
// edge, over the dimmed page. The sheet's help and the opened rail use it.
// The caller has the button that opens it and sets `open`; the panel says
// when it has closed. Its content is only rendered while it is open. It
// slides in, and slides out before it closes, since a dialog leaves the page
// at once when it closes. With reduced motion, the slide takes no time.
export function EdgePanel({
  side,
  open,
  onClosed,
  closeWhen,
  className,
  children,
  ...name
}: {
  side: "left" | "right";
  open: boolean;
  onClosed: () => void;
  // A media query. The panel closes when the window starts to match it, as
  // when the help moves beside the content.
  closeWhen: string;
  // For the panel's width and its content's layout.
  className?: string;
  children: (controls: EdgePanelControls) => ReactNode;
} & ({ "aria-labelledby": string } | { "aria-label": string })) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    const query = window.matchMedia(closeWhen);
    const onChange = () => {
      if (query.matches) dialog.current?.close();
    };
    query.addEventListener("change", onChange);
    return () => {
      query.removeEventListener("change", onChange);
    };
  }, [open, closeWhen]);

  // Closes once the slide out is done. With reduced motion it takes no time
  // (see docs/motion.md), so it closes at once.
  useEffect(() => {
    const panel = dialog.current;
    if (!closing || !panel) return;
    let cancelled = false;
    void Promise.allSettled(
      panel
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    ).then(() => {
      if (!cancelled) panel.close();
    });
    return () => {
      cancelled = true;
    };
  }, [closing]);

  const controls: EdgePanelControls = {
    slideOut: () => {
      setClosing(true);
    },
  };

  return (
    <dialog
      ref={dialog}
      className={className ? `edge-panel ${className}` : "edge-panel"}
      data-side={side}
      data-closing={closing || undefined}
      {...name}
      onClose={() => {
        setClosing(false);
        onClosed();
      }}
      // Escape slides the panel out too, instead of closing it at once.
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        controls.slideOut();
      }}
      // The content fills the panel, so a click on the panel itself was on
      // the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) controls.slideOut();
      }}
    >
      {open && children(controls)}
    </dialog>
  );
}
