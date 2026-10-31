// The sheet around its content: an id, a revision and details such as the
// title, the same for every format. Library features use only these fields,
// never the content. See openspec/specs/sheet-envelope.
//
// This module lives in chordsheet while chord sheets are the only format.
// When a second format arrives, it moves to its own package.

import { checkSheet, isRecord, type Problem } from "./check";
import { type ChordSheet, FORMAT } from "./sheet";

// The package has no DOM or Node types. Browsers and Workers both have
// `crypto`, so only what's used is declared.
declare const crypto: {
  getRandomValues<T extends Uint8Array>(array: T): T;
};

// The content of a sheet, told apart by its `format`. Each format brings its
// own model.
export type SheetContent = ChordSheet;

export interface Sheet {
  // ID_LENGTH characters from ID_ALPHABET, safe in a URL as it is.
  id: string;
  // A whole number. Storage raises it on every save and refuses a write
  // based on an older one.
  revision: number;
  title: string;
  // The performer. Left out when the sheet has none.
  artist?: string;
  content: SheetContent;
}

export const ID_LENGTH = 12;

// 64 characters, so each random byte picks one by its low 6 bits and every
// character is equally likely. 12 of them make 72 random bits.
export const ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// ID_LENGTH characters from ID_ALPHABET.
const ID_PATTERN = /^[A-Za-z0-9_-]{12}$/;

// Makes a new random id. It works in the browser and in the Worker alike.
export function newSheetId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH));
  return Array.from(bytes, (byte) => ID_ALPHABET.charAt(byte & 63)).join("");
}

// Checks a sheet, for example loaded JSON, against the envelope's rules and
// its content's format, and returns every problem found. An empty list means
// the value is a valid Sheet.
export function checkEnvelope(value: unknown): Problem[] {
  if (!isRecord(value)) return [{ message: "Sheet is not an object" }];
  const { id, revision, title, artist, content } = value;
  const problems: Problem[] = [];
  if (!isSheetId(id)) {
    problems.push({ message: "Id is not a sheet id", field: "id" });
  }
  if (
    typeof revision !== "number" ||
    !Number.isInteger(revision) ||
    revision < 0
  ) {
    problems.push({
      message: "Revision is not a whole number",
      field: "revision",
    });
  }
  if (title === undefined) {
    problems.push({ message: "Sheet has no title", field: "title" });
  } else if (typeof title !== "string") {
    problems.push({ message: "Title is not text", field: "title" });
  }
  if (artist !== undefined && typeof artist !== "string") {
    problems.push({ message: "Artist is not text", field: "artist" });
  }
  for (const problem of checkContent(content)) {
    problems.push({ ...problem, field: "content" });
  }
  return problems;
}

function isSheetId(id: unknown): boolean {
  return typeof id === "string" && ID_PATTERN.test(id);
}

// Picks the content's check by its format. Chord sheets are the only format
// so far.
function checkContent(content: unknown): Problem[] {
  if (!isRecord(content)) return [{ message: "Content is not an object" }];
  if (content.format === FORMAT) return checkSheet(content);
  return [{ message: `Unknown format: ${JSON.stringify(content.format)}` }];
}
