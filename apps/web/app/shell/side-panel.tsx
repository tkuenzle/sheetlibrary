import "./side-panel.css";

import { type ReactNode, useId, useState } from "react";

import { wide } from "../breakpoints";
import { IconButton } from "../ui/button";
import type { IconName } from "../ui/icons";
import { EdgePanel } from "./edge-panel";

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
// the top bar. Only shown below the wide width. The sheet closes when the
// window gets wide, where the panel sits beside the content. With
// `everyWidth`, as on a sheet in edit mode, there is no panel beside the
// content, so the button shows at every width and the sheet stays open.
// `open` and `onOpenChange` let the page open it from elsewhere too.
export function SidePanelButton({
  icon,
  title,
  everyWidth = false,
  open: openFromPage,
  onOpenChange,
  children,
}: {
  icon: IconName;
  title: string;
  everyWidth?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [openHere, setOpenHere] = useState(false);
  const open = openFromPage ?? openHere;
  const setOpen = (next: boolean) => {
    setOpenHere(next);
    onOpenChange?.(next);
  };
  const titleId = useId();
  return (
    // Opening the help doesn't stop editing (see SheetEditor).
    <div
      className={
        everyWidth
          ? "side-panel-button side-panel-button-every-width"
          : "side-panel-button"
      }
      data-keeps-editing
    >
      <IconButton
        icon={icon}
        label={title}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
        }}
      />
      <EdgePanel
        side="right"
        className="side-panel-sheet"
        open={open}
        onClosed={() => {
          setOpen(false);
        }}
        closeWhen={everyWidth ? "not all" : wide}
        aria-labelledby={titleId}
      >
        {({ slideOut }) => (
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
      </EdgePanel>
    </div>
  );
}
