import type { ChordSheet, Key } from "chordsheet";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { SheetEditorHandle } from "./sheet-editor";
import {
  drawnKey,
  keyQuery,
  loadSheetKey,
  type SheetKey,
  type SheetKeyState,
  SheetTitle,
  sheetKeyReducer,
  withAddressParam,
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

describe("keyQuery", () => {
  it("writes the shown key and the capo as the address does", () => {
    expect(keyQuery({ shown: A, capo: 2 })).toBe("key=A&capo=2");
    expect(keyQuery({ shown: { tonic: "F#", minor: true }, capo: 0 })).toBe(
      "key=F%23m",
    );
    expect(keyQuery({ shown: null, capo: 3 })).toBe("capo=3");
    expect(keyQuery({ shown: null, capo: 0 })).toBe("");
  });
});

describe("withAddressParam", () => {
  const page = "https://example.com/sheets/1";

  it("writes a flag without a value, after the key", () => {
    expect(withAddressParam(`${page}?key=A`, "lyrics", true)).toBe(
      `${page}?key=A&lyrics`,
    );
  });

  it("takes a flag out", () => {
    expect(withAddressParam(`${page}?key=A&lyrics`, "lyrics", null)).toBe(
      `${page}?key=A`,
    );
    expect(withAddressParam(`${page}?lyrics`, "lyrics", null)).toBe(page);
  });

  it("leaves an address that already holds the flag", () => {
    expect(withAddressParam(`${page}?lyrics=`, "lyrics", true)).toBeNull();
    expect(withAddressParam(`${page}?key=A`, "lyrics", null)).toBeNull();
  });

  it("keeps a flag when it writes a value", () => {
    expect(withAddressParam(`${page}?lyrics&key=A`, "key", "B")).toBe(
      `${page}?lyrics&key=B`,
    );
  });
});

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
      capo: 0,
    });
    expect(state.shown).toBeNull();
  });
});

describe("the capo", () => {
  const Bb: Key = { tonic: "Bb", minor: false };
  const C: Key = { tonic: "C", minor: false };
  const D: Key = { tonic: "D", minor: false };
  const E: Key = { tonic: "E", minor: false };

  it("is read from the address", () => {
    expect(loadSheetKey(amazingGrace(), null, "5").capo).toBe(5);
    expect(loadSheetKey(amazingGrace(), null, "12").capo).toBe(0);
    expect(loadSheetKey(amazingGrace(), null, "x").capo).toBe(0);
    expect(loadSheetKey(amazingGrace(), null, null).capo).toBe(0);
  });

  // Scenario "Capo 5": the chords are drawn as D shapes.
  it("draws the chords as the shapes", () => {
    const state = loadSheetKey(amazingGrace(), null, "5");
    expect(drawnKey(state)).toEqual(D);
    expect(drawnKey(loadSheetKey(amazingGrace()))).toBeNull();
  });

  // Scenario "Capo after a transpose".
  it("draws the shapes for the shown key", () => {
    const state = loadSheetKey(amazingGrace(), "Bb", "3");
    expect(drawnKey(state)).toBeNull();
    expect(state).toMatchObject({ shown: Bb, capo: 3 });
  });

  // Scenario "Singer needs C".
  it("moves to keep the shapes on a transpose", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace(), "Bb", "3"), {
      type: "show",
      key: C,
    });
    expect(state).toMatchObject({ shown: C, capo: 5 });
    expect(drawnKey(state)).toBeNull();
  });

  // Scenario "Shapes too far".
  it("stays when keeping the shapes would take fret 10 or 11", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace(), null, "3"), {
      type: "show",
      key: D,
    });
    expect(state).toMatchObject({ shown: D, capo: 3 });
    expect(drawnKey(state)).toEqual({ tonic: "B", minor: false });
  });

  it("is gone where the shapes are the new key", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace(), "Bb", "3"), {
      type: "show",
      key: null,
    });
    expect(state).toMatchObject({ shown: null, capo: 0 });
  });

  it("isn't added by a transpose", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace()), {
      type: "show",
      key: E,
    });
    expect(state.capo).toBe(0);
  });

  it("stays when the shown key becomes the song key", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace(), "A", "2"), {
      type: "show",
      key: null,
      keepCapo: true,
    });
    expect(state).toMatchObject({ shown: null, capo: 2 });
  });

  it("stays when the song key is set", () => {
    const chords = [{ root: "G" }, { root: "C" }, { root: "D" }];
    const state = sheetKeyReducer(loadSheetKey(amazingGrace(), "A", "2"), {
      type: "chords",
      chords,
      key: Em,
    });
    expect(state.capo).toBe(2);
  });

  it("is gone with the chords", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace(), null, "2"), {
      type: "chords",
      chords: [],
      key: null,
    });
    expect(state.capo).toBe(0);
  });

  it("comes with an imported sheet", () => {
    const state = sheetKeyReducer(loadSheetKey(amazingGrace()), {
      type: "reset",
      sheet: amazingGrace(),
      capo: 2,
    });
    expect(state.capo).toBe(2);
  });
});

describe("SheetTitle", () => {
  function title(sheet: ChordSheet) {
    const sheetKey: SheetKey = {
      ...loadSheetKey(sheet),
      onChordsChange: () => undefined,
      show: () => undefined,
      setCapo: () => undefined,
      reset: () => undefined,
      drawn: null,
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
          setCapo: () => undefined,
          reset: () => undefined,
          drawn: null,
        }}
        editor={createRef<SheetEditorHandle>()}
      />,
    );
    expect(html).toContain('aria-label="Key A, 2 semitones up"');
  });

  it("has no key button without chords and without a set key", () => {
    expect(title(withoutChords())).not.toContain("key-button");
  });

  // Scenario "No capo".
  it("shows the capo button beside the key button", () => {
    const html = title(amazingGrace());
    expect(html).toContain('aria-label="Key G"');
    expect(html).toMatch(/aria-label="Capo"[^>]*data-none="true"/);
  });
});
