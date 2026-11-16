import type { Key } from "chordsheet";

// The key and the capo that "Done" hands back to the play view. Done steps
// back to the play entry, whose address still holds the key and the capo
// from before editing, so edit mode leaves what it shows here, and the play
// view takes it once it is up. See the sheet-play-first change's design.

export interface HandedView {
  // The key the sheet is shown in, or null for the song key.
  shown: Key | null;
  capo: number;
}

const handed = new Map<string, HandedView>();

export function handViewBack(sheetId: string, view: HandedView): void {
  handed.set(sheetId, view);
}

// What edit mode handed back for the sheet, once: taking it clears it.
export function takeHandedView(sheetId: string): HandedView | undefined {
  const view = handed.get(sheetId);
  handed.delete(sheetId);
  return view;
}
