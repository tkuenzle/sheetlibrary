import "./recent-sheets.css";

import { Link, useFetcher } from "react-router";

import { openedFrom, titleName } from "../shell/page-moves";
import { TitleMove } from "../shell/title-move";
import { Bar } from "../ui/skeleton";
import { KeyText, type ListSheet, type RowAnswer, rowKey } from "./sheet-list";

// "Recent" on Sheets: the sheets the person opened last, as cards that open
// them to play. A card has no menu. See openspec/specs/library-page.
export function RecentSheets({ sheets }: { sheets: ListSheet[] }) {
  if (sheets.length === 0) return null;
  return (
    <section className="recent-sheets" aria-labelledby="recent-sheets">
      <h2 id="recent-sheets">Recent</h2>
      <ul>
        {sheets.map((sheet) => (
          <RecentCard key={sheet.id} sheet={sheet} />
        ))}
      </ul>
    </section>
  );
}

// A sheet's card. It goes with the sheet's row when that is deleted, and
// comes back with it if the delete doesn't get through.
function RecentCard({ sheet }: { sheet: ListSheet }) {
  const fetcher = useFetcher<RowAnswer>({ key: rowKey(sheet.id) });
  if (fetcher.state !== "idle" || fetcher.data?.ok === true) return null;
  return (
    <li>
      <Link to={`/sheets/${sheet.id}`} state={openedFrom("recent", sheet)}>
        <TitleMove name={titleName("recent", sheet.id)}>
          <span className="recent-sheets-title">{sheet.title}</span>
        </TitleMove>
        {sheet.artist && <span>{sheet.artist}</span>}
        {sheet.key && (
          <span className="recent-sheets-key">
            <KeyText text={sheet.key} />
          </span>
        )}
      </Link>
    </li>
  );
}

// Widths in `em` for the bars of the cards while they load.
const CARD_WIDTHS = [
  [7, 8],
  [6, 5],
  [9, 3],
  [8, 4],
];

// "Recent" while the sheets are on their way: four cards with bars for the
// title, the artist and the key, as on the canvas board "Sheets, loading".
export function RecentSheetsSkeleton() {
  return (
    <section className="recent-sheets" aria-labelledby="recent-sheets">
      <h2 id="recent-sheets">Recent</h2>
      <ul aria-busy="true" aria-hidden="true">
        {CARD_WIDTHS.map(([title = 7, artist = 5], i) => (
          <li key={i}>
            <div className="recent-sheets-skeleton">
              <span className="recent-sheets-title">
                <Bar width={title} />
              </span>
              <span>
                <Bar width={artist} />
              </span>
              <span className="recent-sheets-key">
                <Bar width={1.6} accent />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
