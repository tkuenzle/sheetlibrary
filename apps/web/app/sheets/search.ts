// Searching the library. Shared by the server, which runs the search, and the
// page, which shows it. See openspec/specs/library-search.

// The shortest search, in characters. Shorter, the library lists all sheets.
export const SEARCH_MIN = 2;

// Whether the field's text is long enough to search.
export function isSearch(q: string): boolean {
  return q.trim().length >= SEARCH_MIN;
}

// The FTS5 query for the field's text: each word as a quoted prefix, so a
// typed character is never search syntax. Quotes are dropped, and words
// without a letter or a digit left out. Null when no word is left.
export function searchQuery(q: string): string | null {
  const words = q
    .split(/\s+/)
    .map((word) => word.replaceAll('"', ""))
    .filter((word) => /[\p{L}\p{N}]/u.test(word));
  return words.length === 0
    ? null
    : words.map((word) => `"${word}"*`).join(" ");
}

// A piece of shown text, and whether it is a match.
export interface TextPart {
  text: string;
  hit: boolean;
}

// What FTS5's highlight() puts around each match: private-use characters,
// which a sheet's text never holds (plainLines drops them).
export const MARK_START = String.fromCharCode(0xe000);
export const MARK_END = String.fromCharCode(0xe001);

// Highlighted text as parts, the matches marked.
export function markedParts(text: string): TextPart[] {
  const parts: TextPart[] = [];
  for (const [i, piece] of text
    .split(new RegExp(`[${MARK_START}${MARK_END}]`))
    .entries()) {
    if (piece !== "") parts.push({ text: piece, hit: i % 2 === 1 });
  }
  return parts;
}

// Whether highlighted text has a match.
export function hasMatch(text: string | null): boolean {
  return text?.includes(MARK_START) ?? false;
}

// How much of a line to keep before its first match, in characters, so the
// match stays in view in a narrow row.
const LEAD = 24;

// The first line of highlighted lyrics with a match, as parts. A line whose
// match is far in starts a few words before it, after "…".
export function matchingLine(lyrics: string): TextPart[] | undefined {
  const line = lyrics.split("\n").find((l) => l.includes(MARK_START));
  if (line === undefined) return undefined;
  const at = line.indexOf(MARK_START);
  if (at <= LEAD) return markedParts(line);
  const space = line.indexOf(" ", at - LEAD);
  const start = space === -1 || space >= at ? at : space + 1;
  return markedParts(`…${line.slice(start)}`);
}
