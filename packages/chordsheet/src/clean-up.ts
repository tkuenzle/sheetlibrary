import { isBlank } from "./check";
import type { Line, Section } from "./sheet";

// Cleans up a section after editing by dropping its empty lines. Returns
// undefined when no line is left, meaning the section is removed.
export function cleanUpSection(section: Section): Section | undefined {
  const lines = section.lines.filter((line) => !isEmpty(line));
  return lines.length > 0 ? { ...section, lines } : undefined;
}

function isEmpty(line: Line): boolean {
  return line.chords.length === 0 && isBlank(line.text);
}
