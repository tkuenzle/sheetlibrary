import "./key-button.css";

import { type Key, keysToMoveTo, pitchOf } from "chordsheet";
import { useEffect, useId, useRef, useState } from "react";

import { phone } from "../breakpoints";
import { Button, IconButton } from "../ui/button";
import { Icon } from "../ui/icon";

// The key as written: "G", "Em".
export function keyName(key: Key): string {
  return `${key.tonic}${key.minor ? "m" : ""}`;
}

// The key as read out: "F sharp", "E minor".
function spokenKey(key: Key): string {
  const accidental = { "#": " sharp", b: " flat" }[key.tonic.charAt(1)] ?? "";
  return `${key.tonic.charAt(0)}${accidental}${key.minor ? " minor" : ""}`;
}

function sameKey(a: Key, b: Key): boolean {
  return a.tonic === b.tonic && a.minor === b.minor;
}

// The sheet's key beside its title. It opens a panel with the keys to move
// to and steps of a semitone: under the button, or a bottom sheet on a
// phone. The panel stays open after a pick, and offers to go back to the
// key it opened in.
export function KeyButton({
  current,
  onOpen,
  onPick,
  onStep,
  onBack,
  onUndo,
  onRedo,
}: {
  current: Key;
  // Called when the panel opens, so "Back" can return to the sheet as it
  // was then.
  onOpen: () => void;
  onPick: (key: Key) => void;
  onStep: (step: 1 | -1) => void;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const [openedIn, setOpenedIn] = useState<Key | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const open = openedIn !== null;

  function show() {
    onOpen();
    setOpenedIn(current);
  }

  function close() {
    dialog.current?.close();
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

  return (
    // Opening the panel doesn't stop editing (see SheetEditor).
    <div className="key-button" ref={wrapper} data-keeps-editing>
      <button
        ref={button}
        type="button"
        className="key-button-toggle"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Key ${spokenKey(current)}`}
        onClick={() => {
          if (open) close();
          else show();
        }}
      >
        Key {keyName(current)}
        <Icon name="expandMore" size={22} />
      </button>
      <dialog
        ref={dialog}
        className="key-panel"
        aria-labelledby={titleId}
        onClose={() => {
          setOpenedIn(null);
          button.current?.focus();
        }}
        onKeyDown={(event) => {
          // Undo and redo reach the sheet from here.
          if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
          const key = event.key.toLowerCase();
          if (key === "z" && !event.shiftKey) onUndo();
          else if ((key === "z" && event.shiftKey) || key === "y") onRedo();
          else return;
          event.preventDefault();
        }}
        // As a sheet, the dialog fills its box, so a click on it itself was
        // on the backdrop.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        {openedIn && (
          <KeyPanel
            current={current}
            openedIn={openedIn}
            titleId={titleId}
            onPick={onPick}
            onStep={onStep}
            onBack={() => {
              onBack();
              // "Back" goes away with the change, so the focus moves to the
              // key it went back to.
              requestAnimationFrame(() => {
                dialog.current
                  ?.querySelector<HTMLElement>("[aria-pressed=true]")
                  ?.focus();
              });
            }}
          />
        )}
      </dialog>
    </div>
  );
}

// What the panel holds: the keys to move to, the steps, and "Back" once the
// key has changed.
export function KeyPanel({
  current,
  openedIn,
  titleId,
  onPick,
  onStep,
  onBack,
}: {
  current: Key;
  // The key the panel opened in.
  openedIn: Key;
  titleId: string;
  onPick: (key: Key) => void;
  onStep: (step: 1 | -1) => void;
  onBack: () => void;
}) {
  const cells = keysToMoveTo(current.minor);
  // The current key is marked where it is listed. A sheet in a key that
  // isn't listed, such as G#, marks the key at its pitch, Ab.
  const listed = cells.flat().find((key) => sameKey(key, current));
  const pitch = pitchOf(current.tonic);
  const marked = (key: Key) =>
    listed
      ? sameKey(key, listed)
      : pitchOf(key.tonic) === pitch && cells[pitch]?.length === 1;

  return (
    <div className="key-panel-content">
      <div className="key-panel-header">
        <h2 id={titleId}>Transpose to</h2>
        <p>{keyName(current)} is guessed from the chords.</p>
      </div>
      <div className="key-panel-keys">
        {cells.map((cell) => {
          const keys = cell.map((key) => (
            <button
              key={key.tonic}
              type="button"
              className="key-panel-key"
              aria-label={spokenKey(key)}
              aria-pressed={marked(key)}
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
      <div className="key-panel-steps">
        <IconButton
          icon="remove"
          label="Down a semitone"
          className="key-panel-step"
          onClick={() => {
            onStep(-1);
          }}
        />
        <span>One semitone</span>
        <IconButton
          icon="add"
          label="Up a semitone"
          className="key-panel-step"
          onClick={() => {
            onStep(1);
          }}
        />
      </div>
      {!sameKey(current, openedIn) && (
        <Button variant="text" className="key-panel-back" onClick={onBack}>
          Back to {keyName(openedIn)}
        </Button>
      )}
    </div>
  );
}
