import { type Location, useLocation, useNavigate } from "react-router";

// Where Back, Done and Delete go from a sheet. See openspec/specs/site-layout
// ("Back on a sheet") and the sheet-play-first change's design.
//
//   Sheets --push--> play --"Edit", push--> edit
//                    play <--"Done" or the browser's back, step back--
//   Sheets --"New sheet"--> edit --"Done", replace--> play
//
// Back from play steps back when the app has an entry before it, and opens
// Sheets when the sheet was the first page loaded, as from a link.

// A move: a step back in the history, or a new address.
export type SheetMove = { step: -1 | -2 } | { to: string; replace: boolean };

// Where the sheet sits in the app's history.
export interface SheetHistory {
  // React Router's index of this entry, 0 for the first one the app loaded.
  index: number;
  // In edit mode: whether "Edit" opened it from the play view, so the play
  // entry is right below.
  fromPlay: boolean;
}

// What "Edit" puts in the location's state.
export const fromPlayState = { fromPlay: true } as const;

const sheets = "/sheets";

export function backFromPlay({ index }: SheetHistory): SheetMove {
  return index > 0 ? { step: -1 } : { to: sheets, replace: false };
}

// `play` is the play view's address, with the key and the capo shown now.
export function doneFromEdit(
  { fromPlay }: SheetHistory,
  play: string,
): SheetMove {
  return fromPlay ? { step: -1 } : { to: play, replace: true };
}

// After a delete, leave as Back from play would, so no entry of the deleted
// sheet stays on the way back.
export function afterDelete(
  mode: "play" | "edit",
  { index, fromPlay }: SheetHistory,
): SheetMove {
  const below = mode === "edit" && fromPlay ? 1 : 0;
  return index - below > 0
    ? { step: below ? -2 : -1 }
    : { to: sheets, replace: true };
}

// The sheet's place in the history, from React Router's state.
export function sheetHistory(
  location: Pick<Location, "state">,
  historyState: unknown = typeof window === "undefined"
    ? null
    : window.history.state,
): SheetHistory {
  const index =
    historyState !== null &&
    typeof historyState === "object" &&
    "idx" in historyState &&
    typeof historyState.idx === "number"
      ? historyState.idx
      : 0;
  const state: unknown = location.state;
  const fromPlay =
    state !== null &&
    typeof state === "object" &&
    "fromPlay" in state &&
    state.fromPlay === true;
  return { index, fromPlay };
}

// Makes a move, read at the moment it is made.
export function useSheetMoves(): {
  history: () => SheetHistory;
  go: (move: SheetMove) => Promise<void>;
} {
  const location = useLocation();
  const navigate = useNavigate();
  return {
    history: () => sheetHistory(location),
    go: async (move) => {
      await ("step" in move
        ? navigate(move.step)
        : navigate(move.to, { replace: move.replace }));
    },
  };
}
