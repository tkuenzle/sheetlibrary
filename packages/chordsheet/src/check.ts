import { FORMAT, LABEL_MAX, VERSION } from "./sheet";

// A broken rule and where it is: indexes into sections, their lines and the
// lines' chords. Problems with the whole sheet have no location.
export interface Problem {
  message: string;
  section?: number;
  line?: number;
  chord?: number;
}

type LineProblem = Omit<Problem, "section" | "line">;

// Checks content, for example loaded JSON, against the model's rules and
// returns every problem found. An empty list means the content is a valid
// ChordSheet.
export function checkSheet(content: unknown): Problem[] {
  if (!isRecord(content)) return [{ message: "Content is not an object" }];
  if (content.format !== FORMAT) {
    return [{ message: `Format is not "${FORMAT}"` }];
  }
  // The rules below belong to this version, so other versions stop here.
  if (content.version !== VERSION) {
    return [{ message: `Unknown version: ${JSON.stringify(content.version)}` }];
  }
  if (!Array.isArray(content.sections)) {
    return [{ message: "Sections are not a list" }];
  }
  const problems: Problem[] = [];
  (content.sections as unknown[]).forEach((section, s) => {
    if (!isRecord(section) || !Array.isArray(section.lines)) {
      problems.push({ message: "Section has no list of lines", section: s });
      return;
    }
    if (section.lines.length === 0) {
      problems.push({ message: "Section has no lines", section: s });
    }
    if (section.label !== undefined) {
      for (const message of checkLabel(section.label)) {
        problems.push({ message, section: s });
      }
    }
    (section.lines as unknown[]).forEach((line, l) => {
      for (const problem of checkLine(line)) {
        problems.push({ ...problem, section: s, line: l });
      }
    });
  });
  return problems;
}

function checkLabel(label: unknown): string[] {
  if (typeof label !== "string") return ["Section label is not text"];
  const problems: string[] = [];
  if (hasLineBreak(label)) problems.push("Section label has a line break");
  if (isBlank(label)) problems.push("Section label is empty");
  if (label.length > LABEL_MAX) {
    problems.push(
      `Section label is longer than ${String(LABEL_MAX)} characters`,
    );
  }
  return problems;
}

function checkLine(line: unknown): LineProblem[] {
  if (
    !isRecord(line) ||
    typeof line.text !== "string" ||
    !Array.isArray(line.chords)
  ) {
    return [{ message: "Line has no text or no list of chords" }];
  }
  const text = line.text;
  const chords = line.chords as unknown[];
  const problems: LineProblem[] = [];
  if (hasLineBreak(text)) {
    problems.push({ message: "Line text has a line break" });
  }
  if (chords.length === 0 && isBlank(text)) {
    problems.push({ message: "Line has no chords and no text" });
  }
  let previous = 0;
  chords.forEach((chord, c) => {
    if (
      !isRecord(chord) ||
      typeof chord.at !== "number" ||
      typeof chord.chord !== "string"
    ) {
      problems.push({ message: "Chord has no position or no text", chord: c });
      return;
    }
    const { at } = chord;
    if (chord.chord === "") {
      problems.push({ message: "Chord text is empty", chord: c });
    }
    if (hasLineBreak(chord.chord)) {
      problems.push({ message: "Chord text has a line break", chord: c });
    }
    if (!Number.isInteger(at) || at < 0 || at > text.length) {
      problems.push({
        message: "Chord position is outside the text",
        chord: c,
      });
      return;
    }
    if (splitsSurrogatePair(text, at)) {
      problems.push({ message: "Chord position splits a character", chord: c });
    }
    if (at < previous) {
      problems.push({ message: "Chords are not sorted by position", chord: c });
    }
    previous = at;
  });
  return problems;
}

// A line without chords must have a character that isn't a space.
export function isBlank(text: string): boolean {
  return text.trim() === "";
}

function hasLineBreak(text: string): boolean {
  return /[\r\n]/.test(text);
}

function splitsSurrogatePair(text: string, at: number): boolean {
  const before = text.charCodeAt(at - 1);
  const after = text.charCodeAt(at);
  return isHighSurrogate(before) && isLowSurrogate(after);
}

function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
