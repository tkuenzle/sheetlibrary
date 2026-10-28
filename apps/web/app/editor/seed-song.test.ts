import { checkSheet } from "chordsheet";
import { describe, expect, it } from "vitest";

import { seedSong } from "./seed-song";

describe("seed song", () => {
  it("follows the model's rules", () => {
    expect(checkSheet(seedSong)).toEqual([]);
  });

  it("has two sections, labeled", () => {
    expect(seedSong.sections.map((section) => section.label)).toEqual([
      "Verse 1",
      "Verse 2",
    ]);
  });
});
