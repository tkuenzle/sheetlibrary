import "../ui/confirm-dialog.css";
import "./choose-collections-dialog.css";

import { useEffect, useId, useRef, useState } from "react";
import { useFetcher } from "react-router";

import { Button } from "../ui/button";
import { closeAfterExit, exitOnEscape } from "../ui/exit";
import { NameDialog, NameRefused } from "../ui/name-dialog";
import { Note } from "../ui/note";
import { Bar, useSkeleton } from "../ui/skeleton";
import { COLLECTION_NAME_MAX, type SheetCollection } from "./collections";
import { collectionFailure, collectionNameText } from "./new-collection";
import {
  type ChangeAnswer,
  sheetCollectionPath,
  sheetCollectionsPath,
  type SheetCollectionsState,
  useCollectionsRoutes,
  useSheetCollections,
} from "./sheet-collections";

// "Choose collections…" on the play view, in edit mode and on a row: the
// person's collections A to Z, each ticked when it holds the sheet. A tick
// adds the sheet at once and an untick takes it out; a change that fails
// goes back, with a note. "New collection" makes one with the sheet in it.
// Every change goes through a fetcher, so React Router loads the sheet's
// collections again by itself (collections/sheet-collections.ts). It opens
// with `initial`, what the page already knows, and loads the list again
// behind it. See openspec/specs/play-page and openspec/specs/sheet-list.
export function ChooseCollectionsDialog({
  open,
  sheet,
  initial,
  onClose,
}: {
  open: boolean;
  sheet: { id: string; title: string };
  initial?: SheetCollection[];
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
      className="confirm-dialog choose-collections-dialog"
      aria-labelledby={titleId}
      // The "New collection" dialog inside handles its own Escape first.
      onKeyDown={exitOnEscape}
      // React passes the "New collection" dialog's close up to this one, so
      // only this dialog's own close counts.
      onClose={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open && (
        <ChooseCollectionsContent
          titleId={titleId}
          sheet={sheet}
          initial={initial}
          onDone={() => {
            closeAfterExit(dialog.current);
          }}
        />
      )}
    </dialog>
  );
}

export type Loaded = SheetCollectionsState;

function ChooseCollectionsContent({
  titleId,
  sheet,
  initial,
  onDone,
}: {
  titleId: string;
  sheet: { id: string; title: string };
  initial?: SheetCollection[];
  onDone: () => void;
}) {
  const { state: loaded, load } = useSheetCollections(sheet.id, initial);
  const [failed, setFailed] = useState(false);
  const [naming, setNaming] = useState(false);
  const saveNew = useNewCollection(sheet.id);

  // The list loads each time the dialog opens, behind what the page knows.
  // From a row, its menu has started it already.
  const loadOnOpen = useRef(load);
  useEffect(() => {
    loadOnOpen.current();
  }, []);

  // A quick list shows without bars; slow, the bars stay a moment (see
  // useSkeleton). A failure shows at once.
  const skeleton = useSkeleton(loaded.kind === "loading");
  const shown: Loaded =
    skeleton !== "none" && loaded.kind !== "failed"
      ? { kind: "loading" }
      : loaded;

  return (
    <div className="choose-collections">
      <div className="choose-collections-top">
        <h2 id={titleId}>Choose collections</h2>
        <p>{sheet.title}</p>
      </div>
      <CollectionChoices
        sheetId={sheet.id}
        loaded={shown}
        waiting={skeleton === "waiting"}
        onToggle={() => {
          setFailed(false);
        }}
        onFailed={() => {
          setFailed(true);
        }}
      />
      {failed && <Note>The change couldn’t be saved. Try again.</Note>}
      <div className="confirm-actions choose-collections-actions">
        <Button
          variant="text"
          icon="add"
          disabled={shown.kind !== "loaded"}
          onClick={() => {
            setNaming(true);
          }}
        >
          New collection
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
      <NameDialog
        open={naming}
        title="New collection"
        text={collectionNameText}
        initial=""
        maxLength={COLLECTION_NAME_MAX}
        failure={collectionFailure}
        onSave={async (name) => {
          await saveNew(name);
          setNaming(false);
        }}
        onClose={() => {
          setNaming(false);
        }}
      />
    </div>
  );
}

// "New collection" through a fetcher. The promise settles with the
// fetcher's answer: it throws NameRefused for a name already used, so the
// naming dialog shows that note, and an Error when the change didn't get
// through.
function useNewCollection(sheetId: string): (name: string) => Promise<void> {
  const fetcher = useFetcher<ChangeAnswer>({
    key: `new-collection:${sheetId}`,
  });
  const ready = useCollectionsRoutes();
  const waiting = useRef<{
    resolve: () => void;
    reject: (error: Error) => void;
  }>(undefined);
  const answer = fetcher.state === "idle" ? fetcher.data : undefined;
  useEffect(() => {
    const save = waiting.current;
    if (!answer || !save) return;
    waiting.current = undefined;
    if (answer.ok) save.resolve();
    else if (answer.refused) save.reject(new NameRefused(answer.refused));
    else save.reject(new Error("The collection wasn’t saved"));
  }, [answer]);
  return (name) =>
    ready().then(
      () =>
        new Promise<void>((resolve, reject) => {
          waiting.current = { resolve, reject };
          void fetcher.submit(
            { name },
            { method: "post", action: sheetCollectionsPath(sheetId) },
          );
        }),
    );
}

// Widths in `em` of the bars for the names while the collections load.
const SKELETON_WIDTHS = [6, 8, 10, 7, 5];

// The collections with their tick boxes, or what stands in for them while
// they load (rows of bars, unseen while `waiting`), when they couldn't
// load, or when there are none. Each box ticks through a fetcher of its own,
// so ticks on two collections don't cancel each other.
export function CollectionChoices({
  sheetId,
  loaded,
  waiting = false,
  onToggle,
  onFailed,
}: {
  sheetId: string;
  loaded: Loaded;
  waiting?: boolean;
  onToggle: () => void;
  onFailed: () => void;
}) {
  if (loaded.kind === "loading") {
    return (
      <div
        className={
          waiting
            ? "choose-collections-scroll skeleton-waiting"
            : "choose-collections-scroll"
        }
      >
        <div
          className="choose-collections-list"
          aria-label="Collections"
          aria-busy="true"
        >
          {SKELETON_WIDTHS.map((width, i) => (
            <div className="choose-collections-skeleton" key={i}>
              <Bar box />
              <span>
                <Bar width={width} />
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (loaded.kind === "failed") {
    return (
      <Note>The collections couldn’t be loaded. Close this and try again.</Note>
    );
  }
  if (loaded.collections.length === 0) {
    return <p className="choose-collections-none">No collections yet</p>;
  }
  return (
    <div className="choose-collections-scroll">
      <fieldset className="choose-collections-list" aria-label="Collections">
        {loaded.collections.map((collection) => (
          <Choice
            key={collection.id}
            sheetId={sheetId}
            collection={collection}
            onToggle={onToggle}
            onFailed={onFailed}
          />
        ))}
      </fieldset>
    </div>
  );
}

// One collection's tick box. While its change is on its way, and until the
// list has loaded again, it shows the change. A change that didn't get
// through shows the box as it was, and tells `onFailed`. A change waits for
// its route's code before the fetcher has it, so the box keeps what was
// asked until then.
function Choice({
  sheetId,
  collection,
  onToggle,
  onFailed,
}: {
  sheetId: string;
  collection: SheetCollection;
  onToggle: () => void;
  onFailed: () => void;
}) {
  const fetcher = useFetcher<ChangeAnswer>({
    key: `tick:${sheetId}:${collection.id}`,
  });
  const ready = useCollectionsRoutes();
  const [asked, setAsked] = useState<boolean>();
  const busy = fetcher.state !== "idle";
  useEffect(() => {
    if (busy) setAsked(undefined);
  }, [busy]);
  const pending = busy ? fetcher.formMethod?.toUpperCase() : undefined;
  const holds = pending ? pending === "PUT" : (asked ?? collection.holds);
  const answer = fetcher.state === "idle" ? fetcher.data : undefined;
  const failedNow = answer?.ok === false;
  const reportFailed = useRef(onFailed);
  useEffect(() => {
    reportFailed.current = onFailed;
  });
  useEffect(() => {
    if (failedNow) reportFailed.current();
  }, [failedNow, answer]);

  return (
    <label>
      <input
        type="checkbox"
        checked={holds}
        onChange={(event) => {
          const checked = event.target.checked;
          onToggle();
          setAsked(checked);
          ready().then(
            () =>
              fetcher.submit(null, {
                method: checked ? "put" : "delete",
                action: sheetCollectionPath(sheetId, collection.id),
              }),
            () => {
              setAsked(undefined);
              reportFailed.current();
            },
          );
        }}
      />
      <span>{collection.name}</span>
    </label>
  );
}
