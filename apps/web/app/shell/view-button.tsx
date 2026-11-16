import "../editor/key-button.css";
import "./view-button.css";

import { useId } from "react";

import { usePanel } from "../editor/panel";
import { MAX_TEXT_STEP, MIN_TEXT_STEP, textPercent } from "../sheets/text-size";
import { IconButton } from "../ui/button";
import { Icon } from "../ui/icon";
import { Tooltip } from "../ui/tooltip";

// "View" in the play view's bar: a panel with the text size and "Lyrics
// only", which change only what is shown. Under the button, or a bottom
// sheet on a phone, like the key panel. See openspec/specs/play-page
// ("View").
export function ViewButton({
  step,
  onResize,
  lyrics,
  onLyrics,
}: {
  // The text size step (see sheets/text-size.ts).
  step: number;
  onResize: (by: 1 | -1) => void;
  lyrics: boolean;
  onLyrics: (on: boolean) => void;
}) {
  const { wrapperProps, toggleProps, dialogProps } = usePanel();
  const lyricsId = useId();
  const sizeId = useId();

  return (
    <div className="view-button" {...wrapperProps}>
      <Tooltip text="View">
        <button
          {...toggleProps}
          type="button"
          className="button icon-button icon-button-standard view-button-toggle"
          aria-label="View"
        >
          <Icon name="formatSize" />
        </button>
      </Tooltip>
      {/* Its content is small, so it is there while closed too. */}
      <dialog
        {...dialogProps}
        className="key-panel view-panel"
        aria-label="View"
      >
        <div className="view-panel-content">
          <div className="view-panel-row">
            <span id={sizeId}>Text size</span>
            <span
              className="view-panel-size"
              role="group"
              aria-labelledby={sizeId}
            >
              <IconButton
                icon="textDecrease"
                label="Smaller text"
                disabled={step <= MIN_TEXT_STEP}
                onClick={() => {
                  onResize(-1);
                }}
              />
              <span className="view-panel-percent">{`${String(textPercent(step))}%`}</span>
              <IconButton
                icon="textIncrease"
                label="Larger text"
                disabled={step >= MAX_TEXT_STEP}
                onClick={() => {
                  onResize(1);
                }}
              />
            </span>
          </div>
          <div className="view-panel-row">
            <span id={lyricsId}>Lyrics only</span>
            <button
              type="button"
              role="switch"
              className="switch"
              aria-checked={lyrics}
              aria-labelledby={lyricsId}
              onClick={() => {
                onLyrics(!lyrics);
              }}
            >
              <span className="switch-handle" />
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
