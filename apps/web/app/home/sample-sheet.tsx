import "./sample-sheet.css";

import { type ChordSheet, stepKey, transposeSheet } from "chordsheet";

import { CapoButton } from "../editor/capo-button";
import { KeyButton } from "../editor/key-button";
import { seedSong } from "../editor/seed-song";
import { useSheetKey } from "../editor/sheet-title";
import { SheetView } from "../sheet-view/sheet-view";

// The sample sheet on the home page: the seed song's first section, which
// can be shown in another key or with a capo, as on the play view. Nothing
// is saved, and the address stays as it is. See openspec/specs/home-page.
export const sampleSheet: ChordSheet = {
  ...seedSong,
  sections: seedSong.sections.slice(0, 1),
};

export function SampleSheet() {
  const { key, guessed, guess, shown, capo, drawn, show, setCapo } =
    useSheetKey(sampleSheet, null, null, null, { inAddress: false });
  const current = shown ?? key;
  const content =
    key && drawn ? transposeSheet(sampleSheet, key, drawn) : sampleSheet;

  return (
    <section className="sample-sheet" aria-label="Sample sheet">
      <div className="sample-sheet-heading">
        <h2>Amazing Grace</h2>
        <p className="sample-sheet-artist">John Newton</p>
        {key && current && (
          <div className="sample-sheet-chips">
            <KeyButton
              current={current}
              song={key}
              guessed={guessed}
              guess={guess}
              viewOnly
              onPick={(to) => {
                show(to);
              }}
              onStep={(step) => {
                show(stepKey(current, step));
              }}
              onBack={() => {
                show(null);
              }}
            />
            <CapoButton sounding={current} capo={capo} onPick={setCapo} />
          </div>
        )}
      </div>
      <SheetView sheet={content} />
    </section>
  );
}
