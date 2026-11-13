import "../ui/confirm-dialog.css";
import "./choose-collections-dialog.css";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "../ui/button";
import { NameDialog } from "../ui/name-dialog";
import { Note } from "../ui/note";
import {
  COLLECTION_NAME_MAX,
  type SheetCollection,
  sortedBy,
} from "./collections";
import {
  createCollection,
  listSheetCollections,
  setInCollection,
} from "./collections-client";
import { collectionFailure, collectionNameText } from "./new-collection";

// "Choose collections…" on the play view: the person's collections A to Z,
// each ticked when it holds the sheet. A tick adds the sheet at once and an
// untick takes it out; a change that fails goes back, with a note. "New
// collection" makes one with the sheet in it. The list loads each time the
// dialog opens. See openspec/specs/play-page.
export function ChooseCollectionsDialog({
  open,
  sheet,
  onClose,
}: {
  open: boolean;
  sheet: { id: string; title: string };
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
          onDone={() => dialog.current?.close()}
        />
      )}
    </dialog>
  );
}

export type Loaded =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "loaded"; collections: SheetCollection[] };

function ChooseCollectionsContent({
  titleId,
  sheet,
  onDone,
}: {
  titleId: string;
  sheet: { id: string; title: string };
  onDone: () => void;
}) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [failed, setFailed] = useState(false);
  const [naming, setNaming] = useState(false);

  useEffect(() => {
    let current = true;
    listSheetCollections(sheet.id).then(
      (collections) => {
        if (current) setLoaded({ kind: "loaded", collections });
      },
      () => {
        if (current) setLoaded({ kind: "failed" });
      },
    );
    return () => {
      current = false;
    };
  }, [sheet.id]);

  function setHolds(id: string, holds: boolean) {
    setLoaded((state) =>
      state.kind === "loaded"
        ? {
            kind: "loaded",
            collections: state.collections.map((collection) =>
              collection.id === id ? { ...collection, holds } : collection,
            ),
          }
        : state,
    );
  }

  function toggle(collection: SheetCollection, holds: boolean) {
    setFailed(false);
    setHolds(collection.id, holds);
    setInCollection(sheet.id, collection.id, holds).catch(() => {
      setHolds(collection.id, !holds);
      setFailed(true);
    });
  }

  return (
    <div className="choose-collections">
      <div className="choose-collections-top">
        <h2 id={titleId}>Choose collections</h2>
        <p>{sheet.title}</p>
      </div>
      <CollectionChoices loaded={loaded} onToggle={toggle} />
      {failed && <Note>The change couldn’t be saved. Try again.</Note>}
      <div className="confirm-actions choose-collections-actions">
        <Button
          variant="text"
          icon="add"
          disabled={loaded.kind !== "loaded"}
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
          const made = await createCollection(name, sheet.id);
          setLoaded((state) =>
            state.kind === "loaded"
              ? {
                  kind: "loaded",
                  collections: sortedBy(
                    [...state.collections, { ...made, holds: true }],
                    (collection) => collection.name,
                  ),
                }
              : state,
          );
          setNaming(false);
        }}
        onClose={() => {
          setNaming(false);
        }}
      />
    </div>
  );
}

// The collections with their tick boxes, or what stands in for them while
// they load, when they couldn't load, or when there are none.
export function CollectionChoices({
  loaded,
  onToggle,
}: {
  loaded: Loaded;
  onToggle: (collection: SheetCollection, holds: boolean) => void;
}) {
  if (loaded.kind === "loading") {
    return <p className="choose-collections-none">Loading collections…</p>;
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
          <label key={collection.id}>
            <input
              type="checkbox"
              checked={collection.holds}
              onChange={(event) => {
                onToggle(collection, event.target.checked);
              }}
            />
            <span>{collection.name}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
