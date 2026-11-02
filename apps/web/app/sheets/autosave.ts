import type { Sheet } from "chordsheet";
import { useEffect, useRef, useState } from "react";

import type { Saved } from "./sheets-api.server";

// Saves a sheet on its own while it is edited. See openspec/specs/sheet-page
// and the save loop in the sheet-storage change's design.
//
//   saved --edit--> waiting --quiet--> saving --200--> saved (or waiting)
//   saving --network or server--> failed --backoff--> saving
//   saving --409--> conflict, for good

export type SaveState =
  // Everything is saved.
  | "saved"
  // Edited, and waiting for a quiet moment to save.
  | "waiting"
  | "saving"
  // A save failed, and another one is coming.
  | "failed"
  // The sheet was saved elsewhere since it was loaded. Saving has stopped.
  | "conflict";

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
  private failures = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly options: Required<AutosaveOptions>;

  constructor(options: AutosaveOptions) {
    this.options = {
      fetch: (...args) => fetch(...args),
      quietMs: 1000,
      retryMs: 2000,
      maxRetryMs: 30_000,
      ...options,
    };
    this.revision = options.sheet.revision;
  }

  // Call after every edit.
  edited(): void {
    if (this.state === "conflict") return;
    this.edits++;
    // A save under way sends the newer edits once it's back. A failed save
    // keeps its retry, which reads the newest content.
    if (this.inFlight || this.state === "failed") return;
    this.setState("waiting");
    this.schedule(this.options.quietMs);
  }

  dispose(): void {
    clearTimeout(this.timer);
  }

  private setState(state: SaveState) {
    if (state === this.state) return;
    this.state = state;
    this.options.onState(state);
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
    this.inFlight = true;
    this.setState("saving");
    let response: Response;
    try {
      response = await this.options.fetch(`/api/sheets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      this.inFlight = false;
      this.retry();
      return;
    }
    this.inFlight = false;
    if (response.status === 409) {
      clearTimeout(this.timer);
      this.setState("conflict");
      return;
    }
    if (!response.ok) {
      this.retry();
      return;
    }
    this.revision = (await response.json<Saved>()).revision;
    this.failures = 0;
    if (this.edits !== sent) {
      this.setState("waiting");
      this.schedule(this.options.quietMs);
    } else {
      this.setState("saved");
    }
  }
}

// Autosave for a page: the save state, and the function to call after every
// edit. Saving starts in the browser, once the page is up. Like the editor,
// it reads the sheet once; give the page a new key to load another one.
export function useAutosave(
  sheet: Sheet,
  read: () => SheetDraft | null,
): { state: SaveState; edited: () => void } {
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
      current.dispose();
      autosave.current = null;
    };
  }, [loaded]);
  return {
    state,
    edited: () => autosave.current?.edited(),
  };
}
