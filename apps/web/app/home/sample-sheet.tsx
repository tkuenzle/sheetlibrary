import "./sample-sheet.css";

import type { Line } from "chordsheet";

import { seedSong } from "../editor/seed-song";

// The tilted sheet on the home page: the seed song's first lines, chords
// above the lyrics. Static markup, not the editor's chord layer, so it only
// takes lines where the two lay out the same: one chord per spot, none on a
// space. Issue #23 replaces it with a read-only view from chord-editor.
export const sampleLines = seedSong.sections[0]?.lines.slice(0, 3) ?? [];

// A line as pieces of lyrics, each with the chord above its start.
export function pieces(line: Line) {
  const starts = [0, ...line.chords.map((chord) => chord.at)];
  return starts
    .map((start, i) => ({
      chord: i === 0 ? "" : (line.chords[i - 1]?.chord ?? ""),
      text: line.text.slice(start, starts[i + 1]),
    }))
    .filter((piece) => piece.text !== "");
}

export function SampleSheet() {
  return (
    <div className="sample-sheet" aria-hidden="true">
      <div className="sample-sheet-title">
        <span className="sample-sheet-badge">1</span>
        Amazing Grace
      </div>
      {sampleLines.map((line) => (
        <div className="sample-sheet-line" key={line.text}>
          {pieces(line).map((piece, i) => (
            <span className="sample-sheet-piece" key={i}>
              <span className="sample-sheet-chord">{piece.chord}</span>
              {piece.text}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
