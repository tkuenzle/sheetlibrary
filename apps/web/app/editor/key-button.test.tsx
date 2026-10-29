import type { Key } from "chordsheet";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { KeyButton, KeyPanel } from "./key-button";

function nothing() {
  return undefined;
}

const major = (tonic: string): Key => ({ tonic, minor: false });
const minor = (tonic: string): Key => ({ tonic, minor: true });

function panel(current: Key, original: Key = current) {
  return renderToString(
    <KeyPanel
      current={current}
      original={original}
      titleId="title"
      onPick={nothing}
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
        onPick={nothing}
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
    expect(html).toContain(
      "The original key, <!-- -->G<!-- -->, is guessed from the chords.",
    );
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

  it("names the original key, not the current one", () => {
    expect(panel(major("A"), major("G"))).toContain(
      "The original key, <!-- -->G<!-- -->, is guessed",
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
