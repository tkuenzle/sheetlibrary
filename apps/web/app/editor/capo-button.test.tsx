import type { Key } from "chordsheet";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CapoButton, CapoPanel } from "./capo-button";

function nothing() {
  return undefined;
}

const major = (tonic: string): Key => ({ tonic, minor: false });

function button(sounding: Key, capo: number) {
  return renderToString(
    <CapoButton sounding={sounding} capo={capo} onPick={nothing} />,
  );
}

function panel(sounding: Key, capo: number) {
  return renderToString(
    <CapoPanel sounding={sounding} capo={capo} onPick={nothing} />,
  );
}

// Each fret's name and shapes, as shown, in order.
function frets(html: string) {
  return [
    ...html.matchAll(
      /class="capo-panel-fret"[^>]*>([^<]+)<span class="capo-panel-shapes">([^<]+)<!-- --> shapes/g,
    ),
  ].map((match) => `${match[1] ?? ""} · ${match[2] ?? ""}`);
}

describe("CapoButton", () => {
  // Scenario "No capo".
  it("reads Capo, quietly, without a capo", () => {
    const html = button(major("G"), 0);
    expect(html).toMatch(/aria-label="Capo"[^>]*data-none="true"[^>]*>Capo</);
  });

  // Scenario "Capo 5".
  it("reads the fret with a capo", () => {
    const html = button(major("G"), 5);
    expect(html).toContain('aria-label="Capo 5, D shapes"');
    expect(html).toMatch(/>Capo 5</);
    expect(html).not.toContain("data-none");
  });

  it("reads out sharp shapes", () => {
    expect(button(major("Bb"), 4)).toContain(
      'aria-label="Capo 4, F sharp shapes"',
    );
  });
});

describe("CapoPanel", () => {
  it("lists the frets from no capo to 9, with their shapes", () => {
    expect(frets(panel(major("Bb"), 3))).toEqual([
      "No capo · Bb",
      "Capo 1 · A",
      "Capo 2 · Ab",
      "Capo 3 · G",
      "Capo 4 · F#",
      "Capo 5 · F",
      "Capo 6 · E",
      "Capo 7 · Eb",
      "Capo 8 · D",
      "Capo 9 · Db",
    ]);
  });

  it("marks the capo in use", () => {
    const pressed = [
      ...panel(major("Bb"), 3).matchAll(
        /aria-label="([^"]+)" aria-pressed="true"/g,
      ),
    ].map((match) => match[1]);
    expect(pressed).toEqual(["Capo 3, G shapes"]);
  });

  it("marks no capo without one", () => {
    expect(panel(major("G"), 0)).toMatch(
      /aria-label="No capo, G shapes" aria-pressed="true"/,
    );
  });

  it("keeps the sounding key's spelling without a capo", () => {
    expect(frets(panel(major("G#"), 0))[0]).toBe("No capo · G#");
  });
});
