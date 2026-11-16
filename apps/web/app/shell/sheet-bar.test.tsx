import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { sheetMenuItems } from "../sheets/sheet-menu";
import { SheetBar } from "./sheet-bar";
import { SignedInContext } from "./signed-in";
import { ViewButton } from "./view-button";

const noop = () => undefined;
const menu = sheetMenuItems({ onChoose: noop, onDelete: noop });

function render(bar: ReactNode) {
  const Stub = createRoutesStub([
    {
      path: "/sheets/:id",
      Component: () => (
        <SignedInContext value={{ initial: "A" }}>{bar}</SignedInContext>
      ),
    },
  ]);
  return renderToString(<Stub initialEntries={["/sheets/abc"]} />);
}

describe("SheetBar", () => {
  describe("play", () => {
    const html = render(
      <SheetBar
        mode="play"
        onBack={noop}
        editTo="/sheets/abc/edit?key=A&capo=2"
        view={
          <ViewButton step={0} onResize={noop} lyrics={false} onLyrics={noop} />
        }
        menu={menu}
      />,
    );

    // Scenario "On a wide screen" (play-page).
    it("holds Back, View, Edit and the menu, in that order", () => {
      const names = [
        ...html.matchAll(
          /<(?:a|button) [^>]*aria-label="(Back|View|Edit|More for this sheet)"/g,
        ),
      ].map((m) => m[1]);
      expect(names).toEqual(["Back", "View", "Edit", "More for this sheet"]);
    });

    // Scenario "Opened from a link" (site-layout): without JavaScript, or
    // before it, Back is a link to Sheets.
    it("makes Back a link to Sheets", () => {
      expect(html).toMatch(/<a [^>]*href="\/sheets"[^>]*aria-label="Back"/);
    });

    // Scenario "From playing to editing".
    it("links Edit to edit mode with the key and the capo", () => {
      expect(html).toContain('href="/sheets/abc/edit?key=A&amp;capo=2"');
    });

    // Scenarios "No title in the bar" and "On a sheet" (site-layout).
    it("has no site's name and no account", () => {
      expect(html).not.toContain("Sheet Library");
      expect(html).not.toContain('aria-label="Account"');
      expect(html).not.toContain("Sign in");
    });
  });

  describe("edit", () => {
    const html = render(
      <SheetBar
        mode="edit"
        onDone={noop}
        status={<p className="save-status">Saved</p>}
        help={<button type="button">How to edit</button>}
        menu={menu}
      />,
    );

    // Scenario "Opening edit mode" (sheet-page).
    it("holds Done, the save state, the help and the menu", () => {
      expect(html).toMatch(
        /Done<\/button><p class="save-status">Saved<\/p>.*How to edit.*aria-label="More for this sheet"/,
      );
    });

    it("has no Back, Edit, account or site's name", () => {
      expect(html).not.toContain('aria-label="Back"');
      expect(html).not.toContain('aria-label="Edit"');
      expect(html).not.toContain('aria-label="Account"');
      expect(html).not.toContain("Sheet Library");
    });
  });
});
