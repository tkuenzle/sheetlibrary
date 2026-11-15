import { sortedBy } from "../collections/collections";

// The order of the sheets in the list, on Sheets and in a collection. It is
// kept in a cookie on this device, so the server renders the list in that
// order and it applies on every list. See openspec/specs/sheet-list.

export type SheetOrder = "title" | "artist" | "edited" | "added";

// The orders as the control offers them, the default first.
export const SHEET_ORDERS: { order: SheetOrder; label: string }[] = [
  { order: "title", label: "Title, A to Z" },
  { order: "artist", label: "Artist, A to Z" },
  { order: "edited", label: "Last edited" },
  { order: "added", label: "Last added" },
];

export const DEFAULT_ORDER: SheetOrder = "title";

// A sheet as the list sorts it. Times are milliseconds since 1970. `addedAt`
// is when the sheet came into the list: when it was made for Sheets, when
// it was added for a collection.
export interface ListedSheet {
  title: string;
  artist?: string;
  updatedAt: number;
  addedAt: number;
}

const NAME = "sheet-order";

// Browsers keep a cookie for 400 days at most.
const maxAge = 400 * 24 * 60 * 60;

function isOrder(value: string | undefined): value is SheetOrder {
  return SHEET_ORDERS.some((entry) => entry.order === value);
}

// The order this device keeps, from a request's Cookie header. A missing or
// wrong value gives the default.
export function readSheetOrder(cookieHeader: string | null): SheetOrder {
  for (const cookie of (cookieHeader ?? "").split(";")) {
    const [name, value] = cookie.trim().split("=");
    if (name === NAME && isOrder(value)) return value;
  }
  return DEFAULT_ORDER;
}

// Keeps the order on this device. `Secure` only over https, since some
// browsers refuse it on http://localhost.
export function keepSheetOrder(
  order: SheetOrder,
  target: { cookie: string; location: { protocol: string } } = document,
): void {
  const secure = target.location.protocol === "https:" ? "; Secure" : "";
  target.cookie = `${NAME}=${order}; Path=/; Max-Age=${String(maxAge)}; SameSite=Lax${secure}`;
}

export function orderLabel(order: SheetOrder): string {
  return SHEET_ORDERS.find((entry) => entry.order === order)?.label ?? "";
}

// The sheets in an order. Title and artist sort A to Z as people read it;
// by artist, sheets without one come last. The dates put the newest first.
// Sheets that tie keep A to Z by title, so the order never depends on how
// they were stored.
export function sortSheets<T extends ListedSheet>(
  sheets: T[],
  order: SheetOrder,
): T[] {
  const byTitle = sortedBy(sheets, (sheet) => sheet.title);
  switch (order) {
    case "title":
      return byTitle;
    case "artist": {
      const withArtist = byTitle.filter((sheet) => sheet.artist);
      const without = byTitle.filter((sheet) => !sheet.artist);
      return [
        ...sortedBy(withArtist, (sheet) => sheet.artist ?? ""),
        ...without,
      ];
    }
    case "edited":
      return byTitle.sort((a, b) => b.updatedAt - a.updatedAt);
    case "added":
      return byTitle.sort((a, b) => b.addedAt - a.addedAt);
  }
}
