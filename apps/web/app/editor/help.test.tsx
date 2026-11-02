import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EditorHelp } from "./help";

describe("EditorHelp", () => {
  it("says how to rename only when asked to", () => {
    expect(renderToString(<EditorHelp rename />)).toContain(
      "Click the title to rename the sheet",
    );
    expect(renderToString(<EditorHelp />)).not.toContain("rename");
  });
});
