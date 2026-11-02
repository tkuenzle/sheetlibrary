import "./sheet-details.css";

import { ARTIST_MAX, TITLE_MAX } from "chordsheet";
import { useEffect, useRef } from "react";

import { Icon } from "../ui/icon";
import { keptArtist, keptTitle } from "./details";

// The sheet's title and artist, edited in place on the sheet page. See
// openspec/specs/sheet-page.

// A field over a title or an artist. It opens with its text selected. Enter
// or a click elsewhere keeps the text; Escape cancels. `viaKey` says whether
// a key closed it, so the caller can move the focus back.
export function DetailField({
  initial,
  label,
  placeholder,
  maxLength,
  className,
  onKeep,
  onCancel,
}: {
  initial: string;
  label: string;
  // Gives an empty field its width, such as a new artist's.
  placeholder?: string;
  maxLength: number;
  className: string;
  onKeep: (text: string, viaKey: boolean) => void;
  onCancel: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  // Closing moves the focus, and the blur must not keep a second time.
  const closed = useRef(false);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  function keep(viaKey: boolean) {
    if (closed.current) return;
    closed.current = true;
    onKeep(input.current?.value ?? initial, viaKey);
  }

  return (
    <input
      ref={input}
      className={`detail-field ${className}`}
      defaultValue={initial}
      aria-label={label}
      placeholder={placeholder}
      maxLength={maxLength}
      enterKeyHint="done"
      autoComplete="off"
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Enter") {
          event.preventDefault();
          keep(true);
        } else if (event.key === "Escape") {
          event.preventDefault();
          if (closed.current) return;
          closed.current = true;
          onCancel();
        }
      }}
      onBlur={() => {
        keep(false);
      }}
    />
  );
}

// Moves the focus back to the button once a field closed with a key.
function useFocusBack(editing: boolean) {
  const button = useRef<HTMLButtonElement>(null);
  const focusBack = useRef(false);
  useEffect(() => {
    if (editing || !focusBack.current) return;
    focusBack.current = false;
    button.current?.focus();
  }, [editing]);
  return { button, focusBack };
}

interface InPlaceProps<T> {
  editing: boolean;
  readOnly: boolean;
  onOpen: () => void;
  // The kept value, or null when the field was cancelled.
  onClose: (value: T | null) => void;
}

// The title inside the heading: a button that opens the field.
export function TitleInPlace({
  title,
  editing,
  readOnly,
  onOpen,
  onClose,
}: InPlaceProps<string> & { title: string }) {
  const { button, focusBack } = useFocusBack(editing);
  if (editing) {
    return (
      <DetailField
        initial={title}
        label="Title"
        maxLength={TITLE_MAX}
        className="detail-field-title"
        onKeep={(text, viaKey) => {
          focusBack.current = viaKey;
          onClose(keptTitle(text));
        }}
        onCancel={() => {
          focusBack.current = true;
          onClose(null);
        }}
      />
    );
  }
  return (
    <button
      ref={button}
      type="button"
      className="detail-button detail-button-title"
      disabled={readOnly}
      onClick={onOpen}
    >
      {title}
    </button>
  );
}

// The artist below the title, or "Add artist" when there is none.
export function ArtistInPlace({
  artist,
  editing,
  readOnly,
  onOpen,
  onClose,
}: InPlaceProps<string | undefined> & { artist: string | undefined }) {
  const { button, focusBack } = useFocusBack(editing);
  if (editing) {
    return (
      <DetailField
        initial={artist ?? ""}
        label="Artist"
        placeholder="Artist"
        maxLength={ARTIST_MAX}
        className="detail-field-artist"
        onKeep={(text, viaKey) => {
          focusBack.current = viaKey;
          onClose(keptArtist(text));
        }}
        onCancel={() => {
          focusBack.current = true;
          onClose(null);
        }}
      />
    );
  }
  if (artist === undefined) {
    // A sheet that can't change shows no "Add artist".
    if (readOnly) return null;
    return (
      <button
        ref={button}
        type="button"
        className="detail-button detail-button-add"
        onClick={onOpen}
      >
        <Icon name="add" size={20} />
        Add artist
      </button>
    );
  }
  return (
    <button
      ref={button}
      type="button"
      className="detail-button detail-button-artist"
      disabled={readOnly}
      onClick={onOpen}
    >
      {artist}
    </button>
  );
}
