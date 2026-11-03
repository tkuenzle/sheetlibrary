import type { Sheet } from "chordsheet";
import { useEffect, useRef, useState } from "react";

import type { Saved } from "./sheets-api.server";

// Saves a sheet on its own while it is edited. See openspec/specs/sheet-page
// and the save loop in the sheet-storage change's design.
//
//   saved --edit--> waiting --quiet--> saving --200--> saved (or waiting)
//   waiting --longest wait, while edits keep coming--> saving
//   saving --network or server--> failed --backoff--> saving
//   saving --409--> conflict, for good
//   saving --404--> deleted, for good
//   any state --stop()--> stopped: nothing more is sent or reported

export type SaveState =
  // Everything is saved.
  | "saved"
  // Edited, and waiting for a quiet moment to save.
  | "waiting"
  | "saving"
  // A save failed, and another one is coming.
  | "failed"
  // The sheet was saved elsewhere since it was loaded. Saving has stopped.
  | "conflict"
  // The sheet was deleted elsewhere. Saving has stopped.
  | "deleted";

// What a save sends besides the id and the revision.
export type SheetDraft = Pick<Sheet, "title" | "artist" | "content">;

export interface AutosaveOptions {
  // The sheet as loaded. Saves keep its id and start from its revision.
  sheet: Sheet;
  // The sheet to save now, or null if there is nothing valid to save.
  read: () => SheetDraft | null;
  onState: (state: SaveState) => void;
  fetch?: typeof fetch;
  // How long edits must pause before a save.
  quietMs?: number;
  // The longest an edit waits for its save while edits keep coming.
  maxWaitMs?: number;
  // The wait before the first retry. It doubles up to maxRetryMs.
  retryMs?: number;
  maxRetryMs?: number;
}

export class Autosave {
  private state: SaveState = "saved";
  private revision: number;
  // Counts the edits, so a save can tell if more came while it was away.
  private edits = 0;
  private inFlight = false;
  // When the first edit that no save has sent yet was made.
  private firstUnsent: number | undefined;
  private failures = 0;
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly options: Required<AutosaveOptions>;

  constructor(options: AutosaveOptions) {
    this.options = {
      fetch: (...args) => fetch(...args),
      quietMs: 1000,
      maxWaitMs: 5000,
      retryMs: 2000,
      maxRetryMs: 30_000,
      ...options,
    };
    this.revision = options.sheet.revision;
  }

  // Call after every edit.
  edited(): void {
    if (this.stopped || this.isFinal()) return;
    this.edits++;
    this.firstUnsent ??= Date.now();
    // A save under way sends the newer edits once it's back. A failed save
    // keeps its retry, which reads the newest content.
    if (this.inFlight || this.state === "failed") return;
    this.setState("waiting");
    this.schedule(this.nextSaveIn());
  }

  // Stops saving for good. A save under way may still reach the server, but
  // its answer changes nothing here and schedules nothing.
  stop(): void {
    this.stopped = true;
    clearTimeout(this.timer);
  }

  private isFinal() {
    return this.state === "conflict" || this.state === "deleted";
  }

  private setState(state: SaveState) {
    if (state === this.state) return;
    this.state = state;
    this.options.onState(state);
  }

  // A quiet moment, or the longest wait if that comes first.
  private nextSaveIn() {
    const { quietMs, maxWaitMs } = this.options;
    const longest = (this.firstUnsent ?? Date.now()) + maxWaitMs - Date.now();
    return Math.max(0, Math.min(quietMs, longest));
  }

  private schedule(ms: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.save();
    }, ms);
  }

  private retry() {
    this.setState("failed");
    const { retryMs, maxRetryMs } = this.options;
    this.schedule(Math.min(retryMs * 2 ** this.failures, maxRetryMs));
    this.failures++;
  }

  private async save() {
    const draft = this.options.read();
    if (!draft) {
      this.retry();
      return;
    }
    const { id } = this.options.sheet;
    const { title, artist, content } = draft;
    const body: Sheet = {
      id,
      revision: this.revision,
      title,
      ...(artist === undefined ? {} : { artist }),
      content,
    };
    const sent = this.edits;
    this.firstUnsent = undefined;
    this.inFlight = true;
    this.setState("saving");
    // The whole answer is read before anything changes, so a stop while it
    // was away is checked once.
    let response: Response;
    let saved: Saved | undefined;
    try {
      response = await this.options.fetch(`/api/sheets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) saved = await response.json<Saved>();
    } catch {
      this.inFlight = false;
      if (this.stopped) return;
      this.retry();
      return;
    }
    this.inFlight = false;
    if (this.stopped) return;
    if (response.status === 409 || response.status === 404) {
      clearTimeout(this.timer);
      this.setState(response.status === 409 ? "conflict" : "deleted");
      return;
    }
    if (!saved) {
      this.retry();
      return;
    }
    this.revision = saved.revision;
    this.failures = 0;
    if (this.edits !== sent) {
      this.setState("waiting");
      this.schedule(this.nextSaveIn());
    } else {
      this.setState("saved");
    }
  }
}

// Autosave for a page: the save state, and the function to call after every
// edit. Saving starts in the browser, once the page is up. Like the editor,
// it reads the sheet once; give the page a new key to load another one.
// Saving stops when the page closes, or on `stop()`.
export function useAutosave(
  sheet: Sheet,
  read: () => SheetDraft | null,
): { state: SaveState; edited: () => void; stop: () => void } {
  const [state, setState] = useState<SaveState>("saved");
  const [loaded] = useState(sheet);
  const autosave = useRef<Autosave | null>(null);
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
  });
  useEffect(() => {
    const current = new Autosave({
      sheet: loaded,
      read: () => readRef.current(),
      onState: setState,
    });
    autosave.current = current;
    return () => {
      current.stop();
      autosave.current = null;
    };
  }, [loaded]);
  return {
    state,
    edited: () => autosave.current?.edited(),
    stop: () => autosave.current?.stop(),
  };
}
