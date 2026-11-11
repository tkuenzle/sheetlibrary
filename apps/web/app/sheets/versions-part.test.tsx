import type { Key } from "chordsheet";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  type ListedVersion,
  openVersionItems,
  saveLabel,
  VersionsPart,
} from "./versions-part";

// See openspec/specs/play-page.

function nothing() {
  return undefined;
}

const major = (tonic: string): Key => ({ tonic, minor: false });

const anna: ListedVersion = {
  id: "anna12345678",
  name: "Anna's key",
  key: "A",
  shows: major("A"),
};
const band: ListedVersion = {
  id: "band12345678",
  name: "Sunday band",
  key: "Bb",
  shows: major("Bb"),
};

function part(
  versions: ListedVersion[],
  openId: string | null,
  current: Key = major("A"),
) {
  return renderToString(
    <VersionsPart
      song={major("G")}
      guessed
      current={current}
      versions={versions}
      openId={openId}
      onOpen={nothing}
      onSave={nothing}
      onMake={nothing}
      onRename={nothing}
      onDelete={nothing}
    />,
  );
}

// The rows' names and keys, in order.
function rows(html: string) {
  return [
    ...html.matchAll(
      /class="versions-name">(.*?)<\/span>.*?class="versions-key">([^<]+)</g,
    ),
  ].map((match) => `${(match[1] ?? "").replace(/<.*/, "")} ${match[2] ?? ""}`);
}

describe("VersionsPart", () => {
  // Scenario "No versions yet".
  it("shows the song key with a menu to save the first version", () => {
    const html = part([], null);
    expect(html).toContain("<h2");
    expect(html).toContain(">Song key</h2>");
    expect(html).toContain('aria-label="Song key: more"');
    expect(html).not.toContain("versions-list");
    expect(saveLabel(major("A"))).toBe("Save A as a version…");
  });

  // Scenario "Two versions".
  it("lists the song key and each version, and marks the song key", () => {
    const html = part([anna, band], null);
    expect(html).toContain(">Versions</h2>");
    expect(rows(html)).toEqual([
      "Song key G",
      "Anna&#x27;s key A",
      "Sunday band Bb",
    ]);
    expect(html).toMatch(
      /aria-current="true"[^>]*><span class="versions-name">Song key/,
    );
    expect(html).toMatch(
      /versions-save".*<\/svg>Save A as a version…<\/button>/s,
    );
  });

  it("marks the open version, with its menu on its row only", () => {
    const html = part([anna, band], anna.id);
    expect(html).toMatch(
      /aria-current="true"[^>]*><span class="versions-name">Anna&#x27;s key/,
    );
    expect(html).toContain('aria-label="Anna&#x27;s key: more"');
    expect(html).not.toContain('aria-label="Sunday band: more"');
  });
});

describe("the open version's menu", () => {
  const labels = (current: Key) =>
    openVersionItems({
      current,
      open: anna,
      onMake: nothing,
      onRename: nothing,
      onDelete: nothing,
    }).map((item) => item.label);

  // Scenario "In the version's key".
  it("holds only Rename and Delete in the version's key", () => {
    expect(labels(major("A"))).toEqual(["Rename…", "Delete…"]);
  });

  // Scenario "Anna sings higher".
  it("offers to make the shown key the version's", () => {
    expect(labels(major("Bb"))).toEqual([
      "Make Bb Anna's key",
      "Rename…",
      "Delete…",
    ]);
  });
});
