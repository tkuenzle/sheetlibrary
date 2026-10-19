import type { ChordSheet } from "chordsheet";

// "Amazing Grace" (John Newton, 1779), public domain.
export const seedSong: ChordSheet = {
  format: "chordsheet",
  version: 1,
  sections: [
    {
      lines: [
        {
          text: "Amazing grace, how sweet the sound",
          chords: [
            { at: 0, chord: "G" },
            { at: 8, chord: "G7" },
            { at: 19, chord: "C" },
            { at: 29, chord: "G" },
          ],
        },
        {
          text: "That saved a wretch like me",
          chords: [{ at: 25, chord: "D" }],
        },
        {
          text: "I once was lost, but now am found",
          chords: [
            { at: 2, chord: "G" },
            { at: 11, chord: "G7" },
            { at: 21, chord: "C" },
            { at: 28, chord: "G" },
          ],
        },
        {
          text: "Was blind, but now I see",
          chords: [
            { at: 4, chord: "Em" },
            { at: 15, chord: "D" },
            { at: 21, chord: "G" },
          ],
        },
      ],
    },
    {
      lines: [
        {
          text: "'Twas grace that taught my heart to fear",
          chords: [
            { at: 6, chord: "G" },
            { at: 17, chord: "G7" },
            { at: 27, chord: "Cmaj7" },
            { at: 36, chord: "G" },
          ],
        },
        {
          text: "And grace my fears relieved",
          chords: [{ at: 21, chord: "D" }],
        },
        {
          text: "How precious did that grace appear",
          chords: [
            { at: 4, chord: "G" },
            { at: 13, chord: "G7" },
            { at: 22, chord: "C" },
            { at: 30, chord: "G" },
          ],
        },
        {
          text: "The hour I first believed",
          chords: [
            { at: 4, chord: "Em" },
            { at: 11, chord: "D" },
            { at: 19, chord: "G" },
          ],
        },
      ],
    },
  ],
};
