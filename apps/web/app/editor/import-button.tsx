import "./import-button.css";

import { type ChordSheet, readUltimateGuitar } from "chordsheet";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { Button } from "../ui/button";
import { Note } from "../ui/note";

const name = "Import from Ultimate Guitar";

// The button that imports a sheet from text copied from Ultimate Guitar. It
// opens the ImportDialog below.
export function ImportButton({
  onImport,
  note,
  variant = "text",
  size,
  className,
}: {
  onImport: ImportHandler;
  // Shown above the buttons, such as that the sheet on the page is replaced.
  note?: ReactNode;
  variant?: "tonal" | "text";
  size?: "large";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  return (
    // Opening the import doesn't stop editing (see SheetEditor).
    <div
      className={className ? `import-button ${className}` : "import-button"}
      data-keeps-editing
    >
      <Button
        ref={button}
        variant={variant}
        size={size}
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
      <ImportDialog
        open={open}
        note={note}
        onImport={onImport}
        onClose={() => {
          setOpen(false);
          button.current?.focus();
        }}
      />
    </div>
  );
}

// Either uses the sheet right away, and the dialog closes, or returns a
// promise. While that runs, the buttons are disabled and Escape and the
// backdrop do nothing. A message it resolves to shows in the dialog, with
// the text kept, and the buttons work again. Resolving to nothing means the
// page is going, so the dialog stays as it is until it does.
export type ImportHandler = (
  sheet: ChordSheet,
) => Promise<string | undefined> | undefined;

// The modal dialog to paste text from Ultimate Guitar into, open while
// `open` is. Its content is only rendered while it is open, so the text goes
// when it closes. `onClose` is called when it closes, for the caller to set
// `open` back and move the focus.
export function ImportDialog({
  open,
  onClose,
  onImport,
  note,
}: {
  open: boolean;
  onClose: () => void;
  onImport: ImportHandler;
  note?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    dialog.current?.querySelector("textarea")?.focus();
  }, [open]);

  function close() {
    if (!busy) dialog.current?.close();
  }

  function importSheet(sheet: ChordSheet) {
    const result = onImport(sheet);
    if (!result) {
      dialog.current?.close();
      return;
    }
    setBusy(true);
    setFailure(undefined);
    void result.then((message) => {
      if (message === undefined) return;
      setFailure(message);
      setBusy(false);
    });
  }

  return (
    <dialog
      ref={dialog}
      className="import-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={() => {
        setBusy(false);
        setFailure(undefined);
        onClose();
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
          note={note}
          busy={busy}
          failure={failure}
          onCancel={close}
          onImport={importSheet}
        />
      )}
    </dialog>
  );
}

// What the dialog holds: the field to paste into, the note when there is
// one, the failure when there is one, Cancel and Import.
export function ImportForm({
  titleId,
  note,
  busy = false,
  failure,
  onCancel,
  onImport,
}: {
  titleId: string;
  note?: ReactNode;
  busy?: boolean;
  failure?: string;
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
        if (busy || text.trim() === "") return;
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
          readOnly={busy}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
      </div>
      {note && <Note>{note}</Note>}
      {failure && <Note>{failure}</Note>}
      <div className="import-actions">
        <Button variant="text" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || text.trim() === ""}>
          Import
        </Button>
      </div>
    </form>
  );
}
