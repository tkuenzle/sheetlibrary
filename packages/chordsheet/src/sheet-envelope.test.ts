import { describe, expect, it } from "vitest";

import { checkEnvelope, newSheetId, type Sheet } from "./sheet-envelope";
import { line, section, sheet } from "./test-helpers";

function envelope(fields: Partial<Record<keyof Sheet, unknown>> = {}) {
  return {
    id: "k3X9vQ2mLp7a",
    revision: 1,
    title: "Amazing Grace",
    content: sheet(section(line("Amazing grace", [0, "G"]))),
    ...fields,
  };
}

describe("Sheet envelope", () => {
  it("accepts a sheet without an artist", () => {
    expect(checkEnvelope(envelope())).toEqual([]);
  });

  it("accepts a sheet with an artist", () => {
    expect(checkEnvelope(envelope({ artist: "Chris Tomlin" }))).toEqual([]);
  });

  it("rejects a value that isn't an object", () => {
    expect(checkEnvelope("Amazing Grace")).toEqual([
      { message: "Sheet is not an object" },
    ]);
  });
});

describe("Title and artist", () => {
  it("reports a missing title", () => {
    expect(checkEnvelope(envelope({ title: undefined }))).toEqual([
      { message: "Sheet has no title", field: "title" },
    ]);
  });

  it("reports a title or an artist that isn't text", () => {
    expect(checkEnvelope(envelope({ title: 7, artist: ["Oasis"] }))).toEqual([
      { message: "Title is not text", field: "title" },
      { message: "Artist is not text", field: "artist" },
    ]);
  });
});

describe("Revision", () => {
  it("reports a revision that isn't a whole number", () => {
    for (const revision of [2.5, -1, "3", undefined]) {
      expect(checkEnvelope(envelope({ revision }))).toEqual([
        { message: "Revision is not a whole number", field: "revision" },
      ]);
    }
  });
});

describe("Sheet id", () => {
  it("makes new ids at random", () => {
    const first = newSheetId();
    const second = newSheetId();
    expect(first).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(second).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(first).not.toBe(second);
  });

  it("accepts the ids it makes", () => {
    expect(checkEnvelope(envelope({ id: newSheetId() }))).toEqual([]);
  });

  it("reports an id with a slash, or of the wrong length", () => {
    for (const id of ["abc/def12345", "abc", "k3X9vQ2mLp7a0", 12]) {
      expect(checkEnvelope(envelope({ id }))).toEqual([
        { message: "Id is not a sheet id", field: "id" },
      ]);
    }
  });
});

describe("Checking a sheet envelope", () => {
  it("reports problems in the envelope and in the content", () => {
    const content = sheet(section(line("Amazing grace", [0, "G"]), line("")));
    expect(checkEnvelope(envelope({ title: undefined, content }))).toEqual([
      { message: "Sheet has no title", field: "title" },
      {
        message: "Line has no chords and no text",
        field: "content",
        section: 0,
        line: 1,
      },
    ]);
  });

  it("reports content in an unknown format", () => {
    const content = { format: "musicxml", version: 1 };
    expect(checkEnvelope(envelope({ content }))).toEqual([
      { message: 'Unknown format: "musicxml"', field: "content" },
    ]);
  });

  it("reports missing content", () => {
    expect(checkEnvelope(envelope({ content: undefined }))).toEqual([
      { message: "Content is not an object", field: "content" },
    ]);
  });
});
