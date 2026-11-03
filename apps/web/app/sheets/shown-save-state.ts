import { useLayoutEffect, useState } from "react";

import type { SaveState } from "./autosave";

// What the page says about saving, worked out from the real save state. It
// only speaks when there is something worth knowing, so it stays quiet while
// someone types. See the calm-save-state change's design.
//
//   waiting                       --> nothing
//   saving                        --> as before; "Saving…" once it lasts
//   saved                         --> nothing; "Saved" once it lasts
//   failed, conflict, deleted     --> at once
//
// null means it says nothing.
export type ShownSaveState = Exclude<SaveState, "waiting"> | null;

export interface SaveStateDisplayOptions {
  onShown: (shown: ShownSaveState) => void;
  // How long a save runs before "Saving…" shows.
  savingAfterMs?: number;
  // How long everything stays saved before "Saved" shows.
  savedAfterMs?: number;
}

export class SaveStateDisplay {
  // The page opens with everything saved.
  private shown: ShownSaveState = "saved";
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly options: Required<SaveStateDisplayOptions>;

  constructor(options: SaveStateDisplayOptions) {
    this.options = { savingAfterMs: 500, savedAfterMs: 1000, ...options };
  }

  // Call whenever the real state changes. A delay still pending is dropped.
  update(state: SaveState): void {
    this.cancel();
    switch (state) {
      case "waiting":
        this.show(null);
        break;
      case "saving":
        // A failure stays on screen while its retry goes out.
        this.showLater("saving", this.options.savingAfterMs);
        break;
      case "saved":
        if (this.shown === "saved") return;
        this.show(null);
        this.showLater("saved", this.options.savedAfterMs);
        break;
      default:
        this.show(state);
    }
  }

  cancel(): void {
    clearTimeout(this.timer);
  }

  private show(shown: ShownSaveState) {
    if (shown === this.shown) return;
    this.shown = shown;
    this.options.onShown(shown);
  }

  private showLater(shown: ShownSaveState, ms: number) {
    this.timer = setTimeout(() => {
      this.show(shown);
    }, ms);
  }
}

// What the page says about the save state.
export function useShownSaveState(state: SaveState): ShownSaveState {
  const [shown, setShown] = useState<ShownSaveState>("saved");
  const [display] = useState(() => new SaveStateDisplay({ onShown: setShown }));
  // Before paint, so an edit never shows a frame of the old "Saved".
  useLayoutEffect(() => {
    display.update(state);
    return () => {
      display.cancel();
    };
  }, [display, state]);
  return shown;
}
