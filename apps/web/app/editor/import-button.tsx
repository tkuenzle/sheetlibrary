import "./import-button.css";

import { type ChordSheet, readUltimateGuitar } from "chordsheet";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "../ui/button";
import { Note } from "../ui/note";

const name = "Import from Ultimate Guitar";

// The top bar's button that imports a sheet from text copied from Ultimate
// Guitar. It opens a modal dialog to paste the text into. The dialog's
// content is only rendered while it is open, so the text goes when it
// closes.
export function ImportButton({
  onImport,
}: {
  onImport: (sheet: ChordSheet) => void;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    dialog.current?.querySelector("textarea")?.focus();
  }, [open]);

  function close() {
    dialog.current?.close();
  }

  return (
    // Opening the import doesn't stop editing (see SheetEditor).
    <div className="import-button" data-keeps-editing>
      <Button
        ref={button}
        variant="text"
        icon="contentPasteGo"
        className="import-button-toggle"
        aria-label={name}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
        }}
      >
        <span className="import-button-text">Import</span>
      </Button>
      <dialog
        ref={dialog}
        className="import-dialog"
        aria-labelledby={titleId}
        onClose={() => {
          setOpen(false);
          button.current?.focus();
        }}
        // The content fills the dialog, so a click on the dialog itself was
        // on the backdrop.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        {open && (
          <ImportForm
            titleId={titleId}
            onCancel={close}
            onImport={(sheet) => {
              onImport(sheet);
              close();
            }}
          />
        )}
      </dialog>
    </div>
  );
}

// What the dialog holds: the field to paste into, the note that the sheet
// is replaced, Cancel and Import.
export function ImportForm({
  titleId,
  onCancel,
  onImport,
}: {
  titleId: string;
  onCancel: () => void;
  onImport: (sheet: ChordSheet) => void;
}) {
  const [text, setText] = useState("");
  const fieldId = useId();
  const hintId = useId();

  return (
    <form
      className="import-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (text.trim() === "") return;
        onImport(readUltimateGuitar(text));
      }}
    >
      <h2 id={titleId}>{name}</h2>
      <div className="import-field">
        <label htmlFor={fieldId}>Chords and lyrics</label>
        <p id={hintId}>
          Copy the chords and lyrics from the Ultimate Guitar page and paste
          them here
        </p>
        <textarea
          id={fieldId}
          aria-describedby={hintId}
          value={text}
          rows={12}
          wrap="off"
          spellCheck={false}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
      </div>
      <Note>
        Importing replaces the sheet on this page. It can’t be undone.
      </Note>
      <div className="import-actions">
        <Button variant="text" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={text.trim() === ""}>
          Import
        </Button>
      </div>
    </form>
  );
}
