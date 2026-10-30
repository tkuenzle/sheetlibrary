import "./chord-input.css";

import { Dock } from "chord-editor";
import {
  type ChordSymbol,
  type Key,
  type MarkedChord,
  readMarkedChord,
  suggestChords,
  typedMark,
  writeChord,
  writeMarkedChord,
} from "chordsheet";
import {
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Button } from "../ui/button";
import { Note } from "../ui/note";
import { Popover } from "../ui/popover";

// The chord input: a field for a chord, a preview of what it reads as, and
// one row of suggestions. Below the chord's letter, or docked at the bottom
// of the visible area, above the keyboard. Give it a new key each time it
// opens, so it starts from `initial`. The caller focuses the field.
export function ChordInput({
  inputRef,
  formRef,
  left,
  top,
  docked,
  closing,
  initial,
  editing,
  sheetChords,
  sheetKey,
  letterBox,
  onCommit,
  onRemove,
  onCancel,
  onClosed,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  formRef: RefObject<HTMLFormElement | null>;
  // Where the form goes when it isn't docked, in the editor's frame.
  left: number;
  top: number;
  docked: boolean;
  // Closed, and sliding out of view. It takes no input.
  closing: boolean;
  initial: string;
  // The chord being edited, or null for a new one.
  editing: MarkedChord | null;
  sheetChords: ChordSymbol[];
  sheetKey: Key | null;
  // The letter the chord goes on, in window coordinates, to keep it above
  // the docked form.
  letterBox: () => { top: number; bottom: number } | null;
  // Done or a picked suggestion: the chord, or null to remove the one being
  // edited.
  onCommit: (chord: MarkedChord | null) => void;
  onRemove: () => void;
  onCancel: () => void;
  // The closing input is out of view.
  onClosed: () => void;
}) {
  const [text, setText] = useState(initial);
  // Done was pressed on text that isn't a chord. Cleared when the text
  // changes.
  const [notChord, setNotChord] = useState(false);
  // The suggestion chosen with the arrow keys, as an index into `shown`.
  const [chosen, setChosen] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const noteId = useId();
  // While editing, the suggestions show once the text changes, so they
  // don't all narrow to the chord being edited.
  const [typed, setTyped] = useState(editing === null);
  const shown = suggestChords(typed ? text : "", sheetChords, sheetKey);
  const chosenSuggestion = shown[chosen];
  const chord = readMarkedChord(text);
  // Read when the visible area changes, not when the form opens.
  const letterBoxRef = useRef(letterBox);
  useEffect(() => {
    letterBoxRef.current = letterBox;
  });

  // The suggestion chosen with the arrow keys scrolls into view, where the
  // row scrolls.
  useEffect(() => {
    listRef.current?.children[chosen]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [chosen]);

  // Docked, the form stays above the keyboard, the page gets room for it
  // after its content, and the letter is kept above it.
  useLayoutEffect(() => {
    const form = formRef.current;
    if (!docked || !form) return;
    const root = document.documentElement;
    const keepLetter = () => {
      const box = letterBoxRef.current();
      // The chords sit about a line above the letter.
      if (box) dock.keepAbove({ ...box, top: 2 * box.top - box.bottom });
    };
    const dock: Dock = new Dock(form, {
      docked: () => true,
      place: () => {
        dock.lift();
      },
      onResize: () => {
        dock.moved();
        keepLetter();
      },
    });
    dock.lift();
    root.style.setProperty(
      "--chord-input-height",
      `${String(form.offsetHeight)}px`,
    );
    keepLetter();
    return () => {
      dock.destroy();
      root.style.removeProperty("--chord-input-height");
    };
  }, [docked, formRef]);

  // In case the slide doesn't end, as in a tab in the background.
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  });
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => {
      onClosedRef.current();
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [closing]);

  function pick(suggestion: ChordSymbol) {
    const mark = typedMark(text);
    onCommit(mark ? { ...suggestion, mark } : suggestion);
  }

  function done() {
    // Empty text adds nothing, and removes a chord being edited.
    if (text.trim() && !chord) {
      setNotChord(true);
      inputRef.current?.focus();
      return;
    }
    onCommit(chord);
  }

  let preview = null;
  if (chord) {
    const written = writeMarkedChord(chord);
    if (!editing) {
      preview = (
        <>
          Adds <b>{written}</b>
        </>
      );
    } else if (written !== writeMarkedChord(editing)) {
      preview = (
        <>
          Changes {writeMarkedChord(editing)} to <b>{written}</b>
        </>
      );
    }
  }

  return (
    <form
      ref={formRef}
      className="chord-input"
      data-docked={docked ? "" : undefined}
      data-closing={closing ? "" : undefined}
      inert={closing}
      style={docked ? undefined : { left, top }}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) onClosed();
      }}
      onSubmit={(event) => {
        event.preventDefault();
        done();
      }}
    >
      <Popover
        className="chord-input-panel"
        // Keeps the focus in the field when a button or a suggestion is
        // pressed. On a phone, the field losing it would close the keyboard,
        // and the page would jump when Done shows the note and focuses it
        // again.
        onMouseDown={(event) => {
          if (event.target !== inputRef.current) event.preventDefault();
        }}
      >
        <div className="chord-input-field">
          <input
            ref={inputRef}
            defaultValue={initial}
            aria-label="Chord"
            placeholder="Type a chord"
            role="combobox"
            aria-expanded={shown.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              chosenSuggestion ? `${listId}-${String(chosen)}` : undefined
            }
            aria-invalid={notChord || undefined}
            aria-describedby={notChord ? noteId : undefined}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            onChange={(event) => {
              setText(event.target.value);
              setTyped(true);
              setChosen(-1);
              setNotChord(false);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                // Past either end, nothing is chosen, then it wraps around.
                const next = chosen + (event.key === "ArrowDown" ? 1 : -1);
                if (next < -1) setChosen(shown.length - 1);
                else setChosen(next < shown.length ? next : -1);
              } else if (event.key === "Enter" && chosenSuggestion) {
                event.preventDefault();
                pick(chosenSuggestion.chord);
              } else if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
              }
            }}
          />
          <Button type="submit" size="small">
            Done
          </Button>
        </div>
        <p className="chord-input-preview" aria-live="polite">
          {preview}
        </p>
        <div className="chord-input-suggestions" hidden={shown.length === 0}>
          <div className="chord-input-heading" aria-hidden="true">
            Suggested
            {shown.some((s) => !s.inSheet) && (
              <span className="chord-input-legend">
                <span className="chord-input-swatch" />
                Not in this sheet yet
              </span>
            )}
          </div>
          <ul ref={listRef} id={listId} role="listbox" aria-label="Suggestions">
            {shown.map((suggestion, index) => {
              const written = writeChord(suggestion.chord);
              return (
                <li
                  key={written}
                  id={`${listId}-${String(index)}`}
                  role="option"
                  aria-selected={index === chosen}
                  aria-label={
                    suggestion.inSheet
                      ? undefined
                      : `${written}, not in this sheet yet`
                  }
                  data-new={suggestion.inSheet ? undefined : ""}
                  onClick={() => {
                    pick(suggestion.chord);
                  }}
                >
                  {written}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="chord-input-actions">
          {editing && (
            <Button variant="text" size="small" onClick={onRemove}>
              Remove
            </Button>
          )}
          <Button variant="text" size="small" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Popover>
      {notChord && <Note id={noteId}>Type a chord, such as Am or G7.</Note>}
    </form>
  );
}
