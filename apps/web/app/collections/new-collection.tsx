import { useState } from "react";

import { Button } from "../ui/button";
import { NameDialog } from "../ui/name-dialog";
import { COLLECTION_NAME_MAX } from "./collections";
import { createCollection } from "./collections-client";

// The text of the dialogs that name a collection.
export const collectionNameText = "Name it for what it holds.";
export const collectionFailure = "The collection couldn’t be saved. Try again.";

// "New collection": asks for a name, makes the collection and hands it to
// `onCreated`. A name the person already uses keeps the dialog open, with a
// note that says so. The button is filled in the empty state, and tonal
// beside the heading.
export function NewCollection({
  variant = "filled",
  onCreated,
}: {
  variant?: "filled" | "tonal";
  onCreated: (collection: { id: string; name: string }) => void;
}) {
  const [open, setOpen] = useState(false);
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
          onCreated(await createCollection(name));
          setOpen(false);
        }}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
