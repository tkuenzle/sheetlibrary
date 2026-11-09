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
      guessed: true,
      shown: null,
    });
  });

  it("is the set key, before the guess", () => {
    expect(loadSheetKey(amazingGrace(Em))).toMatchObject({
      key: Em,
      guessed: false,
    });
  });

  it("follows the guess when the chords change", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace()), {
      type: "chords",
      chords: chordsInA,
      key: null,
    });
    expect(state).toMatchObject({ key: A, guessed: true, guess: A });
  });

  it("stays the set key when the chords change", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace(G)), {
      type: "chords",
      chords: chordsInA,
      key: G,
    });
    expect(state.key).toEqual(G);
  });

  it("brings back the guess when the set key is undone", () => {
    const chords = [{ root: "G" }, { root: "C" }, { root: "D" }];
    let state: SheetKeyState = loadSheetKey(amazingGrace());
    state = sheetKeyReducer(state, { type: "chords", chords, key: Em });
    expect(state).toMatchObject({ key: Em, guessed: false, guess: G });
    state = sheetKeyReducer(state, { type: "chords", chords, key: null });
    expect(state).toMatchObject({ key: G, guessed: true });
  });
});

describe("the shown key", () => {
  const chords = [{ root: "G" }, { root: "C" }, { root: "D" }];
  const FsharpMinor: Key = { tonic: "F#", minor: true };

  it("is read from the address", () => {
    expect(loadSheetKey(amazingGrace(), "A").shown).toEqual(A);
    expect(loadSheetKey(amazingGrace(Em), "F#m").shown).toEqual(FsharpMinor);
  });

  it("isn't read when it doesn't fit the song", () => {
    expect(loadSheetKey(amazingGrace(), "Am").shown).toBeNull();
    expect(loadSheetKey(amazingGrace(), "H").shown).toBeNull();
    expect(loadSheetKey(amazingGrace(), "G").shown).toBeNull();
  });

  it("is none in the song key", () => {
    let state = sheetKeyReducer(loadSheetKey(amazingGrace()), {
      type: "show",
      key: A,
    });
    expect(state.shown).toEqual(A);
    state = sheetKeyReducer(state, { type: "show", key: G });
    expect(state.shown).toBeNull();
  });

  it("keeps its distance when the song key is set", () => {
    let state = loadSheetKey(amazingGrace(), "A");
    state = sheetKeyReducer(state, { type: "chords", chords, key: Em });
    expect(state).toMatchObject({ key: Em, shown: FsharpMinor });
  });

  it("keeps its distance when the guess changes", () => {
    let state = loadSheetKey(amazingGrace(), "A");
    state = sheetKeyReducer(state, {
      type: "chords",
      chords: chordsInA,
      key: null,
    });
    expect(state).toMatchObject({
      key: A,
      shown: { tonic: "B", minor: false },
    });
  });

  it("is gone with the chords", () => {
    let state = loadSheetKey(amazingGrace(), "A");
    state = sheetKeyReducer(state, { type: "chords", chords: [], key: null });
    expect(state).toMatchObject({ key: null, shown: null });
  });

  it("is dropped by a new sheet", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace(), "A"), {
      type: "reset",
      sheet: amazingGrace(),
    });
    expect(state.shown).toBeNull();
  });
});

describe("SheetTitle", () => {
  function title(sheet: ChordSheet) {
    const sheetKey: SheetKey = {
      ...loadSheetKey(sheet),
      onChordsChange: () => undefined,
      show: () => undefined,
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

  it("shows the key the sheet is shown in", () => {
    const html = renderToString(
      <SheetTitle
        title="Amazing Grace"
        sheetKey={{
          ...loadSheetKey(amazingGrace(), "A"),
          onChordsChange: () => undefined,
          show: () => undefined,
          reset: () => undefined,
        }}
        editor={createRef<SheetEditorHandle>()}
      />,
    );
    expect(html).toContain('aria-label="Key A"');
  });

  it("has no key button without chords and without a set key", () => {
    expect(title(withoutChords())).not.toContain("key-button");
  });
});
