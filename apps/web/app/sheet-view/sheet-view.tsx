import "./sheet-view.css";

import type { ChordSheet } from "chordsheet";
import type { CSSProperties } from "react";

import {
  CHORD_SIZE,
  CHORD_SPACE,
  type LaidOutLine,
  layoutSheet,
  type Piece,
} from "./layout";
import { lyricsFontWidths } from "./widths";

// A sheet to read or print, with chords above the lyrics. It is plain HTML
// and CSS, laid out on the server, so it needs no JavaScript and the browser
// can wrap it to any width, also on paper. See openspec/specs/sheet-view.
export function SheetView({
  sheet,
  fontSize,
  lyricsOnly = false,
}: {
  sheet: ChordSheet;
  // The lyrics' size as a CSS length, such as "24px". Every other size
  // follows it. Without it, the view takes the app's lyrics size.
  fontSize?: string;
  // Only the labels and the lyrics, without chords or chord rows.
  lyricsOnly?: boolean;
}) {
  // The sizes the layout's widths were worked out for.
  const sizes = {
    "--sheet-view-chord-size": `${String(CHORD_SIZE)}em`,
    "--sheet-view-chord-space": `${String(round(CHORD_SPACE / CHORD_SIZE))}em`,
    ...(fontSize ? { "--sheet-view-font-size": fontSize } : {}),
  } as CSSProperties;
  if (lyricsOnly) {
    return (
      <div className="sheet-view is-lyrics-only" style={sizes}>
        {lyricsOf(sheet).map((section, i) => (
          <section className="sheet-view-section" key={i}>
            <div className="sheet-view-label">{section.label}</div>
            {section.lines.map((text, j) => (
              <p className="sheet-view-line sheet-view-lyrics-line" key={j}>
                {text}
              </p>
            ))}
          </section>
        ))}
      </div>
    );
  }
  return (
    <div className="sheet-view" style={sizes}>
      {layoutSheet(sheet, lyricsFontWidths).map((section, i) => (
        <section className="sheet-view-section" key={i}>
          <div className="sheet-view-label">{section.label}</div>
          {section.lines.map((line, j) => (
            <SheetLine line={line} key={j} />
          ))}
        </section>
      ))}
    </div>
  );
}

// Each section's lyrics, without lines of chords only, and without the
// sections that only had such lines.
function lyricsOf(sheet: ChordSheet) {
  return sheet.sections
    .map((section) => ({
      label: section.label ?? null,
      lines: section.lines
        .map((line) => line.text)
        .filter((text) => text.trim() !== ""),
    }))
    .filter((section) => section.lines.length > 0);
}

function SheetLine({ line }: { line: LaidOutLine }) {
  return (
    <p
      className={
        line.chordsOnly ? "sheet-view-line is-chords-only" : "sheet-view-line"
      }
    >
      {line.units.map((unit, i) => (
        <span className="sheet-view-unit" key={i}>
          {unit.map((piece, j) => (
            <SheetPiece piece={piece} key={j} />
          ))}
        </span>
      ))}
    </p>
  );
}

function SheetPiece({ piece }: { piece: Piece }) {
  return (
    <span
      className={piece.dash ? "sheet-view-piece has-dash" : "sheet-view-piece"}
      style={
        piece.minWidth ? { minWidth: `${String(piece.minWidth)}em` } : undefined
      }
    >
      <span className="sheet-view-chords">
        {piece.chords.map((chord, i) => (
          <span className="sheet-view-chord" key={i}>
            {chord}
          </span>
        ))}
      </span>
      <span className="sheet-view-lyrics">
        <span className="sheet-view-text">{piece.text}</span>
        {/* Only chords make room after the text. */}
        {piece.chords.length > 0 && <span className="sheet-view-dash" />}
      </span>
    </span>
  );
}

function round(em: number): number {
  return Math.round(em * 10000) / 10000;
}
