import "./sample-sheet.css";

import type { ChordSheet } from "chordsheet";

import { seedSong } from "../editor/seed-song";
import { SheetView } from "../sheet-view/sheet-view";

// The tilted sheet on the home page: the seed song's first section, in the
// sheet view.
export const sampleSheet: ChordSheet = {
  ...seedSong,
  sections: seedSong.sections.slice(0, 1),
};

export function SampleSheet() {
  return (
    <div className="sample-sheet" aria-hidden="true">
      <div className="sample-sheet-title">Amazing Grace</div>
      <SheetView sheet={sampleSheet} />
    </div>
  );
}
