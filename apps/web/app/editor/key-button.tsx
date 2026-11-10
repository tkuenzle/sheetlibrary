import "./key-button.css";

import {
  type Key,
  keysToMoveTo,
  pitchOf,
  sameKey,
  semitonesBetween,
} from "chordsheet";
import { useId, useRef, useState } from "react";

import { Button, IconButton } from "../ui/button";
import { Icon } from "../ui/icon";
import { usePanel } from "./panel";

// The key as written: "G", "Em".
export function keyName(key: Key): string {
  return `${key.tonic}${key.minor ? "m" : ""}`;
}

// The key as read out: "F sharp", "E minor".
export function spokenKey(key: Key): string {
  const accidental = { "#": " sharp", b: " flat" }[key.tonic.charAt(1)] ?? "";
  return `${key.tonic.charAt(0)}${accidental}${key.minor ? " minor" : ""}`;
}

// The semitones from `from` up to `to`, the shorter way: -5 to 6.
export function semitonesFrom(from: Key, to: Key): number {
  const up = semitonesBetween(from, to);
  return up > 6 ? up - 12 : up;
}

// The distance as written on the key button, "+2" or "−1", and as read
// out, "2 semitones up". Nothing for no distance.
function distanceText(semitones: number): { written: string; spoken: string } {
  if (semitones === 0) return { written: "", spoken: "" };
  const size = Math.abs(semitones);
  const up = semitones > 0;
  return {
    written: `${up ? "+" : "−"}${String(size)}`,
    spoken: `${String(size)} semitone${size === 1 ? "" : "s"} ${up ? "up" : "down"}`,
  };
}

// The key the sheet is shown in, beside its title. It opens a panel, under
// the button or as a bottom sheet on a phone, in two parts: the song's key,
// which "Change" sets without moving a chord, and the keys to show the sheet
// in, with steps of a semitone, a way back to the song key, and a way to
// make the shown key the song key. The panel stays open after a pick. To
// view only, it has neither "Change" nor the way to make the shown key the
// song key, and no undo.
export function KeyButton({
  current,
  song,
  guessed,
  guess,
  readOnly = false,
  viewOnly = false,
  onPick,
  onSet = noop,
  onStep,
  onBack,
  onMake = noop,
  onUndo = noop,
  onRedo = noop,
}: {
  // The key the sheet is shown in.
  current: Key;
  // The song's key: the set key, or the guess.
  song: Key;
  // Whether the song key is guessed, since no key is set.
  guessed: boolean;
  // The key guessed from the chords now, also when a key is set.
  guess: Key | null;
  // The sheet can be shown in another key, but not changed.
  readOnly?: boolean;
  // Only for showing the sheet in another key: nothing to change is offered.
  viewOnly?: boolean;
  onPick: (key: Key) => void;
  // Sets the song's key, without moving a chord.
  onSet?: (key: Key) => void;
  onStep: (step: 1 | -1) => void;
  onBack: () => void;
  // Moves the chords to the shown key, which becomes the song key.
  onMake?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}) {
  const { open, dialog, wrapperProps, toggleProps, dialogProps } = usePanel();
  const transposed = !sameKey(current, song);
  const distance = distanceText(semitonesFrom(song, current));

  return (
    // Opening the panel doesn't stop editing (see SheetEditor).
    <div className="key-button" {...wrapperProps} data-keeps-editing>
      <button
        {...toggleProps}
        type="button"
        className="key-button-toggle"
        aria-label={[`Key ${spokenKey(current)}`, distance.spoken]
          .filter(Boolean)
          .join(", ")}
        data-transposed={transposed || undefined}
      >
        Key {keyName(current)}
        {distance.written && (
          <span className="key-button-distance">
            {" · "}
            {distance.written}
          </span>
        )}
        <Icon name="expandMore" size={22} />
      </button>
      <dialog
        {...dialogProps}
        className="key-panel"
        aria-label="Key"
        onKeyDown={(event) => {
          // Undo and redo reach the sheet from here.
          if (viewOnly) return;
          if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
          const key = event.key.toLowerCase();
          if (key === "z" && !event.shiftKey) onUndo();
          else if ((key === "z" && event.shiftKey) || key === "y") onRedo();
          else return;
          event.preventDefault();
        }}
      >
        {open && (
          <KeyPanel
            current={current}
            song={song}
            guessed={guessed}
            guess={guess}
            readOnly={readOnly}
            viewOnly={viewOnly}
            onPick={onPick}
            onSet={onSet}
            onStep={onStep}
            // "Back" is disabled and "Make" goes away with the change, so the
            // focus moves to the marked key.
            onBack={() => {
              onBack();
              focusMarked(dialog.current);
            }}
            onMake={() => {
              onMake();
              focusMarked(dialog.current);
            }}
          />
        )}
      </dialog>
    </div>
  );
}

// Focuses the marked key in the panel once it has rendered, or `fallback`
// when no key is marked.
function focusMarked(content: HTMLElement | null, fallback = "button") {
  requestAnimationFrame(() => {
    (
      content?.querySelector<HTMLElement>("[aria-pressed=true]") ??
      content?.querySelector<HTMLElement>(fallback)
    )?.focus();
  });
}

// What the panel holds: the song's key with "Change", then the keys to
// show the sheet in, the steps, "Back" to the song key and, while the sheet
// is shown in another key, "Make … the song key". "Back" is always there,
// so nothing moves when the key changes. "Change" turns the panel into the
// list of keys the song can be in, until one is picked or Cancel. To view
// only, neither "Change" nor "Make … the song key" is there.
export function KeyPanel({
  current,
  song,
  guessed,
  guess,
  readOnly = false,
  viewOnly = false,
  onPick,
  onSet,
  onStep,
  onBack,
  onMake,
}: {
  current: Key;
  song: Key;
  guessed: boolean;
  guess: Key | null;
  readOnly?: boolean;
  viewOnly?: boolean;
  onPick: (key: Key) => void;
  onSet: (key: Key) => void;
  onStep: (step: 1 | -1) => void;
  onBack: () => void;
  onMake: () => void;
}) {
  const [changing, setChanging] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const songId = useId();
  const transposeId = useId();
  const transposed = !sameKey(current, song);

  function stopChanging() {
    setChanging(false);
    focusMarked(content.current);
  }

  if (changing) {
    return (
      <div className="key-panel-content" ref={content}>
        <SongKeyPanel
          current={song}
          guess={guess}
          onSet={(key) => {
            onSet(key);
            stopChanging();
          }}
          onCancel={stopChanging}
        />
      </div>
    );
  }

  return (
    <div className="key-panel-content" ref={content}>
      <section className="key-panel-song" aria-labelledby={songId}>
        <div className="key-panel-header">
          <h2 id={songId}>Song key</h2>
          <p className="key-panel-song-key">{keyName(song)}</p>
          {guessed && <p>Guessed from the chords</p>}
        </div>
        {!viewOnly && (
          <Button
            variant="text"
            size="small"
            className="key-panel-change"
            aria-label="Change the song key"
            disabled={readOnly}
            onClick={() => {
              setChanging(true);
              focusMarked(content.current);
            }}
          >
            Change
          </Button>
        )}
      </section>
      <section className="key-panel-transpose" aria-labelledby={transposeId}>
        <h2 id={transposeId}>Transpose to</h2>
        <KeyGrid
          keys={keysToMoveTo(song.minor)}
          current={current}
          onPick={onPick}
        />
        <div className="key-panel-steps">
          <IconButton
            icon="remove"
            label="Down a semitone"
            className="key-panel-step"
            onClick={() => {
              onStep(-1);
            }}
          />
          <span className="key-panel-step-label">One semitone</span>
          <IconButton
            icon="add"
            label="Up a semitone"
            className="key-panel-step"
            onClick={() => {
              onStep(1);
            }}
          />
        </div>
        <div className="key-panel-ways">
          <Button
            variant="text"
            className="key-panel-back"
            disabled={!transposed}
            onClick={onBack}
          >
            Back to {keyName(song)}
          </Button>
          {transposed && !viewOnly && (
            <Button
              variant="text"
              className="key-panel-make"
              disabled={readOnly}
              onClick={onMake}
            >
              Make {keyName(current)} the song key
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

// The keys the song can be in, major and minor, with the sheet's key
// marked. The key guessed from the chords is named, and has a dot in the
// grid when it isn't the sheet's key. A pick sets the song's key and moves
// no chord.
export function SongKeyPanel({
  current,
  guess,
  onSet,
  onCancel,
}: {
  current: Key;
  guess: Key | null;
  onSet: (key: Key) => void;
  onCancel: () => void;
}) {
  const songId = useId();
  const dotted = guess !== null && !sameKey(guess, current);
  return (
    <section className="key-panel-song-keys" aria-labelledby={songId}>
      <div className="key-panel-header">
        <h2 id={songId}>Song key</h2>
        <p>Pick the key the song is in. The chords stay as they are.</p>
        {guess && (
          <p className="key-panel-guess">
            {dotted && <span className="key-panel-guess-dot" aria-hidden />}
            Guessed from the chords: {keyName(guess)}
          </p>
        )}
      </div>
      {[false, true].map((minor) => (
        <section
          key={String(minor)}
          className="key-panel-mode"
          aria-label={minor ? "Minor" : "Major"}
        >
          <h3>{minor ? "Minor" : "Major"}</h3>
          <KeyGrid
            keys={keysToMoveTo(minor)}
            current={current.minor === minor ? current : null}
            guess={dotted && guess.minor === minor ? guess : null}
            onPick={onSet}
          />
        </section>
      ))}
      <Button variant="text" className="key-panel-back" onClick={onCancel}>
        Cancel
      </Button>
    </section>
  );
}

// Whether a key in the grid stands for `key`: the key itself where it is
// listed. A key that isn't listed, such as G#, stands for the key at its
// pitch, Ab, unless two keys share that cell.
function standsFor(cells: Key[][], key: Key | null): (cell: Key) => boolean {
  if (!key) return () => false;
  const listed = cells.flat().find((cell) => sameKey(cell, key));
  if (listed) return (cell) => sameKey(cell, listed);
  const pitch = pitchOf(key.tonic);
  return (cell) => pitchOf(cell.tonic) === pitch && cells[pitch]?.length === 1;
}

// A grid of keys, one cell per pitch from C, with `current` marked and
// `guess` dotted.
function KeyGrid({
  keys: cells,
  current,
  guess = null,
  onPick,
}: {
  keys: Key[][];
  current: Key | null;
  guess?: Key | null;
  onPick: (key: Key) => void;
}) {
  const marked = standsFor(cells, current);
  const guessed = standsFor(cells, guess);

  return (
    <div className="key-panel-keys">
      {cells.map((cell) => {
        const keys = cell.map((key) => (
          <button
            key={key.tonic}
            type="button"
            className="key-panel-key"
            aria-label={spokenKey(key)}
            aria-pressed={marked(key)}
            data-guess={guessed(key) || undefined}
            onClick={() => {
              onPick(key);
            }}
          >
            {keyName(key)}
          </button>
        ));
        return cell.length === 1 ? (
          keys
        ) : (
          <div
            key={cell.map((key) => key.tonic).join()}
            role="group"
            className="key-panel-split"
            aria-label={cell.map(spokenKey).join(" or ")}
          >
            {keys}
          </div>
        );
      })}
    </div>
  );
}

function noop() {
  // Nothing to do: the panel doesn't offer it.
}
