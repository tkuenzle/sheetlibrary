import { MAX_PHOTOS } from "./limits";

// The state of the photo import dialog, as a reducer, so it can be tested
// without a browser. See openspec/specs/library-page.

// A page, in the order it was added. Each photo is shrunk when it is added:
// until then it is "shrinking". The shrunk photo and its thumbnail (an
// object URL the dialog makes) come with "ready".
export type Page =
  | { id: number; status: "shrinking" }
  | { id: number; status: "ready"; photo: Blob; thumbnail: string }
  | { id: number; status: "unopenable" };

// What the dialog is doing: showing the pages, sending them (with the share
// sent, 0 to 100), the server reading them (since when, in ms), or showing
// that the reading didn't work.
export type Stage =
  | { kind: "pages" }
  | { kind: "uploading"; percent: number }
  | { kind: "reading"; since: number }
  | { kind: "failed" };

export interface PhotoImportState {
  pages: Page[];
  stage: Stage;
}

export type PhotoImportAction =
  | { type: "add"; ids: number[] }
  | { type: "shrunk"; id: number; photo: Blob; thumbnail: string }
  | { type: "unopenable"; id: number }
  | { type: "remove"; id: number }
  | { type: "start" }
  | { type: "progress"; sent: number }
  | { type: "sent"; at: number }
  | { type: "failed" };

export const initialState: PhotoImportState = {
  pages: [],
  stage: { kind: "pages" },
};

// The pages can be changed only while nothing is sent or read.
export function editable({ stage }: PhotoImportState): boolean {
  return stage.kind === "pages" || stage.kind === "failed";
}

export function canAdd(state: PhotoImportState): boolean {
  return editable(state) && state.pages.length < MAX_PHOTOS;
}

// Import waits for every photo to be shrunk, and for any that can't be
// opened to be removed.
export function canImport(state: PhotoImportState): boolean {
  return (
    editable(state) &&
    state.pages.length > 0 &&
    state.pages.every((page) => page.status === "ready")
  );
}

// The shrunk photos, in page order, once every page is ready.
export function photos(state: PhotoImportState): Blob[] {
  return state.pages.flatMap((page) =>
    page.status === "ready" ? [page.photo] : [],
  );
}

// The time the reading has taken, such as "0:42".
export function elapsed(since: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, "0")}`;
}

export function photoImportReducer(
  state: PhotoImportState,
  action: PhotoImportAction,
): PhotoImportState {
  const setPage = (id: number, page: Page) => ({
    ...state,
    pages: state.pages.map((old) => (old.id === id ? page : old)),
  });
  switch (action.type) {
    case "add": {
      if (!canAdd(state)) return state;
      // Photos past the limit are left out.
      const room = MAX_PHOTOS - state.pages.length;
      const added = action.ids
        .slice(0, room)
        .map((id): Page => ({ id, status: "shrinking" }));
      return { ...state, pages: [...state.pages, ...added] };
    }
    case "shrunk":
      return setPage(action.id, {
        id: action.id,
        status: "ready",
        photo: action.photo,
        thumbnail: action.thumbnail,
      });
    case "unopenable":
      return setPage(action.id, { id: action.id, status: "unopenable" });
    case "remove":
      if (!editable(state)) return state;
      return {
        ...state,
        pages: state.pages.filter((page) => page.id !== action.id),
      };
    case "start":
      if (!canImport(state)) return state;
      return { ...state, stage: { kind: "uploading", percent: 0 } };
    case "progress":
      if (state.stage.kind !== "uploading") return state;
      return {
        ...state,
        stage: {
          kind: "uploading",
          percent: Math.min(100, Math.round(action.sent * 100)),
        },
      };
    case "sent":
      if (state.stage.kind !== "uploading") return state;
      return { ...state, stage: { kind: "reading", since: action.at } };
    case "failed":
      return { ...state, stage: { kind: "failed" } };
  }
}
