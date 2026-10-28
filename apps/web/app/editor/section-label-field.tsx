import "./section-label-field.css";

import { LABEL_MAX } from "chordsheet";
import { type Ref, useId, useRef, useState } from "react";

// Offered below the field, in this order.
export const labelSuggestions = [
  "Intro",
  "Verse",
  "Pre-chorus",
  "Chorus",
  "Bridge",
  "Solo",
  "Outro",
];

// The suggestions that contain the typed text, ignoring case. All of them
// while the field is empty.
export function suggestionsFor(text: string): string[] {
  const typed = text.trim().toLocaleLowerCase();
  return labelSuggestions.filter((suggestion) =>
    suggestion.toLocaleLowerCase().includes(typed),
  );
}

// The active section's label, edited in its place. The editor says where
// the label is; the field lies over it. Enter, a click elsewhere or a picked
// suggestion keeps the text; Escape cancels. The caller cleans the text up,
// and an empty one removes the label.
export function SectionLabelField({
  left,
  top,
  height,
  initial,
  onKeep,
  onCancel,
  ref,
}: {
  left: number;
  top: number;
  height: number;
  initial: string;
  onKeep: (label: string) => void;
  onCancel: () => void;
  ref?: Ref<HTMLInputElement>;
}) {
  const [text, setText] = useState(initial);
  // All suggestions show until the user types, also over an existing label.
  const [typed, setTyped] = useState(false);
  // The suggestion chosen with the arrow keys, as an index into `shown`.
  const [chosen, setChosen] = useState(-1);
  // Closing moves the focus, and the blur must not keep a second time.
  const closed = useRef(false);
  const listId = useId();
  const shown = suggestionsFor(typed ? text : "");
  const chosenSuggestion = shown[chosen];

  function keep(label: string) {
    if (closed.current) return;
    closed.current = true;
    onKeep(label);
  }

  function cancel() {
    if (closed.current) return;
    closed.current = true;
    onCancel();
  }

  return (
    <div className="section-label-field" style={{ left, top }}>
      <input
        ref={ref}
        value={text}
        // The width follows the text where `field-sizing` isn't supported.
        size={Math.max(text.length, 5)}
        maxLength={LABEL_MAX}
        style={{ height }}
        role="combobox"
        aria-label="Label"
        aria-expanded={shown.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          chosenSuggestion ? `${listId}-${String(chosen)}` : undefined
        }
        enterKeyHint="done"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          setText(event.target.value);
          setTyped(true);
          setChosen(-1);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            // Past either end, nothing is chosen, then it wraps around.
            const next = chosen + (event.key === "ArrowDown" ? 1 : -1);
            if (next < -1) setChosen(shown.length - 1);
            else setChosen(next < shown.length ? next : -1);
          } else if (event.key === "Enter") {
            event.preventDefault();
            keep(chosenSuggestion ?? text);
          } else if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
        onBlur={() => {
          keep(text);
        }}
      />
      <ul
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        className="section-label-suggestions"
        hidden={shown.length === 0}
      >
        {shown.map((suggestion, index) => (
          <li
            key={suggestion}
            id={`${listId}-${String(index)}`}
            role="option"
            aria-selected={index === chosen}
            // Keeps the focus in the field until the click picks it.
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              keep(suggestion);
            }}
          >
            {suggestion}
          </li>
        ))}
      </ul>
    </div>
  );
}
