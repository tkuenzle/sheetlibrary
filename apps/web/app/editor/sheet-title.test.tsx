import type { ChordSheet, Key } from "chordsheet";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { SheetEditorHandle } from "./sheet-editor";
import {
  loadSheetKey,
  type SheetKey,
  type SheetKeyState,
  SheetTitle,
  sheetKeyReducer,
} from "./sheet-title";

const G: Key = { tonic: "G", minor: false };
const A: Key = { tonic: "A", minor: false };
const Em: Key = { tonic: "E", minor: true };

// "Amazing grace" with the chords G, C and D, guessed as G.
function amazingGrace(key?: Key): ChordSheet {
  return {
    format: "chordsheet",
    version: 1,
    ...(key ? { key } : {}),
    sections: [
      {
        lines: [
          {
            text: "Amazing grace",
            chords: [
              { at: 0, root: "G" },
              { at: 8, root: "C" },
              { at: 12, root: "D" },
            ],
          },
        ],
      },
    ],
  };
}

const chordsInA = [{ root: "A" }, { root: "D" }, { root: "E" }];

describe("the sheet's key", () => {
  it("is guessed from the chords without a set key", () => {
    expect(loadSheetKey(amazingGrace())).toMatchObject({
      key: G,
      original: G,
      guessed: true,
    });
  });

  it("is the set key, before the guess", () => {
    expect(loadSheetKey(amazingGrace(Em))).toMatchObject({
      key: Em,
      original: Em,
      guessed: false,
    });
  });

  it("follows the guess when the chords change", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace()), {
      type: "chords",
      chords: chordsInA,
      key: null,
      original: null,
    });
    expect(state).toMatchObject({ key: A, original: G, guessed: true });
  });

  it("stays the set key when the chords change", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace(G)), {
      type: "chords",
      chords: chordsInA,
      key: G,
      original: G,
    });
    expect(state.key).toEqual(G);
  });

  it("takes the original from the editor once a key is set", () => {
    const chords = [{ root: "G" }, { root: "C" }, { root: "D" }];
    let state: SheetKeyState = loadSheetKey(amazingGrace());
    state = sheetKeyReducer(state, {
      type: "chords",
      chords,
      key: Em,
      original: Em,
    });
    expect(state).toMatchObject({ key: Em, original: Em, guessed: false });
    // Undoing the set key brings back the guess, and "Back" goes there.
    state = sheetKeyReducer(state, {
      type: "chords",
      chords,
      key: null,
      original: null,
    });
    expect(state).toMatchObject({ key: G, original: G, guessed: true });
  });
});

describe("SheetTitle", () => {
  function title(sheet: ChordSheet) {
    const sheetKey: SheetKey = {
      ...loadSheetKey(sheet),
      onChordsChange: () => undefined,
      reset: () => undefined,
    };
    return renderToString(
      <SheetTitle
        title="Amazing Grace"
        sheetKey={sheetKey}
        editor={createRef<SheetEditorHandle>()}
      />,
    );
  }

  const withoutChords = (key?: Key): ChordSheet => ({
    format: "chordsheet",
    version: 1,
    ...(key ? { key } : {}),
    sections: [{ lines: [{ text: "Amazing grace", chords: [] }] }],
  });

  it("shows the key button without chords when a key is set", () => {
    expect(title(withoutChords(Em))).toContain('aria-label="Key E minor"');
  });

  it("has no key button without chords and without a set key", () => {
    expect(title(withoutChords())).not.toContain("key-button");
  });
});
