import "./play-edit-switch.css";

import { Icon } from "../ui/icon";

// The switch between a sheet's two pages, after "Library" in the top bar:
// "Play" at /sheets/:id and "Edit" at /sheets/:id/edit, with the current one
// marked. Both are links that load the page in full, so the editor can warn
// before unsaved edits go. `query` carries the key and the capo shown now.
// On a phone, only the icons show. See openspec/specs/site-layout.
export function PlayEditSwitch({
  id,
  current,
  query = "",
}: {
  id: string;
  current: "play" | "edit";
  // Such as "key=A&capo=2", or empty.
  query?: string;
}) {
  const search = query ? `?${query}` : "";
  return (
    <nav className="play-edit-switch" aria-label="Play or edit">
      <a
        className="play-edit-switch-link"
        href={`/sheets/${id}${search}`}
        aria-label="Play"
        aria-current={current === "play" ? "page" : undefined}
      >
        <Icon name="playArrow" size={20} />
        <span className="play-edit-switch-text">Play</span>
      </a>
      <a
        className="play-edit-switch-link"
        href={`/sheets/${id}/edit${search}`}
        aria-label="Edit"
        aria-current={current === "edit" ? "page" : undefined}
      >
        <Icon name="edit" size={20} />
        <span className="play-edit-switch-text">Edit</span>
      </a>
    </nav>
  );
}
