import { type ReactElement, ViewTransition } from "react";

import { moveTitle } from "./page-moves";

// A sheet's title, on a row or as the sheet's heading, which moves between
// the two when a sheet rises or drops (see `titleName` and
// `headingTitleName`). In any other move it stays with its page. The
// classes give the title's pictures the move's duration (page-moves.css).
export function TitleMove({
  name,
  children,
}: {
  name: string | undefined;
  children: ReactElement;
}) {
  return (
    <ViewTransition
      name={name}
      default="none"
      share={{ rise: "title-rise", drop: "title-drop", default: "none" }}
      onShare={(instance, types) => {
        moveTitle(instance, types.includes("drop") ? "drop" : "rise");
      }}
    >
      {children}
    </ViewTransition>
  );
}
