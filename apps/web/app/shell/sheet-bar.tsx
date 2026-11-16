import "./top-bar.css";
import "./sheet-bar.css";

import type { MouseEvent, ReactNode } from "react";
import { Link } from "react-router";

import {
  backFromPlay,
  fromPlayState,
  useSheetMoves,
} from "../sheets/sheet-moves";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Menu, type MenuItem } from "../ui/menu";
import { Tooltip } from "../ui/tooltip";

// The top bar on a sheet, in its two modes, the same at every width. See
// openspec/specs/site-layout and the play-page and sheet-page specs.
//
//   play:  [<-]                       [View] [Edit] [:]
//   edit:  [Done] Saved                   [?] [:]
//   frame: [<-]                          (a sheet that can't be shown)
//
// It shows no account and no site's name: a sheet is for playing, and the
// shell is one Back away.
export type SheetBarProps =
  | { mode: "frame"; onBack: () => void }
  | {
      mode: "play";
      // Called on Back, unless the link is opened another way, such as in a
      // new tab. Without JavaScript, Back is a link to Sheets.
      onBack: () => void;
      // Edit mode's address, with the key and the capo shown now.
      editTo: string;
      view: ReactNode;
      menu: MenuItem[];
    }
  | {
      mode: "edit";
      onDone: () => void;
      // The save state, after Done.
      status: ReactNode;
      help: ReactNode;
      menu: MenuItem[];
    };

const menuLabel = "More for this sheet";

export function SheetBar(props: SheetBarProps) {
  if (props.mode === "edit") {
    return (
      <header className="top-bar sheet-bar sheet-bar-edit">
        <Button icon="check" className="sheet-bar-done" onClick={props.onDone}>
          Done
        </Button>
        {props.status}
        <div className="top-bar-actions">
          {props.help}
          <Menu label={menuLabel} items={props.menu} />
        </div>
      </header>
    );
  }
  const back = (
    <Tooltip text="Back">
      <a
        className="button icon-button icon-button-standard sheet-bar-back"
        href="/sheets"
        aria-label="Back"
        onClick={(event) => {
          if (opensElsewhere(event)) return;
          event.preventDefault();
          props.onBack();
        }}
      >
        <Icon name="arrowBack" />
      </a>
    </Tooltip>
  );
  if (props.mode === "frame") {
    return <header className="top-bar sheet-bar">{back}</header>;
  }
  return (
    <header className="top-bar sheet-bar">
      {back}
      <div className="top-bar-actions">
        {props.view}
        <Link
          className="button button-tonal sheet-bar-edit-link"
          to={props.editTo}
          state={fromPlayState}
          aria-label="Edit"
        >
          <Icon name="edit" />
          <span className="sheet-bar-edit-text">Edit</span>
        </Link>
        <Menu label={menuLabel} items={props.menu} />
      </div>
    </header>
  );
}

// The top bar of a sheet that can't be shown, in either mode: only Back.
export function SheetFrameBar() {
  const moves = useSheetMoves();
  return (
    <SheetBar
      mode="frame"
      onBack={() => void moves.go(backFromPlay(moves.history()))}
    />
  );
}

// Puts the focus back on the sheet's menu button, as after a dialog that one
// of its items opened, since the item itself is gone.
export function focusSheetMenu(): void {
  document
    .querySelector<HTMLElement>(".sheet-bar [aria-haspopup=menu]")
    ?.focus();
}

// A click that asks for a new tab or window, which the browser handles.
function opensElsewhere(event: MouseEvent) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}
