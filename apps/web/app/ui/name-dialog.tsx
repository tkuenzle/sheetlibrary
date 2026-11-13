import "./confirm-dialog.css";
import "./name-dialog.css";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "./button";
import { Note } from "./note";

// A modal that asks for a name, such as a version's. The field starts with
// `initial` in it, selected, so typing replaces it and Enter keeps it. Enter
// or "Save" saves, unless the field is empty once trimmed; "Cancel" or
// Escape closes it. While `onSave` runs, the buttons are disabled and Escape
// does nothing. If it fails, `failure` shows and the buttons work again, or
// the note of a NameRefused it throws, such as "That name is already used".
// Built like ConfirmDialog.
export function NameDialog({
  open,
  title,
  text,
  initial,
  maxLength,
  failure,
  onSave,
  onClose,
}: {
  open: boolean;
  title: string;
  text: string;
  initial: string;
  maxLength: number;
  failure: string;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="confirm-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      {open && (
        <NameContent
          titleId={titleId}
          title={title}
          text={text}
          initial={initial}
          maxLength={maxLength}
          failure={failure}
          onSave={onSave}
          onCancel={() => dialog.current?.close()}
        />
      )}
    </dialog>
  );
}

// A save that the server refused for the name. The dialog shows its message
// in place of `failure`.
export class NameRefused extends Error {}

// The note to show after `onSave` threw `error`.
export function failureNote(error: unknown, failure: string): string {
  return error instanceof NameRefused ? error.message : failure;
}

// What the dialog holds: the title, the text, the field, the failure note
// when saving failed, "Cancel" and "Save".
export function NameContent({
  titleId,
  title,
  text,
  initial,
  maxLength,
  failure,
  onSave,
  onCancel,
}: {
  titleId: string;
  title: string;
  text: string;
  initial: string;
  maxLength: number;
  failure: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const textId = useId();

  useEffect(() => {
    field.current?.select();
  }, []);

  async function save() {
    if (busy || name.trim() === "") return;
    setBusy(true);
    setNote(null);
    try {
      await onSave(name);
    } catch (error) {
      setNote(failureNote(error, failure));
      setBusy(false);
    }
  }

  return (
    <form
      className="confirm-content"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && busy) event.preventDefault();
      }}
    >
      <h2 id={titleId}>{title}</h2>
      <p id={textId}>{text}</p>
      <div className="name-field">
        <label htmlFor={fieldId}>Name</label>
        <input
          ref={field}
          id={fieldId}
          type="text"
          value={name}
          maxLength={maxLength}
          autoComplete="off"
          aria-describedby={textId}
          disabled={busy}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </div>
      {note !== null && <Note>{note}</Note>}
      <div className="confirm-actions">
        <Button type="button" variant="text" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || name.trim() === ""}>
          Save
        </Button>
      </div>
    </form>
  );
}
