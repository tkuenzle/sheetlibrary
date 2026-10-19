import { checkSheet } from "chordsheet";
import { describe, expect, it } from "vitest";

import { seedSong } from "./seed-song";

describe("seed song", () => {
  it("follows the model's rules", () => {
    expect(checkSheet(seedSong)).toEqual([]);
  });

  it("has two sections", () => {
    expect(seedSong.sections).toHaveLength(2);
  });
});
