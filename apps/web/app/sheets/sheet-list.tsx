import "../ui/group-list.css";
import "./sheet-list.css";

import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useFetcher, useRevalidator } from "react-router";

import { ChooseCollectionsDialog } from "../collections/choose-collections-dialog";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Menu, type MenuItem } from "../ui/menu";
import { Note } from "../ui/note";
import { editDate, lastEdit } from "./last-edit";
import {
  keepSheetOrder,
  type ListedSheet,
  orderLabel,
  SHEET_ORDERS,
  type SheetOrder,
  sortSheets,
} from "./order";
import type { TextPart } from "./search";

// The list of sheets on Sheets and in a collection: a row per sheet with its
// title, artist and last edit, opening it to play, and a menu on each row.
// The order control sorts the rows and keeps the choice on this device. See
// openspec/specs/sheet-list.

// A sheet in the list. A search result has its matches marked.
export interface ListSheet extends ListedSheet {
  id: string;
  titleParts?: TextPart[];
  artistParts?: TextPart[];
  // The line with a match, when only the lyrics match.
  line?: TextPart[];
}

// What a row's change answers: the page's action (`intent` "delete" or
// "remove") or, when the server can't be reached, its `clientAction`.
export interface RowAnswer {
  ok: boolean;
  intent?: string;
}

// A row's change and the confirm dialog share the row's fetcher by its key,
// so the row knows when it goes, and when it comes back.
function rowKey(id: string) {
  return `sheet-row-${id}`;
}

// The open dialog, for which sheet.
type Dialog =
  | { kind: "delete"; sheet: ListSheet }
  | { kind: "collections"; sheet: ListSheet };

export function SheetList({
  sheets,
  order: keptOrder,
  sorted = true,
  collection,
  busy = false,
  onGone,
}: {
  sheets: ListSheet[];
  // The order this device keeps, from the loader.
  order: SheetOrder;
  // False while searching: the sheets keep their best match first, and the
  // order control is hidden.
  sorted?: boolean;
  // The collection the list shows, which adds "Remove from …" to the menu.
  collection?: { id: string; name: string };
  // While a search loads, the rows shown are out of date.
  busy?: boolean;
  // A row was taken away: the page moves the focus to its heading.
  onGone: () => void;
}) {
  const [order, setOrder] = useState(keptOrder);
  const [dialog, setDialog] = useState<Dialog>();
  const [note, setNote] = useState<string>();
  const changed = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  const { revalidate } = useRevalidator();
  // The fetcher of the row being deleted, shared with that row.
  const deleter = useFetcher<RowAnswer>({
    key: rowKey(dialog?.sheet.id ?? ""),
  });

  // The viewer's time zone is only known in the browser. Until then, the
  // last edit is hidden, with the date in UTC holding its place.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  const now = Date.now();
  const edited = (at: number) =>
    hydrated ? lastEdit(at, now) : editDate(at, now, "UTC");

  const shown = sorted ? sortSheets(sheets, order) : sheets;

  // Back on the row's menu button, or on the heading once the row is gone.
  function focusRow(id: string) {
    const button = list.current?.querySelector<HTMLElement>(
      `[data-sheet="${id}"] [aria-haspopup]`,
    );
    if (button) button.focus();
    else onGone();
  }

  function failed(sheet: ListSheet, intent: string | undefined) {
    setNote(failureNote(sheet.title, intent, collection));
  }

  function menuItems(sheet: ListSheet, remove: () => void): MenuItem[] {
    return rowMenuItems({
      collection,
      onChoose: () => {
        changed.current = false;
        setDialog({ kind: "collections", sheet });
      },
      onRemove: remove,
      onDelete: () => {
        setDialog({ kind: "delete", sheet });
      },
    });
  }

  return (
    <div
      className="library-list sheet-list"
      ref={list}
      aria-busy={busy || undefined}
    >
      <div className="sheet-list-status" role="status">
        {note && <Note>{note}</Note>}
      </div>
      {sorted && (
        <div className="sheet-list-order">
          <Menu
            label={orderLabel(order)}
            icon="swapVert"
            text
            variant="text"
            items={SHEET_ORDERS.map((entry) => ({
              label: entry.label,
              icon: "swapVert",
              checked: entry.order === order,
              onSelect: () => {
                setOrder(entry.order);
                keepSheetOrder(entry.order);
              },
            }))}
          />
        </div>
      )}
      <div className="library-columns library-labels" aria-hidden="true">
        <span>Title</span>
        <span>Artist</span>
        <span>Edited</span>
      </div>
      <ul className="group-list">
        {shown.map((sheet) => (
          <Row
            key={sheet.id}
            sheet={sheet}
            edited={edited(sheet.updatedAt)}
            editedPending={!hydrated}
            menuItems={(remove) => menuItems(sheet, remove)}
            onRemove={() => {
              setNote(undefined);
              onGone();
            }}
            onFailed={(intent) => {
              failed(sheet, intent);
            }}
          />
        ))}
      </ul>
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        title={`Delete “${dialog?.sheet.title ?? ""}”?`}
        text="The sheet is gone for good. This can’t be undone."
        confirm="Delete"
        failure="The sheet couldn’t be deleted. Try again."
        onConfirm={() => {
          if (dialog) {
            setNote(undefined);
            void deleter.submit(
              { intent: "delete", sheetId: dialog.sheet.id },
              { method: "post" },
            );
          }
          // Closing the dialog moves the focus to the heading below.
          setDialog(undefined);
          return Promise.resolve();
        }}
        onClose={() => {
          const sheet = dialog?.sheet;
          setDialog(undefined);
          if (sheet) focusRow(sheet.id);
          else onGone();
        }}
      />
      <ChooseCollectionsDialog
        open={dialog?.kind === "collections"}
        sheet={dialog?.sheet ?? { id: "", title: "" }}
        onChange={() => {
          changed.current = true;
        }}
        onClose={() => {
          const sheet = dialog?.sheet;
          setDialog(undefined);
          // The rail's counts, and in a collection the list, follow.
          if (changed.current) void revalidate();
          if (sheet) focusRow(sheet.id);
        }}
      />
    </div>
  );
}

// The note when a row's change didn't get through, and the row came back.
export function failureNote(
  title: string,
  intent: string | undefined,
  collection?: { name: string },
): string {
  return intent === "remove" && collection
    ? `“${title}” couldn’t be removed from ${collection.name}. Try again.`
    : `“${title}” couldn’t be deleted. Try again.`;
}

// A row's menu: what can be done with a sheet without opening it. Edit,
// Rename and Print stay on the sheet itself.
export function rowMenuItems({
  collection,
  onChoose,
  onRemove,
  onDelete,
}: {
  collection?: { name: string };
  onChoose: () => void;
  onRemove: () => void;
  onDelete: () => void;
}): MenuItem[] {
  return [
    {
      label: "Choose collections…",
      icon: "collectionsBookmark",
      separated: true,
      onSelect: onChoose,
    },
    ...(collection
      ? [
          {
            label: `Remove from ${collection.name}`,
            icon: "doNotDisturbOn" as const,
            onSelect: onRemove,
          },
        ]
      : []),
    { label: "Delete", icon: "delete", onSelect: onDelete },
  ];
}

// A sheet's row: its title, artist and last edit, opening it to play, and
// its menu. It goes as soon as it is deleted or removed, and comes back if
// that doesn't get through.
function Row({
  sheet,
  edited,
  editedPending,
  menuItems,
  onRemove,
  onFailed,
}: {
  sheet: ListSheet;
  edited: string;
  editedPending: boolean;
  menuItems: (remove: () => void) => MenuItem[];
  onRemove: () => void;
  onFailed: (intent: string | undefined) => void;
}) {
  const fetcher = useFetcher<RowAnswer>({ key: rowKey(sheet.id) });
  const answer = fetcher.state === "idle" ? fetcher.data : undefined;
  const failedNow = answer?.ok === false;
  const reportFailed = useRef(onFailed);
  useEffect(() => {
    reportFailed.current = onFailed;
  });
  useEffect(() => {
    if (failedNow) reportFailed.current(answer.intent);
  }, [failedNow, answer]);

  if (fetcher.state !== "idle" || answer?.ok === true) return null;

  return (
    <li className="sheet-list-row" data-sheet={sheet.id}>
      <Link className="library-columns" to={`/sheets/${sheet.id}`}>
        <span className="library-title">
          {sheet.titleParts ? <Marked parts={sheet.titleParts} /> : sheet.title}
        </span>
        <span className="library-details">
          <span>
            {sheet.artistParts ? (
              <Marked parts={sheet.artistParts} />
            ) : (
              sheet.artist
            )}
          </span>
          {sheet.artist && (
            <span className="library-separator" aria-hidden="true">
              {" · "}
            </span>
          )}
          <span
            className="library-edited"
            data-pending={editedPending ? "" : undefined}
          >
            {edited}
          </span>
        </span>
        {sheet.line && (
          <span className="library-line">
            <Marked parts={sheet.line} />
          </span>
        )}
      </Link>
      <Menu
        label={`More for ${sheet.title}`}
        items={menuItems(() => {
          void fetcher.submit(
            { intent: "remove", sheetId: sheet.id },
            { method: "post" },
          );
          onRemove();
        })}
      />
    </li>
  );
}

// Text with its matches marked.
function Marked({ parts }: { parts: TextPart[] }) {
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part.hit ? <mark>{part.text}</mark> : part.text}
    </Fragment>
  ));
}
