import "./confirm-dialog.css";

import { type Ref, useEffect, useId, useRef, useState } from "react";

import { Button } from "./button";
import { Note } from "./note";

// A modal question before an action that can't be undone, such as deleting
// a sheet. Focus starts on Cancel, so an Enter pressed out of habit doesn't
// confirm. Escape cancels; a click on the scrim does nothing. While
// `onConfirm` runs, the buttons are disabled and Escape does nothing. If it
// fails, `failure` shows under the text and the buttons work again. Once it
// succeeds, the dialog closes.
export function ConfirmDialog({
  open,
  title,
  text,
  confirm,
  failure,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  text: string;
  // The confirm button's label, such as "Delete".
  confirm: string;
  failure: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    if (!open) return;
    setFailed(false);
    dialog.current?.showModal();
    cancel.current?.focus();
    return () => {
      dialog.current?.close();
    };
  }, [open]);

  function close() {
    dialog.current?.close();
  }

  async function run() {
    setBusy(true);
    setFailed(false);
    try {
      await onConfirm();
      close();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="confirm-dialog"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={textId}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={onClose}
    >
      {open && (
        <ConfirmContent
          titleId={titleId}
          textId={textId}
          title={title}
          text={text}
          confirm={confirm}
          failure={failed ? failure : undefined}
          busy={busy}
          cancelRef={cancel}
          onConfirm={() => void run()}
          onCancel={close}
        />
      )}
    </dialog>
  );
}

// What the dialog holds: the question, the text, the failure note when
// there is one, Cancel and the confirm button.
export function ConfirmContent({
  titleId,
  textId,
  title,
  text,
  confirm,
  failure,
  busy = false,
  cancelRef,
  onConfirm,
  onCancel,
}: {
  titleId: string;
  textId: string;
  title: string;
  text: string;
  confirm: string;
  failure?: string;
  busy?: boolean;
  cancelRef?: Ref<HTMLButtonElement>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="confirm-content">
      <h2 id={titleId}>{title}</h2>
      <p id={textId}>{text}</p>
      {failure && <Note>{failure}</Note>}
      <div className="confirm-actions">
        <Button
          ref={cancelRef}
          variant="text"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button disabled={busy} onClick={onConfirm}>
          {confirm}
        </Button>
      </div>
    </div>
  );
}
