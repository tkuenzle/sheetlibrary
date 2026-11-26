import { useState } from "react";

import { useFetcherSave } from "../fetcher-save";
import { Button } from "../ui/button";
import { NameDialog } from "../ui/name-dialog";
import { COLLECTION_NAME_MAX } from "./collections";
import { COLLECTIONS_ROUTES, sheetCollectionsPath } from "./sheet-collections";

// The text of the dialogs that name a collection.
export const collectionNameText = "Name it for what it holds.";
export const collectionFailure = "The collection couldn’t be saved. Try again.";

const LIBRARY_ROUTES = ["routes/api.collections"];

// "New collection" through a fetcher: on Collections, and with `sheetId` in
// "Choose collections…", where the collection starts with that sheet. On
// Collections, the route opens the new collection. The save throws
// NameRefused for a name already used, so the naming dialog shows that
// note, and an Error when the change didn't get through
// (app/fetcher-save.ts). It submits JSON, as the API asks.
export function useNewCollection(
  sheetId?: string,
): (name: string) => Promise<void> {
  const save = useFetcherSave(
    `new-collection:${sheetId ?? "library"}`,
    sheetId === undefined ? LIBRARY_ROUTES : COLLECTIONS_ROUTES,
  );
  return (name) =>
    save(
      { name },
      {
        method: "post",
        action:
          sheetId === undefined
            ? "/api/collections"
            : sheetCollectionsPath(sheetId),
        encType: "application/json",
      },
    );
}

// "New collection" on Collections: asks for a name, makes the collection
// and opens it. A name the person already uses keeps the dialog open, with
// a note that says so. The button is filled in the empty state, and tonal
// beside the heading.
export function NewCollection({
  variant = "filled",
}: {
  variant?: "filled" | "tonal";
}) {
  const [open, setOpen] = useState(false);
  const saveNew = useNewCollection();
  const openDialog = () => {
    setOpen(true);
  };
  return (
    <>
      <Button icon="add" variant={variant} onClick={openDialog}>
        New collection
      </Button>
      <NameDialog
        open={open}
        title="New collection"
        text={collectionNameText}
        initial=""
        maxLength={COLLECTION_NAME_MAX}
        failure={collectionFailure}
        onSave={async (name) => {
          await saveNew(name);
          setOpen(false);
        }}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
