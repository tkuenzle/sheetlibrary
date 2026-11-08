import "./key-button.css";

import { type Key, keysToMoveTo, pitchOf, sameKey } from "chordsheet";
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

// The sheet's key beside its title. It opens a panel with the keys to move
// to and steps of a semitone: under the button, or a bottom sheet on a
// phone. The panel stays open after a pick, and offers to go back to the
// sheet's original key and to change which key the song is in.
export function KeyButton({
  current,
  original,
  guessed,
  onPick,
  onSet,
  onStep,
  onBack,
  onUndo,
  onRedo,
}: {
  current: Key;
  // The key the sheet was in when it was loaded, or the key set since.
  original: Key;
  // Whether the original key was guessed from the chords.
  guessed: boolean;
  onPick: (key: Key) => void;
  // Sets the song's key, without moving a chord.
  onSet: (key: Key) => void;
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
            guessed={guessed}
            titleId={titleId}
            onPick={onPick}
            onSet={onSet}
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

// What the panel holds: the keys to move to, the steps, and "Back" to the
// original key. "Back" is always there, so nothing moves when the key
// changes. "Change" turns the panel into the list of keys the song can be
// in, until one is picked or Cancel.
export function KeyPanel({
  current,
  original,
  guessed,
  titleId,
  onPick,
  onSet,
  onStep,
  onBack,
}: {
  current: Key;
  original: Key;
  guessed: boolean;
  titleId: string;
  onPick: (key: Key) => void;
  onSet: (key: Key) => void;
  onStep: (step: 1 | -1) => void;
  onBack: () => void;
}) {
  const [changing, setChanging] = useState(false);
  const content = useRef<HTMLDivElement>(null);

  function stopChanging() {
    setChanging(false);
    focusMarked(content.current);
  }

  if (changing) {
    return (
      <div className="key-panel-content" ref={content}>
        <SongKeyPanel
          current={current}
          titleId={titleId}
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
      <div className="key-panel-header">
        <h2 id={titleId}>Transpose to</h2>
        <div className="key-panel-original">
          <p>
            {guessed ? (
              <>
                The original key, {keyName(original)}, is guessed from the
                chords.
              </>
            ) : (
              <>The original key is {keyName(original)}.</>
            )}
          </p>
          <Button
            variant="text"
            size="small"
            className="key-panel-change"
            aria-label="Change the song's key"
            onClick={() => {
              setChanging(true);
              focusMarked(content.current);
            }}
          >
            Change
          </Button>
        </div>
      </div>
      <KeyGrid
        keys={keysToMoveTo(current.minor)}
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

// The keys the song can be in, major and minor, with the sheet's key
// marked. A pick sets the song's key and moves no chord.
export function SongKeyPanel({
  current,
  titleId,
  onSet,
  onCancel,
}: {
  current: Key;
  titleId: string;
  onSet: (key: Key) => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="key-panel-header">
        <h2 id={titleId}>This song is in</h2>
        <p>The chords stay as they are.</p>
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
            onPick={onSet}
          />
        </section>
      ))}
      <Button variant="text" className="key-panel-back" onClick={onCancel}>
        Cancel
      </Button>
    </>
  );
}

// A grid of keys, one cell per pitch from C, with `current` marked where it
// is listed. A key that isn't listed, such as G#, marks the key at its
// pitch, Ab.
function KeyGrid({
  keys: cells,
  current,
  onPick,
}: {
  keys: Key[][];
  current: Key | null;
  onPick: (key: Key) => void;
}) {
  const listed = current && cells.flat().find((key) => sameKey(key, current));
  const pitch = current && pitchOf(current.tonic);
  const marked = (key: Key) =>
    listed
      ? sameKey(key, listed)
      : pitch !== null &&
        pitchOf(key.tonic) === pitch &&
        cells[pitch]?.length === 1;

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
