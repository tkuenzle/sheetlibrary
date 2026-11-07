import "./photo-import-dialog.css";

import type { PhotoAnswer } from "chordsheet";
import { useEffect, useId, useReducer, useRef, useState } from "react";

import { Button, IconButton } from "../ui/button";
import { Icon } from "../ui/icon";
import type { IconName } from "../ui/icons";
import { Note } from "../ui/note";
import { MAX_PHOTOS } from "./limits";
import {
  canAdd,
  canImport,
  editable,
  elapsed,
  initialState,
  photoImportReducer,
  type PhotoImportState,
  photos,
} from "./photo-import-state";
import {
  browserImageTools,
  type Decoded,
  type ImageTools,
  shrinkPhoto,
} from "./shrink";
import { type UploadPhotos, uploadPhotos } from "./upload";

const name = "Import from photos";
export const NOT_READ = "The photos couldn’t be read. Try again.";

// The import from photos: a modal dialog to take or pick a photo of each
// page, which sends them to be read. Its content is only rendered while it
// is open, so the photos go when it closes. Cancel, Escape and the backdrop
// close it at any time, and closing stops the upload or the reading.
//
// `onRead` gets the sheet read from the photos and creates it. It resolves
// to true when the page is going to the new sheet, so the dialog stays as
// it is until it does, or to false when the sheet wasn't created, and the
// dialog says the photos couldn't be read. See openspec/specs/library-page.
export function PhotoImportDialog({
  open,
  onClose,
  onRead,
}: {
  open: boolean;
  onClose: () => void;
  onRead: (answer: PhotoAnswer) => Promise<boolean>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
  }, [open]);

  function close() {
    dialog.current?.close();
  }

  return (
    <dialog
      ref={dialog}
      className="photo-import-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      // The content fills the dialog, so a click on the dialog itself was
      // on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      {open && (
        <PhotoImportForm
          titleId={titleId}
          onCancel={close}
          onRead={onRead}
          upload={uploadPhotos}
          tools={browserImageTools}
        />
      )}
    </dialog>
  );
}

// The dialog's content with its state. Photos are shrunk one at a time as
// they are added, each with an object URL for its thumbnail; the URLs are
// let go when a page is removed or the dialog closes.
function PhotoImportForm<Image extends Decoded>({
  titleId,
  onCancel,
  onRead,
  upload,
  tools,
}: {
  titleId: string;
  onCancel: () => void;
  onRead: (answer: PhotoAnswer) => Promise<boolean>;
  upload: UploadPhotos;
  tools: ImageTools<Image>;
}) {
  const [state, dispatch] = useReducer(photoImportReducer, initialState);
  const [now, setNow] = useState(() => Date.now());
  // Whether the browser can take a photo from a file input. Desktop
  // browsers ignore `capture`, and don't have the property. The form is
  // only rendered in the browser, so this needs no effect.
  const [camera] = useState(() => "capture" in HTMLInputElement.prototype);
  const nextId = useRef(1);
  const shrinking = useRef(Promise.resolve());
  const thumbnails = useRef(new Set<string>());
  const controller = useRef<AbortController>(null);
  const open = useRef(true);
  // Read through a function, so a check after an await isn't taken as
  // already known.
  const closed = () => !open.current;

  useEffect(() => {
    open.current = true;
    const urls = thumbnails.current;
    return () => {
      open.current = false;
      controller.current?.abort();
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  // The time so far, while the pages are read.
  const reading = state.stage.kind === "reading";
  useEffect(() => {
    if (!reading) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [reading]);

  function add(files: File[]) {
    if (!canAdd(state)) return;
    const added = files
      .slice(0, MAX_PHOTOS - state.pages.length)
      .map((file) => ({ file, id: nextId.current++ }));
    dispatch({ type: "add", ids: added.map(({ id }) => id) });
    for (const { file, id } of added) {
      shrinking.current = shrinking.current.then(async () => {
        if (closed()) return;
        const photo = await shrinkPhoto(file, tools);
        if (closed()) return;
        if (!photo) {
          dispatch({ type: "unopenable", id });
          return;
        }
        const thumbnail = URL.createObjectURL(photo);
        thumbnails.current.add(thumbnail);
        dispatch({ type: "shrunk", id, photo, thumbnail });
      });
    }
  }

  function remove(id: number) {
    const page = state.pages.find((page) => page.id === id);
    if (page?.status === "ready") {
      URL.revokeObjectURL(page.thumbnail);
      thumbnails.current.delete(page.thumbnail);
    }
    dispatch({ type: "remove", id });
  }

  async function start() {
    if (!canImport(state)) return;
    const sent = photos(state);
    dispatch({ type: "start" });
    const current = new AbortController();
    controller.current = current;
    const fail = () => {
      if (!current.signal.aborted) dispatch({ type: "failed" });
    };
    try {
      const answer = await upload(sent, {
        onProgress: (share) => {
          dispatch({ type: "progress", sent: share });
        },
        onSent: () => {
          const at = Date.now();
          setNow(at);
          dispatch({ type: "sent", at });
        },
        signal: current.signal,
      });
      if (current.signal.aborted) return;
      if (!(await onRead(answer))) fail();
    } catch {
      fail();
    }
  }

  return (
    <PhotoImportView
      titleId={titleId}
      state={state}
      now={now}
      camera={camera}
      onAdd={add}
      onRemove={remove}
      onCancel={onCancel}
      onImport={() => void start()}
    />
  );
}

// What the dialog shows for a state: the pages, "Take photo" and "Pick
// photos" with the count, the progress or the failure, Cancel and Import.
// "Take photo" is there only with `camera`.
export function PhotoImportView({
  titleId,
  state,
  now,
  camera,
  onAdd,
  onRemove,
  onCancel,
  onImport,
}: {
  titleId: string;
  state: PhotoImportState;
  now: number;
  camera: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (id: number) => void;
  onCancel: () => void;
  onImport: () => void;
}) {
  const { pages, stage } = state;
  const changing = editable(state);
  const add = (
    <AddPhotos camera={camera} disabled={!canAdd(state)} onAdd={onAdd} />
  );

  return (
    <form
      className="photo-import"
      aria-busy={changing ? undefined : true}
      onSubmit={(event) => {
        event.preventDefault();
        onImport();
      }}
    >
      <h2 id={titleId}>{name}</h2>
      {changing && <p>Take or pick a photo of each page, in order</p>}
      {pages.length === 0 ? (
        <div className="photo-import-empty">{add}</div>
      ) : (
        <ol
          className="photo-import-pages"
          aria-label="Pages"
          data-busy={changing ? undefined : ""}
        >
          {pages.map((page, at) => {
            const number = String(at + 1);
            return (
              <li key={page.id}>
                {page.status === "ready" ? (
                  <img
                    className="photo-import-thumbnail"
                    src={page.thumbnail}
                    alt=""
                  />
                ) : (
                  <span
                    className="photo-import-thumbnail photo-import-no-thumbnail"
                    aria-hidden="true"
                  >
                    {page.status === "unopenable" && <Icon name="image" />}
                  </span>
                )}
                <span className="photo-import-page">
                  <span className="photo-import-page-name">{`Page ${number}`}</span>
                  {page.status === "unopenable" && (
                    <span>
                      This photo can’t be opened. Remove it, or add it as a
                      JPEG.
                    </span>
                  )}
                </span>
                <IconButton
                  icon="close"
                  label={`Remove page ${number}`}
                  tooltipPlacement="left"
                  disabled={!changing}
                  onClick={() => {
                    onRemove(page.id);
                  }}
                />
              </li>
            );
          })}
        </ol>
      )}
      {pages.length > 0 && changing && (
        <div className="photo-import-add">
          {add}
          <span>{`${String(pages.length)} of ${String(MAX_PHOTOS)} pages`}</span>
        </div>
      )}
      <Progress stage={stage} now={now} />
      {stage.kind === "failed" && (
        <div role="status">
          <Note>{NOT_READ}</Note>
        </div>
      )}
      <div className="photo-import-actions">
        <Button variant="text" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canImport(state)}>
          Import
        </Button>
      </div>
    </form>
  );
}

// "Take photo" opens the camera, one photo at a time, and comes first.
// "Pick photos" opens the browser's picker for several photos; without the
// camera, it is the only button. On Android, the picker has no camera.
function AddPhotos({
  camera,
  disabled,
  onAdd,
}: {
  camera: boolean;
  disabled: boolean;
  onAdd: (files: File[]) => void;
}) {
  return (
    <span className="photo-import-buttons">
      {camera && (
        <FileButton
          variant="tonal"
          icon="addAPhoto"
          capture="environment"
          disabled={disabled}
          onAdd={onAdd}
        >
          Take photo
        </FileButton>
      )}
      <FileButton
        variant={camera ? "text" : "tonal"}
        icon="photoLibrary"
        multiple
        disabled={disabled}
        onAdd={onAdd}
      >
        Pick photos
      </FileButton>
    </span>
  );
}

// A button that opens a hidden file input for images.
function FileButton({
  variant,
  icon,
  multiple,
  capture,
  disabled,
  onAdd,
  children,
}: {
  variant: "tonal" | "text";
  icon: IconName;
  multiple?: boolean;
  capture?: "environment";
  disabled: boolean;
  onAdd: (files: File[]) => void;
  children: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        capture={capture}
        hidden
        disabled={disabled}
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          // Cleared, so the same photo can be added again.
          event.target.value = "";
          if (files.length > 0) onAdd(files);
        }}
      />
      <Button
        variant={variant}
        icon={icon}
        disabled={disabled}
        onClick={() => {
          input.current?.click();
        }}
      >
        {children}
      </Button>
    </>
  );
}

// The upload in percent, then the reading with the time so far.
function Progress({
  stage,
  now,
}: {
  stage: PhotoImportState["stage"];
  now: number;
}) {
  const id = useId();
  if (stage.kind === "uploading") {
    return (
      <div className="photo-import-progress">
        <label
          htmlFor={id}
        >{`Uploading the photos… ${String(stage.percent)}%`}</label>
        <progress id={id} value={stage.percent} max={100} />
      </div>
    );
  }
  if (stage.kind === "reading") {
    return (
      <div className="photo-import-progress">
        <p className="photo-import-reading">
          <span role="status">Reading the pages…</span>
          <span className="photo-import-time">{elapsed(stage.since, now)}</span>
        </p>
        <div className="photo-import-working" aria-hidden="true">
          <div />
        </div>
        <p className="photo-import-hint">This can take up to 2 minutes</p>
      </div>
    );
  }
  return null;
}
