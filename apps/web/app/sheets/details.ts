// What the title and the artist fields keep. See openspec/specs/sheet-page.

// The title of a new sheet, and of one whose title was cleared.
export const UNTITLED = "Untitled";

// The title to keep from the field's text.
export function keptTitle(text: string): string {
  return text.trim() || UNTITLED;
}

// The artist to keep from the field's text. None when it is empty.
export function keptArtist(text: string): string | undefined {
  return text.trim() || undefined;
}
