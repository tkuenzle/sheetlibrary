import { type ChordSheet, type Line, readMarkedChord } from "chordsheet";

// Sheets for the sheet view's tests, written with chords in brackets before
// their letter, as in "[Am7]I [G]love you".

export function line(source: string): Line {
  const line: Line = { text: "", chords: [] };
  for (const part of source.split(/(\[[^\]]+\])/)) {
    const chord = /^\[.+\]$/.test(part)
      ? readMarkedChord(part.slice(1, -1))
      : null;
    if (chord) line.chords.push({ ...chord, at: line.text.length });
    else line.text += part;
  }
  return line;
}

export function sheet(
  ...sections: [label: string | null, ...lines: string[]][]
): ChordSheet {
  return {
    format: "chordsheet",
    version: 1,
    sections: sections.map(([label, ...lines]) => ({
      ...(label !== null && { label }),
      lines: lines.map(line),
    })),
  };
}

// Lines that are hard to lay out: wide chords on short words, piles, chords
// on spaces and inside words, lines without lyrics or chords, long lines.
export const awkwardSheet = sheet(
  [
    "Wide chord, short word",
    "[Am7]I [G]love you",
    "[F#m7b5]a little [C]more than [G]words",
    "[F#m7b5]illicit [G]x",
    "[Cmaj7]I'm [Dsus4]a [Em7]man",
  ],
  [
    "Piles and spaces",
    "[G][C]Amazing grace",
    "A[Am7][G]men, a[Dsus4][D]men",
    "grace,[C] how sweet[D] the sound",
    "and now I [G]see[D]",
  ],
  [
    "Chords inside words",
    "Hal[F]le[Am]lu[F]jah, hal[C]le[G]lu[C]jah",
    "Ama[Bb]zing [Bbmaj7]gra[F/A]ce",
    "won[Em]der[Am]ful[D]ly",
  ],
  [
    "Chords only, no chords",
    "[G][C][D][G]",
    "A line without any chords keeps the rhythm",
    "[D]Back to chords",
  ],
  [
    "Long lines",
    "[G]Amazing grace how sweet the sound that saved a wretch like me and a few more words to make it wrap [D]twice",
    "Short [C]then a very long stretch of words without another chord until the very end of it [G]here",
  ],
);
