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
// sheet's original key.
export function KeyButton({
  current,
  original,
  onPick,
  onStep,
  onBack,
  onUndo,
  onRedo,
}: {
  current: Key;
  // The key the sheet was in when it was loaded.
  original: Key;
  onPick: (key: Key) => void;
  onStep: (step: 1 | -1) => void;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

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
          else setOpen(true);
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
          setOpen(false);
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
        {open && (
          <KeyPanel
            current={current}
            original={original}
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

// What the panel holds: the keys to move to, the steps, and "Back" to the
// original key. "Back" is always there, so nothing moves when the key
// changes.
export function KeyPanel({
  current,
  original,
  titleId,
  onPick,
  onStep,
  onBack,
}: {
  current: Key;
  original: Key;
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
        <p>
          The original key, {keyName(original)}, is guessed from the chords.
        </p>
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
      <Button
        variant="text"
        className="key-panel-back"
        disabled={sameKey(current, original)}
        onClick={onBack}
      >
        Back to {keyName(original)}
      </Button>
    </div>
  );
}
