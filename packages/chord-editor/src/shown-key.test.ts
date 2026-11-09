import { undo } from "prosemirror-history";
import { describe, expect, it } from "vitest";

import { writeMarkedChord } from "chordsheet";

import { chordsIn } from "./chords";
import { getShownKey, showKey, shownChord } from "./shown-key";
import { exec, notation, song, type } from "./test-helpers";

const G = { tonic: "G", minor: false };
const A = { tonic: "A", minor: false };

function shownChords(state: ReturnType<typeof song>) {
  return chordsIn(state.doc).map((c) => writeMarkedChord(shownChord(state, c)));
}

describe("showing a key", () => {
  it("shows the chords moved and leaves the sheet as it was", () => {
    const state = song("[G]Amazing [C]grace\n\n[D/F#]me");
    const next = exec(state, showKey({ from: G, to: A }));
    expect(shownChords(next)).toEqual(["A", "D", "E/G#"]);
    expect(next.doc).toBe(state.doc);
  });

  it("shows the chords as they are without a shown key", () => {
    const state = exec(song("[G]Amazing grace"), showKey({ from: G, to: A }));
    const next = exec(state, showKey(null));
    expect(getShownKey(next)).toBeNull();
    expect(shownChords(next)).toEqual(["G"]);
  });

  it("isn't a step to undo", () => {
    const typed = type(song("[G]Amazing grace"), "x");
    const shown = exec(typed, showKey({ from: G, to: A }));
    const undone = exec(shown, undo);
    expect(notation(undone)).toBe("[G]Amazing grace");
    expect(getShownKey(undone)).toEqual({ from: G, to: A });
  });
});
