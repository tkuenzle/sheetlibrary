import "./side-panel.css";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { wide } from "../breakpoints";
import { IconButton } from "../ui/button";
import type { IconName } from "../ui/icons";

// What isn't tied to the active section, such as the help. From the wide
// width (see breakpoints.ts) it sits beside the page's content; below it,
// SidePanelButton opens the same content as a sheet. CSS shows one or the
// other, so the server renders the right one.
export function SidePanel({
  title,
  before,
  children,
}: {
  title: string;
  // Shown above the title, only in the panel beside the content.
  before?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <aside className="side-panel" aria-labelledby={titleId}>
      {before}
      <section className="side-panel-content">
        <h2 id={titleId}>{title}</h2>
        {children}
      </section>
    </aside>
  );
}

// The button that opens the side panel as a modal sheet from the right, for
// the top bar. Only shown below the wide width. The sheet's content is only
// rendered while it is open. It slides in, and slides out before it closes,
// since a dialog leaves the page at once when it closes.
export function SidePanelButton({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    // The panel moves beside the content when the window gets wide.
    const query = window.matchMedia(wide);
    const onChange = () => {
      if (query.matches) dialog.current?.close();
    };
    query.addEventListener("change", onChange);
    return () => {
      query.removeEventListener("change", onChange);
    };
  }, [open]);

  // Closes once the slide out is done. With reduced motion there is no
  // animation to wait for, so it closes at once.
  useEffect(() => {
    const sheet = dialog.current;
    if (!closing || !sheet) return;
    let cancelled = false;
    void Promise.allSettled(
      sheet
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    ).then(() => {
      if (!cancelled) sheet.close();
    });
    return () => {
      cancelled = true;
    };
  }, [closing]);

  const slideOut = () => {
    setClosing(true);
  };

  return (
    // Opening the help doesn't stop editing (see SheetEditor).
    <div className="side-panel-button" data-keeps-editing>
      <IconButton
        icon={icon}
        label={title}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
        }}
      />
      <dialog
        ref={dialog}
        className="side-panel-sheet"
        aria-labelledby={titleId}
        data-closing={closing || undefined}
        onClose={() => {
          setOpen(false);
          setClosing(false);
        }}
        // Escape slides the sheet out too, instead of closing it at once.
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          slideOut();
        }}
        // The content fills the sheet, so a click on the sheet itself was
        // on the backdrop.
        onClick={(event) => {
          if (event.target === event.currentTarget) slideOut();
        }}
      >
        {open && (
          <div className="side-panel-content">
            <div className="side-panel-header">
              <h2 id={titleId}>{title}</h2>
              <IconButton
                icon="close"
                label="Close"
                tooltipPlacement="left"
                onClick={slideOut}
              />
            </div>
            {children}
          </div>
        )}
      </dialog>
    </div>
  );
}
