import "../sheets/search-field.css";
import "../ui/confirm-dialog.css";
import "./add-sheets-dialog.css";

import { useEffect, useId, useRef, useState } from "react";
import { useFetcher } from "react-router";

import type { loader as libraryLoader } from "../routes/sheets";
import { isSearch } from "../sheets/search";
import { SEARCH_PAUSE } from "../sheets/search-field";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Note } from "../ui/note";

// "Add sheets" on a collection's page: the person's sheets with a tick box
// each, found with the library's own loader, so the list and the search are
// the library's. Sheets already in the collection show ticked and can't be
// unticked. "Add 2 sheets" posts the ticked ones to the page's action. See
// openspec/specs/collection-page.
export function AddSheetsDialog({
  open,
  collection,
  holds,
  onClose,
}: {
  open: boolean;
  collection: { id: string; name: string };
  // The ids of the sheets in the collection.
  holds: ReadonlySet<string>;
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
      className="confirm-dialog add-sheets-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      {open && (
        <AddSheetsContent
          titleId={titleId}
          collection={collection}
          holds={holds}
          onDone={() => dialog.current?.close()}
        />
      )}
    </dialog>
  );
}

export function addLabel(count: number): string {
  if (count === 0) return "Add sheets";
  return count === 1 ? "Add 1 sheet" : `Add ${String(count)} sheets`;
}

function AddSheetsContent({
  titleId,
  collection,
  holds,
  onDone,
}: {
  titleId: string;
  collection: { id: string; name: string };
  holds: ReadonlySet<string>;
  onDone: () => void;
}) {
  const sheets = useFetcher<typeof libraryLoader>();
  const adding = useFetcher<{ ok: boolean }>();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const field = useRef<HTMLInputElement>(null);

  // The list follows the field after a short pause in typing, as in the
  // library. Fewer than two characters list all sheets.
  const search = isSearch(q) ? q : "";
  const { load } = sheets;
  useEffect(() => {
    const timer = setTimeout(
      () => {
        void load(
          search === "" ? "/sheets" : `/sheets?q=${encodeURIComponent(search)}`,
        );
      },
      search === "" ? 0 : SEARCH_PAUSE,
    );
    return () => {
      clearTimeout(timer);
    };
  }, [load, search]);

  useEffect(() => {
    field.current?.focus();
  }, []);

  // Closes once the sheets are added.
  useEffect(() => {
    if (adding.state === "idle" && adding.data?.ok) onDone();
  }, [adding.state, adding.data, onDone]);

  const list = sheets.data && "sheets" in sheets.data ? sheets.data.sheets : [];
  const busy = adding.state !== "idle";
  const failed = adding.state === "idle" && adding.data?.ok === false;

  function add() {
    const form = new FormData();
    form.set("intent", "add");
    for (const id of picked) form.append("sheetId", id);
    void adding.submit(form, {
      method: "post",
      action: `/collections/${collection.id}`,
    });
  }

  return (
    <form
      className="add-sheets"
      onSubmit={(event) => {
        event.preventDefault();
        if (picked.size > 0 && !busy) add();
      }}
    >
      <div className="add-sheets-top">
        <h2 id={titleId}>{`Add sheets to “${collection.name}”`}</h2>
        <div className="search-field add-sheets-search" role="search">
          <Icon name="search" />
          <input
            ref={field}
            type="search"
            aria-label="Search sheets"
            value={q}
            placeholder="Search titles, artists and lyrics"
            autoComplete="off"
            onChange={(event) => {
              setQ(event.target.value);
            }}
            onKeyDown={(event) => {
              // Enter in the field doesn't add.
              if (event.key === "Enter") event.preventDefault();
            }}
          />
        </div>
      </div>
      <ul
        className="add-sheets-list"
        aria-label="Sheets"
        aria-busy={sheets.state !== "idle" || undefined}
      >
        {list.map((sheet) => {
          const held = holds.has(sheet.id);
          return (
            <li key={sheet.id}>
              <label>
                <input
                  type="checkbox"
                  checked={held || picked.has(sheet.id)}
                  disabled={held || busy}
                  onChange={(event) => {
                    const next = new Set(picked);
                    if (event.target.checked) next.add(sheet.id);
                    else next.delete(sheet.id);
                    setPicked(next);
                  }}
                />
                <span className="add-sheets-text">
                  <span className="add-sheets-title">{sheet.title}</span>
                  {(sheet.artist ?? held) && (
                    <span className="add-sheets-details">
                      {[sheet.artist, held && "In this collection"]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {sheets.state === "idle" && sheets.data && list.length === 0 && (
        <p className="add-sheets-none">
          {search === "" ? "No sheets yet" : `No sheets match “${q.trim()}”`}
        </p>
      )}
      {failed && <Note>The sheets couldn’t be added. Try again.</Note>}
      <div className="confirm-actions add-sheets-actions">
        <Button type="button" variant="text" disabled={busy} onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={picked.size === 0 || busy}>
          {addLabel(picked.size)}
        </Button>
      </div>
    </form>
  );
}
