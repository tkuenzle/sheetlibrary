import { type ReactElement, ViewTransition } from "react";

import { moveTitle, useAnnouncedMove } from "./page-moves";

// A sheet's title, on a row or as the sheet's heading, which moves between
// the two when a sheet rises or drops (see `titleName` and
// `headingTitleName`). Its shared class is set while a rise or a drop is
// announced, so the leaving title, which React reads from its last render,
// has it too. In any other commit, such as the sheet's data showing, it has
// none. The classes give the title's pictures the move's duration
// (page-moves.css).
export function TitleMove({
  name,
  children,
}: {
  name: string | undefined;
  children: ReactElement;
}) {
  const kind = useAnnouncedMove()?.kind;
  const share =
    kind === "rise" ? "title-rise" : kind === "drop" ? "title-drop" : "none";
  return (
    <ViewTransition
      name={name}
      default="none"
      share={share}
      onShare={(instance) => {
        moveTitle(instance, kind === "drop" ? "drop" : "rise");
      }}
    >
      {children}
    </ViewTransition>
  );
}
