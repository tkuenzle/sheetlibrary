// A person's collections: a name and sheets, without an order. The rules
// here hold in the browser and on the server. See
// openspec/specs/collections.

// A collection as the Collections tab lists it.
export interface CollectionListItem {
  id: string;
  name: string;
  // How many sheets it holds.
  count: number;
}

// A collection as the sheet's "Add to collection…" lists it.
export interface SheetCollection {
  id: string;
  name: string;
  // Whether the collection holds the sheet.
  holds: boolean;
}

// The longest name a collection can have, in UTF-16 code units.
export const COLLECTION_NAME_MAX = 40;

// The name to keep from the field's text, or null if it can't be one.
export function keptCollectionName(text: string): string | null {
  const name = text.trim();
  return name.length > 0 && name.length <= COLLECTION_NAME_MAX ? name : null;
}

// What two names share when they differ only in case, so "Christmas" and
// "christmas" are the same name.
export function collectionNameKey(name: string): string {
  return name.normalize("NFC").toLowerCase();
}

// A to Z as people read it: accents and case don't count, and numbers count
// as numbers, so "Drüü Könige" sorts with D and "Lied 2" before "Lied 10".
const collator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
});

export function sortedBy<T>(items: T[], text: (item: T) => string): T[] {
  return [...items].sort((a, b) => collator.compare(text(a), text(b)));
}

// How many sheets, as the pages say it.
export function sheetCount(count: number): string {
  return count === 1 ? "1 sheet" : `${String(count)} sheets`;
}
