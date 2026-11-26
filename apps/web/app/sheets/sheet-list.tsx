import "../ui/group-list.css";
import "./sheet-list.css";

import { Fragment, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useFetcher, useFetchers } from "react-router";

import { ChooseCollectionsDialog } from "../collections/choose-collections-dialog";
import {
  isSheetCollectionsPath,
  sheetCollectionPath,
  useSheetCollections,
} from "../collections/sheet-collections";
import { spokenKey } from "../editor/key-button";
import { useRouteCode } from "../route-code";
import { openedFrom, titleName } from "../shell/page-moves";
import { TitleMove } from "../shell/title-move";
import { useArrives } from "../ui/arriving";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Icon } from "../ui/icon";
import { Menu, type MenuItem } from "../ui/menu";
import { Note } from "../ui/note";
import { Bar } from "../ui/skeleton";
import {
  keepSheetOrder,
  type ListedSheet,
  orderLabel,
  SHEET_ORDERS,
  type SheetOrder,
  sortSheets,
} from "./order";
import type { TextPart } from "./search";
import { readVersionKey } from "./versions";

// The list of sheets on Sheets and in a collection: a row per sheet with its
// title, artist and key, opening it to play, and a menu on each row.
// The order control sorts the rows and keeps the choice on this device. See
// openspec/specs/sheet-list.

// A sheet in the list. A search result has its matches marked.
export interface ListSheet extends ListedSheet {
  id: string;
  // The key, such as "F#m": the set key, or else the guess. None without
  // chords.
  key?: string;
  titleParts?: TextPart[];
  artistParts?: TextPart[];
  // The line with a match, when only the lyrics match.
  line?: TextPart[];
}

// What a row's change answers: the `clientAction` of the API route it went
// to, `{ ok: false }` when it didn't get through (app/changes.ts).
export interface RowAnswer {
  ok: boolean;
}

// The routes a row's changes go to: "Delete" to the sheet's, and "Remove
// from …" to the sheet's place in the collection, the same change as
// unticking it in "Choose collections…". Their code loads with the list
// (app/route-code.ts).
const ROW_ROUTES = ["routes/api.sheet", "routes/api.sheet-collection"];

// What a row sent, for its note when it doesn't get through.
type RowChange = "delete" | "remove";

// A row's change and the confirm dialog share the row's fetcher by its key,
// so the row knows when it goes, and when it comes back. A "Recent" card
// shares it too (recent-sheets.tsx).
export function rowKey(id: string) {
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
  heading,
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
  // A heading for the list, such as "All sheets", shown with how many rows
  // it has on the order control's line. Hidden with the control.
  heading?: string;
  // A row was taken away: the page moves the focus to its heading.
  onGone: () => void;
}) {
  const [order, setOrder] = useState(keptOrder);
  const [dialog, setDialog] = useState<Dialog>();
  const [note, setNote] = useState<string>();
  const list = useRef<HTMLDivElement>(null);
  // The fetcher of the row being deleted, shared with that row.
  const deleter = useFetcher<RowAnswer>({
    key: rowKey(dialog?.sheet.id ?? ""),
  });
  const ready = useRouteCode(ROW_ROUTES);

  const shown = sorted ? sortSheets(sheets, order) : sheets;
  // A row whose change is under way is gone already, so it isn't counted.
  const changing = new Set(useFetchers().map((fetcher) => fetcher.key));
  const count = sheets.filter(
    (sheet) => !changing.has(rowKey(sheet.id)),
  ).length;

  // Back on the row's menu button, or on the heading once the row is gone.
  function focusRow(id: string) {
    const button = list.current?.querySelector<HTMLElement>(
      `[data-sheet="${id}"] [aria-haspopup]`,
    );
    if (button) button.focus();
    else onGone();
  }

  function failed(sheet: ListSheet, change: RowChange) {
    setNote(failureNote(sheet.title, change, collection));
  }

  function menuItems(sheet: ListSheet, remove: () => void): MenuItem[] {
    return rowMenuItems({
      collection,
      onChoose: () => {
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
          {heading && (
            <h2 className="sheet-list-heading">
              {`${heading} `}
              <Count count={count} />
            </h2>
          )}
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
        <span>Key</span>
      </div>
      <ul className="group-list">
        {shown.map((sheet) => (
          <Row
            key={sheet.id}
            sheet={sheet}
            menuItems={(remove) => menuItems(sheet, remove)}
            removeAction={
              collection && sheetCollectionPath(sheet.id, collection.id)
            }
            ready={ready}
            onRemove={() => {
              setNote(undefined);
              onGone();
            }}
            onFailed={(change) => {
              failed(sheet, change);
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
          // Once the route's code is there, the row goes. The dialog closes
          // at once and the focus moves to the heading here, not on its
          // close event: the last sheet's delete can swap the list for the
          // empty state before that event comes.
          const sheet = dialog?.sheet;
          if (!sheet) return Promise.resolve();
          setNote(undefined);
          const leave = () => {
            flushSync(() => {
              setDialog(undefined);
            });
            onGone();
          };
          return ready().then(
            () => {
              void deleter.submit(null, {
                method: "delete",
                action: `/api/sheets/${sheet.id}`,
              });
              leave();
            },
            () => {
              failed(sheet, "delete");
              leave();
            },
          );
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
        onClose={() => {
          const sheet = dialog?.sheet;
          setDialog(undefined);
          if (sheet) focusRow(sheet.id);
        }}
      />
    </div>
  );
}

// How many rows the list has, in its heading. It stood for a bar.
function Count({ count }: { count: number }) {
  return <span {...useArrives("sheet-list-count")}>{count}</span>;
}

// The note when a row's change didn't get through, and the row came back.
export function failureNote(
  title: string,
  change: RowChange,
  collection?: { name: string },
): string {
  return change === "remove" && collection
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

// A sheet's row: its title, artist and key, opening it to play, and
// its menu. It goes as soon as it is deleted or removed, and comes back if
// that doesn't get through.
function Row({
  sheet,
  menuItems,
  removeAction,
  ready,
  onRemove,
  onFailed,
}: {
  sheet: ListSheet;
  menuItems: (remove: () => void) => MenuItem[];
  // Where "Remove from …" goes, in a collection.
  removeAction?: string;
  // Settles once the code of the routes the row's changes go to is there.
  ready: () => Promise<unknown>;
  onRemove: () => void;
  onFailed: (change: RowChange) => void;
}) {
  const fetcher = useFetcher<RowAnswer>({ key: rowKey(sheet.id) });
  // Which change the row sent, read from where its fetcher went while it
  // was on its way. The list's delete dialog shares the row's fetcher.
  const sent = useRef<RowChange>("delete");
  const busy = fetcher.state !== "idle";
  useEffect(() => {
    if (busy) {
      sent.current = isSheetCollectionsPath(fetcher.formAction)
        ? "remove"
        : "delete";
    }
  }, [busy, fetcher.formAction]);
  // "Choose collections…" reads them: they start loading when the menu
  // opens, so the dialog often opens with them.
  const collections = useSheetCollections(sheet.id);
  const answer = fetcher.state === "idle" ? fetcher.data : undefined;
  const failedNow = answer?.ok === false;
  const reportFailed = useRef(onFailed);
  useEffect(() => {
    reportFailed.current = onFailed;
  });
  useEffect(() => {
    if (failedNow) reportFailed.current(sent.current);
  }, [failedNow, answer]);

  const arrives = useArrives("sheet-list-row");

  if (busy || answer?.ok === true) return null;

  return (
    <li {...arrives} data-sheet={sheet.id}>
      <Link
        className="library-columns"
        to={`/sheets/${sheet.id}`}
        state={openedFrom("list", sheet)}
      >
        <TitleMove name={titleName("list", sheet.id)}>
          <span className="library-title">
            {sheet.titleParts ? (
              <Marked parts={sheet.titleParts} />
            ) : (
              sheet.title
            )}
          </span>
        </TitleMove>
        <span className="library-details">
          <span>
            {sheet.artistParts ? (
              <Marked parts={sheet.artistParts} />
            ) : (
              sheet.artist
            )}
          </span>
          {sheet.artist && sheet.key && (
            <span className="library-separator" aria-hidden="true">
              {" · "}
            </span>
          )}
          <span className="library-key">
            {sheet.key && <KeyText text={sheet.key} />}
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
        onOpen={collections.load}
        items={menuItems(() => {
          if (removeAction === undefined) return;
          // The row goes, then the focus moves on, once the route's code is
          // there.
          ready().then(
            () => {
              void fetcher.submit(null, {
                method: "delete",
                action: removeAction,
              });
              onRemove();
            },
            () => {
              reportFailed.current("remove");
            },
          );
        })}
      />
    </li>
  );
}

// A sheet's key as written, "F#m", read out as "F sharp minor".
export function KeyText({ text }: { text: string }) {
  const key = readVersionKey(text);
  if (!key) return text;
  return (
    <>
      <span aria-hidden="true">{text}</span>
      <span className="visually-hidden">{spokenKey(key)}</span>
    </>
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

// Widths in `em` for the bars of a list that is loading, so the rows don't
// all look alike.
const TITLE_WIDTHS = [9, 7, 11, 6, 13, 8, 10, 7];
const ARTIST_WIDTHS = [8, 10, 5, 12, 4, 9, 6, 11];

// The list while its sheets are on their way: the same frame and rows, with
// bars in place of the titles, artists and keys. The order control shows
// the order this device keeps, and waits for the rows. See
// openspec/specs/site-layout.
export function SheetListSkeleton({
  rows,
  order,
  heading,
}: {
  rows: number;
  order: SheetOrder;
  // As on SheetList, with a bar in place of the count.
  heading?: string;
}) {
  return (
    <div className="library-list sheet-list" aria-busy="true">
      <div className="sheet-list-order">
        {heading && (
          <h2 className="sheet-list-heading">
            {`${heading} `}
            <span className="sheet-list-count">
              <Bar width={1.4} />
            </span>
          </h2>
        )}
        <div className="menu">
          <Button
            variant="text"
            icon="swapVert"
            className="menu-toggle-text"
            disabled
          >
            {orderLabel(order)}
            <Icon name="expandMore" />
          </Button>
        </div>
      </div>
      <div className="library-columns library-labels" aria-hidden="true">
        <span>Title</span>
        <span>Artist</span>
        <span>Key</span>
      </div>
      <ul className="group-list" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="sheet-list-row">
            <div className="library-columns sheet-list-skeleton">
              <span className="library-title">
                <Bar width={TITLE_WIDTHS[i % TITLE_WIDTHS.length] ?? 8} />
              </span>
              <span className="library-details">
                <span>
                  <Bar width={ARTIST_WIDTHS[i % ARTIST_WIDTHS.length] ?? 8} />
                </span>{" "}
                <span className="library-key">
                  <Bar width={1.6} accent />
                </span>
              </span>
            </div>
            <span className="menu sheet-list-skeleton-menu" />
          </li>
        ))}
      </ul>
    </div>
  );
}
