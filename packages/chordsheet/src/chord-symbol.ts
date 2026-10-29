// Chord symbols: typed chord text read into a root, a suffix and a bass, and
// written back in the chord's one canonical form.

export interface ChordSymbol {
  // A spelled note: a letter from A to G and an optional "#" or "b".
  root: string;
  // The canonical suffix, such as "m7b5". Left out for a major triad.
  suffix?: string;
  // A spelled note, never the same as the root. Left out when there is none.
  bass?: string;
}

// A suffix is read as parts in this order. Each part has one canonical
// spelling, which is what `writeChord` puts out.
type Quality = "" | "m" | "dim" | "aug" | "5";
type Seventh = "" | "6" | "7" | "maj7";
type Extension = "" | "9" | "11" | "13";
type Sus = "" | "sus2" | "sus4";
const ALTERATIONS = ["b5", "#5", "b9", "#9", "#11", "b13"] as const;
const ADDED = ["add9", "add11"] as const;
type Alteration = (typeof ALTERATIONS)[number];
type Added = (typeof ADDED)[number];

interface Parts {
  quality: Quality;
  seventh: Seventh;
  extension: Extension;
  sus: Sus;
  alterations: Alteration[];
  added: Added[];
  // "maj" in "maj9" only names the seventh when an extension follows.
  needsExtension: boolean;
}

// What an alias sets. A part that is already set to something else makes
// the reading fail, so "Cmdim" is not a chord.
type Change = Partial<Omit<Parts, "alterations" | "added">> & {
  alterations?: Alteration[];
  added?: Added[];
};

interface Alias {
  text: string;
  change: Change;
}

interface Slot {
  aliases: Alias[];
  // Alterations and added notes can come more than once.
  repeats: boolean;
}

function slot(repeats: boolean, entries: [Change, string[]][]): Slot {
  const aliases = entries.flatMap(([change, texts]) =>
    texts.map((text) => ({ text, change })),
  );
  // The longest alias first, so "sus4" wins over "sus". The sort is stable,
  // so among aliases of the same length the one listed first is tried first.
  aliases.sort((a, b) => b.text.length - a.text.length);
  return { aliases, repeats };
}

const SLOTS: Slot[] = [
  slot(false, [
    [{ quality: "m" }, ["m", "mi", "min", "-"]],
    [{ quality: "dim" }, ["dim", "°", "o"]],
    [{ quality: "aug" }, ["aug", "+", "+5"]],
    [{ quality: "5" }, ["5"]],
    [{ quality: "m", seventh: "7", alterations: ["b5"] }, ["ø", "Ø"]],
  ]),
  slot(false, [
    [{ seventh: "6" }, ["6"]],
    // A 9 right after a 6 is an added note, not an extension.
    [{ seventh: "6", added: ["add9"] }, ["69", "6/9"]],
    [{ seventh: "7" }, ["7"]],
    [{ seventh: "maj7" }, ["maj7", "Maj7", "ma7", "M7", "Δ7", "Δ"]],
    [{ seventh: "maj7", needsExtension: true }, ["maj", "Maj", "ma", "M", "Δ"]],
  ]),
  slot(false, [
    [{ extension: "9" }, ["9"]],
    [{ extension: "11" }, ["11"]],
    [{ extension: "13" }, ["13"]],
  ]),
  slot(false, [
    [{ sus: "sus4" }, ["sus4", "sus"]],
    [{ sus: "sus2" }, ["sus2"]],
  ]),
  slot(true, [
    [{ alterations: ["b5"] }, ["b5", "-5"]],
    [{ alterations: ["#5"] }, ["#5", "+5", "+"]],
    [{ alterations: ["b9"] }, ["b9", "-9"]],
    [{ alterations: ["#9"] }, ["#9", "+9"]],
    [{ alterations: ["#11"] }, ["#11", "+11"]],
    [{ alterations: ["b13"] }, ["b13", "-13"]],
  ]),
  slot(true, [
    [{ added: ["add9"] }, ["add9", "add2", "2"]],
    [{ added: ["add11"] }, ["add11"]],
  ]),
];

// Suffixes that only say "major".
const MAJOR = new Set(["maj", "Maj", "M", "major"]);

const NOTE = /^[A-G][#b]?$/;

export function isNote(text: string): boolean {
  return NOTE.test(text);
}

// Reads typed chord text, or returns null when it isn't a chord.
export function readChord(text: string): ChordSymbol | null {
  const typed = text.trim().replaceAll("♭", "b").replaceAll("♯", "#");
  // The last slash starts the bass, so "C6/9/E" is a 6/9 chord over E.
  const slash = /^(.*)\/([A-Ga-g][#b]?)$/.exec(typed);
  const head = slash?.[1] ?? typed;
  const bass = slash?.[2] ? spell(slash[2]) : undefined;
  const parts = /^([A-Ga-g][#b]?)(.*)$/.exec(head);
  if (!parts?.[1]) return null;
  const root = spell(parts[1]);
  const suffix = readSuffix(parts[2] ?? "");
  if (suffix === null) return null;
  return {
    root,
    ...(suffix ? { suffix } : {}),
    ...(bass && bass !== root ? { bass } : {}),
  };
}

export function writeChord(chord: ChordSymbol): string {
  const bass = chord.bass ? `/${chord.bass}` : "";
  return `${chord.root}${chord.suffix ?? ""}${bass}`;
}

// "bb" is B flat: the letter is upper case, the accidental stays.
function spell(note: string): string {
  return note.charAt(0).toUpperCase() + note.slice(1);
}

// The canonical suffix, "" for a major triad, or null when it isn't one.
function readSuffix(typed: string): string | null {
  // Brackets only group: "7(b9,#11)" is "7b9#11".
  const text = typed.replace(/\(([^()]*)\)/g, (_, inner: string) =>
    inner.replace(/[,\s]/g, ""),
  );
  if (MAJOR.has(text)) return "";
  return readSlots(text, 0, 0, {
    quality: "",
    seventh: "",
    extension: "",
    sus: "",
    alterations: [],
    added: [],
    needsExtension: false,
  });
}

// Tries the aliases of each slot in order, and goes back to try another
// when the rest of the text can't be read. "Cmaj7" first tries "m" as the
// quality, then finds "aj7" is nothing, and reads "maj7" instead.
function readSlots(
  text: string,
  at: number,
  index: number,
  parts: Parts,
): string | null {
  if (at === text.length) return canonical(parts);
  const current = SLOTS[index];
  if (!current) return null;
  for (const { text: alias, change } of current.aliases) {
    if (!text.startsWith(alias, at)) continue;
    const next = apply(parts, change);
    if (!next) continue;
    const found = readSlots(
      text,
      at + alias.length,
      current.repeats ? index : index + 1,
      next,
    );
    if (found !== null) return found;
  }
  return readSlots(text, at, index + 1, parts);
}

function apply(parts: Parts, change: Change): Parts | null {
  const next = { ...parts };
  for (const key of ["quality", "seventh", "extension", "sus"] as const) {
    const value = change[key];
    if (value === undefined) continue;
    if (parts[key] !== "" && parts[key] !== value) return null;
    (next as Record<typeof key, string>)[key] = value;
  }
  if (change.needsExtension) next.needsExtension = true;
  for (const alteration of change.alterations ?? []) {
    if (next.alterations.includes(alteration)) return null;
    next.alterations = [...next.alterations, alteration];
  }
  for (const added of change.added ?? []) {
    if (next.added.includes(added)) return null;
    next.added = [...next.added, added];
  }
  return next;
}

// Applies the rules that give each chord one form, then writes the parts in
// order, or returns null when they don't make a chord.
function canonical(parts: Parts): string | null {
  const { quality, sus, needsExtension } = parts;
  let { seventh, extension } = parts;
  const alterations = new Set(parts.alterations);
  const added = new Set(parts.added);
  const others =
    extension !== "" || sus !== "" || alterations.size > 0 || added.size > 0;

  if (needsExtension && extension === "") return null;
  // A power chord has nothing else.
  if (quality === "5") return seventh === "" && !others ? "5" : null;
  // dim goes alone or with 7. The seventh of dim7 is a bb7, which no
  // alteration can express.
  if (quality === "dim") {
    return (seventh === "" || seventh === "7") && !others
      ? `dim${seventh}`
      : null;
  }
  // sus takes the third's place.
  if (sus !== "" && quality !== "") return null;
  // A 6 has no seventh, so a 9 with it is added.
  if (seventh === "6" && extension !== "") {
    if (extension !== "9" || added.has("add9")) return null;
    extension = "";
    added.add("add9");
  }
  // 9, 11 and 13 hold the 9 already. With a seventh, add9 is the extension.
  if (added.has("add9") && seventh !== "6") {
    if (extension !== "") return null;
    if (seventh !== "") {
      added.delete("add9");
      extension = "9";
    }
  }
  if (added.has("add11") && (extension === "11" || extension === "13")) {
    return null;
  }
  // An extension holds the seventh.
  if (extension !== "" && seventh === "") seventh = "7";
  // aug is only for a chord without a 6, 7 or extension. With one, its
  // raised fifth is an alteration.
  let written: Quality = quality;
  if (quality === "aug" && seventh !== "") {
    written = "";
    alterations.add("#5");
  }
  // Alterations change a sixth, a seventh or an extension.
  if (alterations.size > 0 && seventh === "") return null;

  const body =
    extension === ""
      ? seventh
      : `${seventh === "maj7" ? "maj" : ""}${extension}`;
  return [
    written,
    body,
    sus,
    ...ALTERATIONS.filter((alteration) => alterations.has(alteration)),
    ...ADDED.filter((note) => added.has(note)),
  ].join("");
}
