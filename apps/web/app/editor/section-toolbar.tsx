import "./section-toolbar.css";

import type { SectionToolbarState } from "chord-editor";
import type { Ref } from "react";

import { Button, IconButton } from "../ui/button";
import { Toolbar } from "../ui/toolbar";

// The active section's toolbar. The editor places the outer element: beside
// the section, spanning its height, or docked at the bottom of the window.
// Its buttons can't be reached with Tab: focusing them would take the caret
// out of the section. The keyboard has its own shortcuts.
export function SectionToolbar({
  state,
  onAddChord,
  onMove,
  ref,
}: {
  state: SectionToolbarState | null;
  onAddChord: () => void;
  onMove: (direction: -1 | 1) => void;
  ref?: Ref<HTMLDivElement>;
}) {
  const docked = state?.docked ?? false;
  const tooltip = docked ? "top" : "right";
  const label = state
    ? `Section ${String(state.index + 1)} of ${String(state.count)}`
    : "Section";

  const moves = state && state.count > 1 && (
    <>
      <IconButton
        icon="moveUp"
        label="Move section up"
        tooltipPlacement={tooltip}
        tabIndex={-1}
        disabled={state.index === 0}
        onClick={() => {
          onMove(-1);
        }}
      />
      <IconButton
        icon="moveDown"
        label="Move section down"
        tooltipPlacement={tooltip}
        tabIndex={-1}
        disabled={state.index === state.count - 1}
        onClick={() => {
          onMove(1);
        }}
      />
    </>
  );

  return (
    <div ref={ref} className="section-toolbar" hidden={!state}>
      {docked ? (
        <Toolbar label={label} className="section-toolbar-docked">
          {moves && (
            <div className="section-toolbar-pill">
              {/* Says what the buttons do, so they don't read as a way to
                  step through the sections. Their names say it already. */}
              <span className="section-toolbar-label" aria-hidden="true">
                Move
              </span>
              {moves}
            </div>
          )}
          <Button
            icon="add"
            size="large"
            aria-label="Add chord"
            tabIndex={-1}
            onClick={onAddChord}
          >
            Chord
          </Button>
        </Toolbar>
      ) : (
        <Toolbar
          label={label}
          orientation="vertical"
          className="section-toolbar-beside"
        >
          <IconButton
            icon="add"
            label="Add chord"
            variant="filled"
            size="large"
            tooltipPlacement={tooltip}
            tabIndex={-1}
            onClick={onAddChord}
          />
          {moves}
        </Toolbar>
      )}
    </div>
  );
}
