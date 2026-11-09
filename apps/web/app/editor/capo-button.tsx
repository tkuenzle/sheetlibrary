import "./capo-button.css";

import { type Key, MAX_CAPO, shapesKey } from "chordsheet";
import { useId } from "react";

import { Icon } from "../ui/icon";
import { keyName, spokenKey } from "./key-button";
import { usePanel } from "./panel";

// The capo, beside the key button. The key button says how the song
// sounds; the capo says which shapes to play. It opens a list of the frets,
// each with its shapes, under the button or as a bottom sheet on a phone.
// A pick closes it. See openspec/specs/editor-page.
export function CapoButton({
  sounding,
  capo,
  onPick,
}: {
  // The key the sheet sounds in: the shown key, or the song key.
  sounding: Key;
  // The fret, 0 for no capo.
  capo: number;
  onPick: (capo: number) => void;
}) {
  const { open, close, wrapperProps, toggleProps, dialogProps } = usePanel();
  const shapes = shapesKey(sounding, capo);

  return (
    // Opening the panel doesn't stop editing (see SheetEditor).
    <div className="key-button" {...wrapperProps} data-keeps-editing>
      <button
        {...toggleProps}
        type="button"
        className="key-button-toggle capo-button-toggle"
        aria-label={
          capo ? `Capo ${String(capo)}, ${spokenKey(shapes)} shapes` : "Capo"
        }
        data-none={capo === 0 || undefined}
      >
        {capo ? `Capo ${String(capo)}` : "Capo"}
        <Icon name="expandMore" size={22} />
      </button>
      <dialog
        {...dialogProps}
        className="key-panel capo-panel"
        aria-label="Capo"
      >
        {open && (
          <CapoPanel
            sounding={sounding}
            capo={capo}
            onPick={(fret) => {
              onPick(fret);
              close();
            }}
          />
        )}
      </dialog>
    </div>
  );
}

// The frets from no capo to MAX_CAPO, each with the shapes to play there,
// and the capo in use marked.
export function CapoPanel({
  sounding,
  capo,
  onPick,
}: {
  sounding: Key;
  capo: number;
  onPick: (capo: number) => void;
}) {
  const titleId = useId();
  const frets = Array.from({ length: MAX_CAPO + 1 }, (_, fret) => fret);

  return (
    <section className="key-panel-content" aria-labelledby={titleId}>
      <div className="key-panel-header">
        <h2 id={titleId}>Capo</h2>
        <p>Pick a fret to see the shapes to play</p>
      </div>
      <div className="capo-panel-frets">
        {frets.map((fret) => {
          const shapes = fret ? shapesKey(sounding, fret) : sounding;
          const name = fret ? `Capo ${String(fret)}` : "No capo";
          return (
            <button
              key={fret}
              type="button"
              className="capo-panel-fret"
              aria-label={`${name}, ${spokenKey(shapes)} shapes`}
              aria-pressed={fret === capo}
              onClick={() => {
                onPick(fret);
              }}
            >
              {name}
              <span className="capo-panel-shapes">
                {keyName(shapes)} shapes
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
