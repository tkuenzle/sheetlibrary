import "../app/app.css";

import { createRoot } from "react-dom/client";

import { seedSong } from "../app/editor/seed-song";
import { SheetView } from "../app/sheet-view/sheet-view";
import { awkwardSheet } from "../app/sheet-view/test-sheets";
import { lyricsFontWidths, widthOf } from "../app/sheet-view/widths";

// The page the sheet view's Playwright tests run against
// (e2e/sheet-view.spec.ts). Built with the editor's harness and never
// deployed. `?song=seed` shows the seed song instead of the awkward lines.

declare global {
  interface Window {
    // How wide the layout takes lyrics to be, in em, for the tests to
    // compare with what the browser draws.
    lyricsWidth: (text: string) => number;
  }
}
window.lyricsWidth = (text) => widthOf(text, 400, lyricsFontWidths);

const song = new URLSearchParams(location.search).get("song");
const root = document.getElementById("root");
if (!root) throw new Error("No #root element");
createRoot(root).render(
  <main style={{ padding: "0 16px" }}>
    <SheetView sheet={song === "seed" ? seedSong : awkwardSheet} />
  </main>,
);
