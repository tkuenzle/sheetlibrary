import type { ChordSheet } from "chordsheet";

// "Amazing Grace" (John Newton, 1779), public domain.
export const seedSong: ChordSheet = {
  format: "chordsheet",
  version: 1,
  sections: [
    {
      label: "Verse 1",
      lines: [
        {
          text: "Amazing grace, how sweet the sound",
          chords: [
            { at: 0, root: "G" },
            { at: 8, root: "G", suffix: "7" },
            { at: 19, root: "C" },
            { at: 29, root: "G" },
          ],
        },
        {
          text: "That saved a wretch like me",
          chords: [{ at: 25, root: "D" }],
        },
        {
          text: "I once was lost, but now am found",
          chords: [
            { at: 2, root: "G" },
            { at: 11, root: "G", suffix: "7" },
            { at: 21, root: "C" },
            { at: 28, root: "G" },
          ],
        },
        {
          text: "Was blind, but now I see",
          chords: [
            { at: 4, root: "E", suffix: "m" },
            { at: 15, root: "D" },
            { at: 21, root: "G" },
          ],
        },
      ],
    },
    {
      label: "Verse 2",
      lines: [
        {
          text: "'Twas grace that taught my heart to fear",
          chords: [
            { at: 6, root: "G" },
            { at: 17, root: "G", suffix: "7" },
            { at: 27, root: "C", suffix: "maj7" },
            { at: 36, root: "G" },
          ],
        },
        {
          text: "And grace my fears relieved",
          chords: [{ at: 21, root: "D" }],
        },
        {
          text: "How precious did that grace appear",
          chords: [
            { at: 4, root: "G" },
            { at: 13, root: "G", suffix: "7" },
            { at: 22, root: "C" },
            { at: 30, root: "G" },
          ],
        },
        {
          text: "The hour I first believed",
          chords: [
            { at: 4, root: "E", suffix: "m" },
            { at: 11, root: "D" },
            { at: 19, root: "G" },
          ],
        },
      ],
    },
  ],
};
