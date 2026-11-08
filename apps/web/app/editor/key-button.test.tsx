import type { Key } from "chordsheet";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { KeyButton, KeyPanel, SongKeyPanel } from "./key-button";

function nothing() {
  return undefined;
}

const major = (tonic: string): Key => ({ tonic, minor: false });
const minor = (tonic: string): Key => ({ tonic, minor: true });

function panel(current: Key, original: Key = current, guessed = true) {
  return renderToString(
    <KeyPanel
      current={current}
      original={original}
      guessed={guessed}
      guess={current}
      onPick={nothing}
      onSet={nothing}
      onStep={nothing}
      onBack={nothing}
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

describe("KeyButton", () => {
  it("shows the key, with the panel closed", () => {
    const html = renderToString(
      <KeyButton
        current={major("G")}
        original={major("G")}
        guessed
        guess={major("G")}
        onPick={nothing}
        onSet={nothing}
        onStep={nothing}
        onBack={nothing}
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

  it("says the song key is guessed only while none is set", () => {
    expect(panel(major("G"))).toContain("Guessed from the chords");
    expect(panel(major("G"), major("G"), false)).not.toContain("Guessed");
  });

  it("offers to change the song key", () => {
    expect(panel(major("G"))).toMatch(
      /<button[^>]*aria-label="Change the song key"[^>]*>Change<\/button>/,
    );
  });

  it("always shows the way back, disabled in the original key", () => {
    const back = (html: string) =>
      /<button[^>]*>Back to <!-- -->G<\/button>/.exec(html)?.[0];
    expect(back(panel(major("G")))).toContain("disabled");
    expect(back(panel(major("A"), major("G")))).not.toContain("disabled");
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
