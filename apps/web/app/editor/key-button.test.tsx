import type { Key } from "chordsheet";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { KeyButton, KeyPanel, SongKeyPanel } from "./key-button";

function nothing() {
  return undefined;
}

const major = (tonic: string): Key => ({ tonic, minor: false });
const minor = (tonic: string): Key => ({ tonic, minor: true });

function panel(
  current: Key,
  song: Key = current,
  { guessed = true, readOnly = false, viewOnly = false } = {},
) {
  return renderToString(
    <KeyPanel
      current={current}
      song={song}
      guessed={guessed}
      guess={song}
      readOnly={readOnly}
      viewOnly={viewOnly}
      onPick={nothing}
      onSet={nothing}
      onStep={nothing}
      onBack={nothing}
      onMake={nothing}
    />,
  );
}

// The keys' names, as shown, in order.
function keys(html: string) {
  return [...html.matchAll(/class="key-panel-key"[^>]*>([^<]+)</g)].map(
    (match) => match[1],
  );
}

function pressed(html: string) {
  return [...html.matchAll(/aria-pressed="true"[^>]*>([^<]+)</g)].map(
    (match) => match[1],
  );
}

function keyButton(current: Key, song: Key = current) {
  return renderToString(
    <KeyButton
      current={current}
      song={song}
      guessed
      guess={song}
      onPick={nothing}
      onSet={nothing}
      onStep={nothing}
      onBack={nothing}
      onMake={nothing}
      onUndo={nothing}
      onRedo={nothing}
    />,
  );
}

describe("KeyButton", () => {
  it("isn't filled in the song key", () => {
    const html = keyButton(major("G"));
    expect(html).not.toContain("data-transposed");
    expect(html).not.toContain("key-button-distance");
  });

  // Scenario "Transposed".
  it("is filled and names the distance while transposed", () => {
    const up = keyButton(major("A"), major("G"));
    expect(up).toContain('data-transposed="true"');
    expect(up).toContain('aria-label="Key A, 2 semitones up"');
    expect(up).toMatch(
      /<span class="key-button-distance"> · <!-- -->\+2<\/span>/,
    );
    const down = keyButton(major("F#"), major("G"));
    expect(down).toContain("−1");
    expect(down).toContain('aria-label="Key F sharp, 1 semitone down"');
  });

  it("counts the shorter way, up to a tritone up", () => {
    expect(keyButton(major("Db"), major("G"))).toContain("+6");
    expect(keyButton(major("D"), major("G"))).toContain("−5");
  });

  it("is filled without a number for a respelling", () => {
    const html = keyButton(major("Ab"), major("G#"));
    expect(html).toContain('data-transposed="true"');
    expect(html).not.toContain("key-button-distance");
  });

  it("shows the key, with the panel closed", () => {
    const html = renderToString(
      <KeyButton
        current={major("G")}
        song={major("G")}
        guessed
        guess={major("G")}
        onPick={nothing}
        onSet={nothing}
        onStep={nothing}
        onBack={nothing}
        onMake={nothing}
        onUndo={nothing}
        onRedo={nothing}
      />,
    );
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Key G"');
    expect(html).toContain("Key <!-- -->G");
    expect(html).toContain("data-keeps-editing");
    expect(html).toContain('aria-label="Key"');
    expect(html).not.toContain("Transpose to");
  });
});

describe("KeyPanel", () => {
  it("lists the major keys, with both at the tie, and marks the key", () => {
    const html = panel(major("G"));
    expect(keys(html)).toEqual([
      "C",
      "Db",
      "D",
      "Eb",
      "E",
      "F",
      "F#",
      "Gb",
      "G",
      "Ab",
      "A",
      "Bb",
      "B",
    ]);
    expect(html).toContain('aria-label="F sharp or G flat"');
    expect(pressed(html)).toEqual(["G"]);
  });

  it("lists the minor keys for a minor sheet", () => {
    const html = panel(minor("E"));
    expect(keys(html)).toEqual([
      "Cm",
      "C#m",
      "Dm",
      "D#m",
      "Ebm",
      "Em",
      "Fm",
      "F#m",
      "Gm",
      "G#m",
      "Am",
      "Bbm",
      "Bm",
    ]);
    expect(pressed(html)).toEqual(["Em"]);
  });

  it("marks Ab for a sheet in G#, and one half at the tie", () => {
    expect(pressed(panel(major("G#")))).toEqual(["Ab"]);
    expect(pressed(panel(major("Gb")))).toEqual(["Gb"]);
  });

  it("has the song key, then the keys to transpose to", () => {
    const html = panel(major("G"));
    expect(html.indexOf("Song key")).toBeLessThan(html.indexOf("Transpose to"));
    expect(html).toContain('<p class="key-panel-song-key">G</p>');
  });

  it("shows the song key while the sheet is shown in another", () => {
    const html = panel(major("A"), major("G"));
    expect(html).toContain('<p class="key-panel-song-key">G</p>');
    expect(pressed(html)).toEqual(["A"]);
  });

  it("says the song key is guessed only while none is set", () => {
    expect(panel(major("G"))).toContain("Guessed from the chords");
    expect(panel(major("G"), major("G"), { guessed: false })).not.toContain(
      "Guessed",
    );
  });

  it("offers to change the song key", () => {
    expect(panel(major("G"))).toMatch(
      /<button[^>]*aria-label="Change the song key"[^>]*>Change<\/button>/,
    );
  });

  it("always shows the way back, disabled in the song key", () => {
    const back = (html: string) =>
      /<button[^>]*>Back to <!-- -->G<\/button>/.exec(html)?.[0];
    expect(back(panel(major("G")))).toContain("disabled");
    expect(back(panel(major("A"), major("G")))).not.toContain("disabled");
  });

  it("offers to make the shown key the song key only while transposed", () => {
    const make = (html: string) =>
      /<button[^>]*>Make <!-- -->A<!-- --> the song key<\/button>/.exec(
        html,
      )?.[0];
    expect(make(panel(major("A"), major("G")))).not.toContain("disabled");
    expect(panel(major("G"))).not.toContain("the song key</button>");
  });

  it("changes nothing in a read-only sheet, but still transposes", () => {
    const html = panel(major("A"), major("G"), { readOnly: true });
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Change<\/button>/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Make /);
    expect(html).not.toMatch(/class="key-panel-key"[^>]*disabled/);
  });

  // Scenario "Transposing to play" (play-page).
  it("only transposes to view, with nothing to change", () => {
    const html = panel(major("A"), major("G"), { viewOnly: true });
    expect(html).not.toContain("Change the song key");
    expect(html).not.toContain("the song key</button>");
    expect(html).toContain("Song key");
    expect(html).toContain("key-panel-back");
    expect(keys(html)).toContain("A");
  });

  it("has steps of a semitone", () => {
    const html = panel(major("G"));
    expect(html).toContain('aria-label="Down a semitone"');
    expect(html).toContain('aria-label="Up a semitone"');
  });
});

describe("SongKeyPanel", () => {
  function songKeys(current: Key, guess: Key | null = current) {
    return renderToString(
      <SongKeyPanel
        current={current}
        guess={guess}
        onSet={nothing}
        onCancel={nothing}
      />,
    );
  }

  it("lists the major and then the minor keys", () => {
    const html = songKeys(major("G"));
    expect(html).toContain("Pick the key the song is in.");
    expect(html).toContain("The chords stay as they are.");
    expect(keys(html)).toEqual([
      ...["C", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb"],
      ...["B", "Cm", "C#m", "Dm", "D#m", "Ebm", "Em", "Fm", "F#m", "Gm"],
      ...["G#m", "Am", "Bbm", "Bm"],
    ]);
    expect(html).toContain("Cancel");
  });

  it("marks the sheet's key, in its own mode only", () => {
    expect(pressed(songKeys(major("G")))).toEqual(["G"]);
    expect(pressed(songKeys(minor("E")))).toEqual(["Em"]);
  });

  // The keys with a dot, as shown.
  function dotted(html: string) {
    return [...html.matchAll(/data-guess="true"[^>]*>([^<]+)</g)].map(
      (match) => match[1],
    );
  }

  it("names the guess, and dots it when it isn't the song key", () => {
    const html = songKeys(minor("E"), major("G"));
    expect(html).toContain("Guessed from the chords: <!-- -->G");
    expect(dotted(html)).toEqual(["G"]);
    expect(pressed(html)).toEqual(["Em"]);
    expect(dotted(songKeys(major("G")))).toEqual([]);
  });

  it("names no guess without chords", () => {
    expect(songKeys(minor("E"), null)).not.toContain("Guessed");
  });
});
