import "./versions-part.css";

import { type Key, sameKey } from "chordsheet";
import { useEffect, useId, useRef } from "react";

import { keyName } from "../editor/key-button";
import { Button } from "../ui/button";
import { Menu, type MenuItem } from "../ui/menu";
import type { SheetVersion } from "./versions";

// A version as the list shows it: its name, and the key it shows the sheet
// in, worked out for the song key (see versionKey in chordsheet).
export interface ListedVersion extends SheetVersion {
  shows: Key;
}

// The top of the play view's key panel. Without versions, it is the song key
// as before, with a "…" to save the first version. With versions, it lists
// "Song key" and each version, the open one marked and with its own "…", and
// ends with a way to save another. See openspec/specs/play-page.
export function VersionsPart({
  song,
  guessed,
  current,
  versions,
  openId,
  onOpen,
  onSave,
  onMake,
  onRename,
  onDelete,
}: {
  song: Key;
  guessed: boolean;
  // The key the sheet is shown in.
  current: Key;
  versions: ListedVersion[];
  // The open version, or null for the song key.
  openId: string | null;
  // Opens a version, or, with null, the song key.
  onOpen: (id: string | null) => void;
  onSave: () => void;
  onMake: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const headingId = useId();
  const list = useRef<HTMLUListElement>(null);
  // The panel opens with the open row in view, also at the end of a long
  // list. Only the list scrolls, not the page.
  useEffect(() => {
    const box = list.current;
    const row = box?.querySelector<HTMLElement>("[data-open]");
    if (!box || !row) return;
    const below = row.offsetTop + row.offsetHeight - box.clientHeight;
    if (below > box.scrollTop) box.scrollTop = below;
  }, []);
  const save: MenuItem = {
    label: saveLabel(current),
    icon: "add",
    onSelect: onSave,
  };

  if (versions.length === 0) {
    return (
      <section className="key-panel-song" aria-labelledby={headingId}>
        <div className="key-panel-header">
          <h2 id={headingId}>Song key</h2>
          <p className="key-panel-song-key">{keyName(song)}</p>
          {guessed && <p>Guessed from the chords</p>}
        </div>
        <div className="versions-song-more">
          <Menu label="Song key: more" items={[save]} />
        </div>
      </section>
    );
  }

  const open = versions.find((version) => version.id === openId);
  const versionItems = open
    ? openVersionItems({ current, open, onMake, onRename, onDelete })
    : [];

  return (
    <section className="versions" aria-labelledby={headingId}>
      <h2 id={headingId}>Versions</h2>
      <ul className="versions-list" ref={list}>
        <li className="versions-row" data-open={!open || undefined}>
          <button
            type="button"
            className="versions-pick"
            aria-current={!open || undefined}
            onClick={() => {
              onOpen(null);
            }}
          >
            <span className="versions-name">
              Song key
              {guessed && (
                <span className="versions-note">Guessed from the chords</span>
              )}
            </span>
            <span className="versions-key">{keyName(song)}</span>
          </button>
        </li>
        {versions.map((version) => {
          const isOpen = version.id === open?.id;
          return (
            <li
              key={version.id}
              className="versions-row"
              data-open={isOpen || undefined}
            >
              <button
                type="button"
                className="versions-pick"
                aria-current={isOpen || undefined}
                onClick={() => {
                  onOpen(version.id);
                }}
              >
                <span className="versions-name">{version.name}</span>
                <span className="versions-key">{keyName(version.shows)}</span>
              </button>
              {isOpen && (
                <Menu
                  label={`${version.name}: more`}
                  items={versionItems}
                  fixed
                />
              )}
            </li>
          );
        })}
      </ul>
      <Button
        variant="text"
        size="small"
        icon="add"
        className="versions-save"
        onClick={onSave}
      >
        {save.label}
      </Button>
    </section>
  );
}

// The way to save a version, named for the key the sheet is shown in.
export function saveLabel(current: Key): string {
  return `Save ${keyName(current)} as a version…`;
}

// The open version's menu: "Make Bb Anna's key" while the sheet is shown in
// another key than the version's, then "Rename…" and "Delete…".
export function openVersionItems({
  current,
  open,
  onMake,
  onRename,
  onDelete,
}: {
  current: Key;
  open: ListedVersion;
  onMake: () => void;
  onRename: () => void;
  onDelete: () => void;
}): MenuItem[] {
  const make: MenuItem[] = sameKey(current, open.shows)
    ? []
    : [
        {
          label: `Make ${keyName(current)} ${open.name}`,
          icon: "check",
          separated: true,
          onSelect: onMake,
        },
      ];
  return [
    ...make,
    { label: "Rename…", icon: "edit", onSelect: onRename },
    { label: "Delete…", icon: "delete", onSelect: onDelete },
  ];
}
