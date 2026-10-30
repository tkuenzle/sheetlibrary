// Keys: the key a sheet is in, the keys it can move to, and moving chords
// from one key to another, spelled as the new key spells them.

import type { ChordSymbol } from "./chord-symbol";

export interface Key {
  // A spelled note, like a chord's root: "G", "Bb", "F#".
  tonic: string;
  minor: boolean;
}

const LETTERS = "CDEFGAB";
// The semitone of each letter without an accidental, from C.
const NATURAL = [0, 2, 4, 5, 7, 9, 11];

interface Note {
  letter: number;
  // -1 for a flat, 1 for a sharp.
  accidental: number;
}

function parseNote(note: string): Note {
  const letter = LETTERS.indexOf(note.charAt(0));
  const sign = note.charAt(1);
  return { letter, accidental: sign === "#" ? 1 : sign === "b" ? -1 : 0 };
}

// The pitch of a spelled note, in semitones from C, 0 to 11.
export function pitchOf(note: string): number {
  const { letter, accidental } = parseNote(note);
  return mod((NATURAL[letter] ?? 0) + accidental, 12);
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// The keys to move to, one cell per pitch from C. Each is spelled with the
// fewer sharps or flats. Where both spellings have six, the cell holds both.
// Minor keys have their own spellings: C#m has four sharps, Dbm eight flats.
const MAJOR_CELLS = [
  ["C"],
  ["Db"],
  ["D"],
  ["Eb"],
  ["E"],
  ["F"],
  ["F#", "Gb"],
  ["G"],
  ["Ab"],
  ["A"],
  ["Bb"],
  ["B"],
];
const MINOR_CELLS = [
  ["C"],
  ["C#"],
  ["D"],
  ["D#", "Eb"],
  ["E"],
  ["F"],
  ["F#"],
  ["G"],
  ["G#"],
  ["A"],
  ["Bb"],
  ["B"],
];

// Where a cell holds two keys, a step lands on this one.
const STEP_AT_TIE = { major: "F#", minor: "Eb" };

export function keysToMoveTo(minor: boolean): Key[][] {
  return (minor ? MINOR_CELLS : MAJOR_CELLS).map((cell) =>
    cell.map((tonic) => ({ tonic, minor })),
  );
}

// The listed tonic at a pitch, the one a step lands on at the tie.
function listedTonic(pitch: number, minor: boolean): string {
  const cell = (minor ? MINOR_CELLS : MAJOR_CELLS)[mod(pitch, 12)] ?? [];
  const atTie = minor ? STEP_AT_TIE.minor : STEP_AT_TIE.major;
  return cell.includes(atTie) ? atTie : (cell[0] ?? "C");
}

// The key one semitone up (1) or down (-1), as listed.
export function stepKey(key: Key, step: 1 | -1): Key {
  return {
    tonic: listedTonic(pitchOf(key.tonic) + step, key.minor),
    minor: key.minor,
  };
}

// How many sharps (positive) or flats (negative) a key has.
function signature(key: Key): number {
  const { letter, accidental } = parseNote(key.tonic);
  // The letters' places on the circle of fifths, from C.
  const fifths = [0, 2, 4, -1, 1, 3, 5][letter] ?? 0;
  return fifths + 7 * accidental - (key.minor ? 3 : 0);
}

// The plain spelling of a pitch: its letter if it has no accidental, else a
// sharp or a flat.
function plainSpelling(pitch: number, flats: boolean): string {
  const natural = NATURAL.indexOf(pitch);
  if (natural >= 0) return LETTERS.charAt(natural);
  return flats
    ? `${LETTERS.charAt(NATURAL.indexOf(pitch + 1))}b`
    : `${LETTERS.charAt(NATURAL.indexOf(pitch - 1))}#`;
}

// Moves a chord from one key to another. The root and the bass move by the
// interval between the tonics, counted in letters and in semitones, so G to
// Bb moves C to Eb, and G# to Ab respells C# as Db. Where that would need a
// double sharp or flat, the plain spelling on the new key's side is used.
// The suffix stays.
export function transposeChord<T extends ChordSymbol>(
  chord: T,
  from: Key,
  to: Key,
): T {
  const start = parseNote(from.tonic);
  const end = parseNote(to.tonic);
  const letters = mod(end.letter - start.letter, 7);
  const semitones = mod(pitchOf(to.tonic) - pitchOf(from.tonic), 12);
  const flats = signature(to) < 0;

  function move(note: string): string {
    const { letter } = parseNote(note);
    const newLetter = mod(letter + letters, 7);
    const pitch = mod(pitchOf(note) + semitones, 12);
    // From -6 to 5: how far the pitch is from the new letter.
    const accidental = mod(pitch - (NATURAL[newLetter] ?? 0) + 6, 12) - 6;
    if (Math.abs(accidental) > 1) return plainSpelling(pitch, flats);
    const sign = accidental < 0 ? "b" : accidental > 0 ? "#" : "";
    return `${LETTERS.charAt(newLetter)}${sign}`;
  }

  const { bass, ...rest } = chord;
  const root = move(chord.root);
  const moved = bass === undefined ? undefined : move(bass);
  return {
    ...rest,
    root,
    ...(moved !== undefined && moved !== root ? { bass: moved } : {}),
  } as T;
}

// The chords of C major and A minor, in the key's order. The fifth of a
// minor key is minor in the scale, and often major, so both are listed.
const C_MAJOR: ChordSymbol[] = [
  { root: "C" },
  { root: "D", suffix: "m" },
  { root: "E", suffix: "m" },
  { root: "F" },
  { root: "G" },
  { root: "A", suffix: "m" },
  { root: "B", suffix: "dim" },
];
const A_MINOR: ChordSymbol[] = [
  { root: "A", suffix: "m" },
  { root: "B", suffix: "dim" },
  { root: "C" },
  { root: "D", suffix: "m" },
  { root: "E", suffix: "m" },
  { root: "E" },
  { root: "F" },
  { root: "G" },
];

// The chords of a key, in its order, spelled as the key spells them: F#dim
// in G, not Gbdim.
export function chordsOfKey(key: Key): ChordSymbol[] {
  const from: Key = key.minor
    ? { tonic: "A", minor: true }
    : { tonic: "C", minor: false };
  return (key.minor ? A_MINOR : C_MAJOR).map((chord) =>
    transposeChord(chord, from, key),
  );
}

type Quality = "major" | "minor" | "dim" | "any";

function qualityOf(chord: ChordSymbol): Quality {
  const suffix = chord.suffix ?? "";
  if (suffix.startsWith("dim")) return "dim";
  if (suffix.startsWith("m") && !suffix.startsWith("maj")) return "minor";
  // A power chord or a sus chord has no third.
  if (suffix === "5" || suffix.includes("sus")) return "any";
  return "major";
}

// The chords of a key: semitones from the tonic and the quality there.
const MAJOR_CHORDS: [number, Quality][] = [
  [0, "major"],
  [2, "minor"],
  [4, "minor"],
  [5, "major"],
  [7, "major"],
  [9, "minor"],
  [11, "dim"],
];
const MINOR_CHORDS: [number, Quality][] = [
  [0, "minor"],
  [2, "dim"],
  [3, "major"],
  [5, "minor"],
  // The fifth is minor in the scale, and often major.
  [7, "minor"],
  [7, "major"],
  [8, "major"],
  [10, "major"],
];

function fits(quality: Quality, wanted: Quality): boolean {
  return quality === "any" || quality === wanted;
}

// Guesses a sheet's key from its chords, in order, or returns null when
// there are none. The key that holds the most of the chords wins. A tie goes
// to the key whose tonic chord starts or ends the sheet, then to the one
// whose tonic chord comes most often, then to major.
// Only intervals are counted, so moving a sheet moves its guess with it.
// The tonic is spelled as the sheet spells it.
export function guessKey(chords: ChordSymbol[]): Key | null {
  if (chords.length === 0) return null;
  const pitches = chords.map((chord) => pitchOf(chord.root));
  const qualities = chords.map(qualityOf);

  let best: { pitch: number; minor: boolean } | null = null;
  let bestScore = [-1, -1, -1, -1];
  for (const minor of [false, true]) {
    const table = minor ? MINOR_CHORDS : MAJOR_CHORDS;
    const tonicQuality: Quality = minor ? "minor" : "major";
    for (let pitch = 0; pitch < 12; pitch++) {
      const isTonic = (i: number) =>
        pitches[i] === pitch && fits(qualities[i] ?? "major", tonicQuality);
      let fit = 0;
      let ends = 0;
      let tonics = 0;
      chords.forEach((_, i) => {
        const degree = mod((pitches[i] ?? 0) - pitch, 12);
        const quality = qualities[i] ?? "major";
        if (table.some(([d, q]) => d === degree && fits(quality, q))) fit++;
        if (isTonic(i)) tonics++;
      });
      if (isTonic(0)) ends++;
      if (isTonic(chords.length - 1)) ends++;
      const score = [fit, ends, tonics, minor ? 0 : 1];
      if (isBetter(score, bestScore)) {
        best = { pitch, minor };
        bestScore = score;
      }
    }
  }
  if (!best) return null;
  return {
    tonic: spellTonic(best.pitch, best.minor, chords),
    minor: best.minor,
  };
}

function isBetter(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

// The sheet's own spelling of the tonic: the one its chords use most.
// Without a chord on the tonic, the side the sheet's accidentals are on, or
// else the listed key.
function spellTonic(
  pitch: number,
  minor: boolean,
  chords: ChordSymbol[],
): string {
  const counts = new Map<string, number>();
  let sharps = 0;
  let flats = 0;
  for (const chord of chords) {
    if (chord.root.endsWith("#")) sharps++;
    if (chord.root.endsWith("b")) flats++;
    if (pitchOf(chord.root) === pitch) {
      counts.set(chord.root, (counts.get(chord.root) ?? 0) + 1);
    }
  }
  const used = [...counts].sort((a, b) => b[1] - a[1])[0];
  if (used) return used[0];
  if (sharps !== flats) return plainSpelling(pitch, flats > sharps);
  return listedTonic(pitch, minor);
}
