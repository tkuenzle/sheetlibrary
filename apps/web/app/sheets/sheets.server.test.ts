import { type ChordSheet, plainLines } from "chordsheet";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { testEnv } from "../db/local-env.test-helper";
import { migrations, statements } from "../db/migrations.server";
import { seedSong } from "../editor/seed-song";
import {
  changeVersion,
  createSheet,
  createVersion,
  deleteSheet,
  deleteVersion,
  FIRST_REVISION,
  listSheets,
  listVersions,
  readSheet,
  recentSheets,
  recordOpening,
  saveSheet,
  searchSheets,
} from "./sheets.server";
import { addUser } from "./sheets.test-helper";

describe("sheet storage", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
    await addUser(db, "bo");
  });
  afterEach(() => test.dispose());

  it("creates a sheet and reads it back", async () => {
    const created = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    expect(created.revision).toBe(FIRST_REVISION);
    expect(await readSheet(db, "ana", created.id)).toEqual({
      id: created.id,
      revision: FIRST_REVISION,
      title: "Amazing Grace",
      content: seedSong,
    });
  });

  it("keeps the artist", async () => {
    const { id } = await createSheet(db, "ana", {
      title: "Amazing Grace",
      artist: "Judy Collins",
      content: seedSong,
    });
    expect(await readSheet(db, "ana", id)).toMatchObject({
      artist: "Judy Collins",
    });
  });

  it("saves on the current revision and raises it", async () => {
    const sheet = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    const result = await saveSheet(db, "ana", {
      ...sheet,
      title: "Amazing Grace (G)",
    });
    expect(result).toEqual({ kind: "saved", revision: FIRST_REVISION + 1 });
    expect(await readSheet(db, "ana", sheet.id)).toMatchObject({
      revision: FIRST_REVISION + 1,
      title: "Amazing Grace (G)",
    });
  });

  it("refuses the second of two saves on the same revision", async () => {
    const sheet = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    await saveSheet(db, "ana", { ...sheet, title: "First tab" });
    expect(
      await saveSheet(db, "ana", { ...sheet, title: "Second tab" }),
    ).toEqual({ kind: "stale" });
    expect(await readSheet(db, "ana", sheet.id)).toMatchObject({
      title: "First tab",
    });
  });

  it("treats someone else's sheet as missing", async () => {
    const sheet = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    expect(await readSheet(db, "bo", sheet.id)).toBeNull();
    expect(await saveSheet(db, "bo", { ...sheet, title: "Mine" })).toEqual({
      kind: "not-found",
    });
    expect(await deleteSheet(db, "bo", sheet.id)).toBe(false);
    expect(await readSheet(db, "ana", sheet.id)).toMatchObject({
      title: "Amazing Grace",
      revision: FIRST_REVISION,
    });
  });

  it("deletes a sheet", async () => {
    const { id } = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    expect(await deleteSheet(db, "ana", id)).toBe(true);
    expect(await readSheet(db, "ana", id)).toBeNull();
  });

  it("lists a person's sheets with their key and when each was edited and made", async () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1000);
    const hallelujah = await createSheet(db, "ana", {
      title: "Hallelujah",
      artist: "Leonard Cohen",
      content: seedSong,
    });
    now.mockReturnValue(2000);
    const grace = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    now.mockReturnValue(3000);
    await saveSheet(db, "ana", hallelujah);
    now.mockRestore();
    expect(await listSheets(db, "ana")).toEqual([
      {
        id: hallelujah.id,
        title: "Hallelujah",
        artist: "Leonard Cohen",
        key: "G",
        updatedAt: 3000,
        addedAt: 1000,
      },
      {
        id: grace.id,
        title: "Amazing Grace",
        key: "G",
        updatedAt: 2000,
        addedAt: 2000,
      },
    ]);
  });

  // Scenario "Someone else's sheets".
  it("lists no one else's sheets", async () => {
    await createSheet(db, "bo", { title: "Shenandoah", content: seedSong });
    expect(await listSheets(db, "ana")).toEqual([]);
  });
});

describe("version storage", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  let sheetId: string;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
    await addUser(db, "bo");
    ({ id: sheetId } = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    }));
  });
  afterEach(() => test.dispose());

  async function save(name: string, key: string) {
    const result = await createVersion(db, "ana", sheetId, { name, key });
    if (result.kind !== "saved") throw new Error(result.kind);
    return result.version;
  }

  it("saves versions and lists them in the order they were saved", async () => {
    const anna = await save("  Anna's key ", "A");
    const band = await save("Sunday band", "Bb");
    expect(anna.name).toBe("Anna's key");
    expect(await listVersions(db, "ana", sheetId)).toEqual([anna, band]);
  });

  it("allows the same name and key twice", async () => {
    await save("Anna's key", "A");
    await save("Anna's key", "A");
    expect(await listVersions(db, "ana", sheetId)).toHaveLength(2);
  });

  // Scenario "Empty name".
  it("refuses a name that is empty or too long, and a key that isn't one", async () => {
    for (const input of [
      { name: "   ", key: "A" },
      { name: "x".repeat(41), key: "A" },
      { name: "Anna's key", key: "H" },
    ]) {
      expect(await createVersion(db, "ana", sheetId, input)).toEqual({
        kind: "invalid",
      });
    }
    expect(await listVersions(db, "ana", sheetId)).toEqual([]);
  });

  it("renames a version and gives it another key", async () => {
    const anna = await save("Anna's key", "A");
    expect(
      await changeVersion(db, "ana", sheetId, anna.id, { key: "Bb" }),
    ).toEqual({ kind: "saved", version: { ...anna, key: "Bb" } });
    expect(
      await changeVersion(db, "ana", sheetId, anna.id, { name: "Anna" }),
    ).toEqual({ kind: "saved", version: { ...anna, name: "Anna", key: "Bb" } });
    expect(
      await changeVersion(db, "ana", sheetId, anna.id, { name: "" }),
    ).toEqual({ kind: "invalid" });
  });

  it("deletes a version", async () => {
    const anna = await save("Anna's key", "A");
    expect(await deleteVersion(db, "ana", sheetId, anna.id)).toBe(true);
    expect(await deleteVersion(db, "ana", sheetId, anna.id)).toBe(false);
    expect(await listVersions(db, "ana", sheetId)).toEqual([]);
  });

  // Scenario "Someone else's version".
  it("treats someone else's versions as missing", async () => {
    const anna = await save("Anna's key", "A");
    expect(await listVersions(db, "bo", sheetId)).toBeNull();
    expect(
      await createVersion(db, "bo", sheetId, { name: "Mine", key: "C" }),
    ).toEqual({ kind: "not-found" });
    expect(
      await changeVersion(db, "bo", sheetId, anna.id, { name: "Mine" }),
    ).toEqual({ kind: "not-found" });
    expect(await deleteVersion(db, "bo", sheetId, anna.id)).toBe(false);
    expect(await listVersions(db, "ana", sheetId)).toEqual([anna]);
  });

  it("finds a version only under its own sheet", async () => {
    const anna = await save("Anna's key", "A");
    const other = await createSheet(db, "ana", {
      title: "Shenandoah",
      content: seedSong,
    });
    expect(await deleteVersion(db, "ana", other.id, anna.id)).toBe(false);
  });

  // Scenario "Saving while the editor is open".
  it("leaves the sheet's revision when a version changes", async () => {
    const sheet = await readSheet(db, "ana", sheetId);
    if (!sheet) throw new Error("No sheet");
    const anna = await save("Anna's key", "A");
    await changeVersion(db, "ana", sheetId, anna.id, { key: "Bb" });
    await deleteVersion(db, "ana", sheetId, anna.id);
    expect(await saveSheet(db, "ana", sheet)).toEqual({
      kind: "saved",
      revision: FIRST_REVISION + 1,
    });
  });

  // Scenario "Deleting the sheet".
  it("deletes the versions with their sheet", async () => {
    await save("Anna's key", "A");
    await save("Sunday band", "Bb");
    await deleteSheet(db, "ana", sheetId);
    const left = await db
      .prepare('SELECT count(*) AS n FROM "sheet_version"')
      .first<{ n: number }>();
    expect(left?.n).toBe(0);
  });
});

describe("lyrics beside the content", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
  });
  afterEach(() => test.dispose());

  const storedLyrics = async (id: string) =>
    (
      await db
        .prepare('SELECT "lyrics" FROM "sheet" WHERE "id" = ?')
        .bind(id)
        .first<{ lyrics: string }>()
    )?.lyrics;

  // Labels, chords and a line with only chords, which the lyrics leave out.
  const content: ChordSheet = {
    format: "chordsheet",
    version: 1,
    sections: [
      {
        label: "Verse",
        lines: [
          { text: "", chords: [{ at: 0, root: "G" }] },
          { text: "Amazing grace", chords: [{ at: 0, root: "G" }] },
        ],
      },
      {
        lines: [
          { text: "How sweet the sound", chords: [{ at: 4, root: "C" }] },
        ],
      },
    ],
  };

  it("writes the lyrics when a sheet is created and saved", async () => {
    const created = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content,
    });
    expect(await storedLyrics(created.id)).toBe(
      "Amazing grace\nHow sweet the sound",
    );
    await saveSheet(db, "ana", {
      ...created,
      content: {
        ...content,
        sections: [{ lines: [{ text: "Was blind", chords: [] }] }],
      },
    });
    expect(await storedLyrics(created.id)).toBe("Was blind");
  });

  it("fills existing sheets in the migration as plainLines does", async () => {
    const { id } = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content,
    });
    await db.prepare('UPDATE "sheet" SET "lyrics" = \'\'').run();
    const migration = migrations.find(
      (m) => m.name === "0005_library_search.sql",
    );
    const fill = statements(migration?.sql ?? "").find((s) =>
      s.startsWith('update "sheet"'),
    );
    await db.prepare(fill ?? "").run();
    expect(await storedLyrics(id)).toBe(plainLines(content).join("\n"));
  });
});

describe("key beside the content", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
  });
  afterEach(() => test.dispose());

  const storedKey = async (id: string) =>
    (
      await db
        .prepare('SELECT "key" FROM "sheet" WHERE "id" = ?')
        .bind(id)
        .first<{ key: string | null }>()
    )?.key;

  // One line with a chord on each letter.
  const withChords = (...roots: string[]): ChordSheet => ({
    format: "chordsheet",
    version: 1,
    sections: [
      {
        lines: [
          {
            text: "x".repeat(roots.length),
            chords: roots.map((root, at) => ({ at, root })),
          },
        ],
      },
    ],
  });

  it("writes the guessed key when a sheet is created", async () => {
    const { id } = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: withChords("G", "C", "D", "G"),
    });
    expect(await storedKey(id)).toBe("G");
  });

  it("writes the set key before the guess", async () => {
    const { id } = await createSheet(db, "ana", {
      title: "Greensleeves",
      content: {
        ...withChords("G", "C", "D"),
        key: { tonic: "F#", minor: true },
      },
    });
    expect(await storedKey(id)).toBe("F#m");
  });

  it("writes the key again on a save, and none without chords", async () => {
    const created = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: withChords("G", "C", "D", "G"),
    });
    await saveSheet(db, "ana", {
      ...created,
      content: withChords("D", "G", "A", "D"),
    });
    expect(await storedKey(created.id)).toBe("D");
    await saveSheet(db, "ana", {
      ...created,
      revision: created.revision + 1,
      content: {
        format: "chordsheet",
        version: 1,
        sections: [{ lines: [{ text: "Was blind", chords: [] }] }],
      },
    });
    expect(await storedKey(created.id)).toBeNull();
  });

  it("lists the key, and none for a sheet without one", async () => {
    const { id } = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: withChords("G", "C", "D", "G"),
    });
    await db.prepare('UPDATE "sheet" SET "key" = NULL').run();
    expect((await listSheets(db, "ana"))[0]).not.toHaveProperty("key");
    await db.prepare('UPDATE "sheet" SET "key" = \'Em\'').run();
    expect((await listSheets(db, "ana"))[0]).toMatchObject({ id, key: "Em" });
    expect((await searchSheets(db, "ana", "grace"))[0]).toMatchObject({
      id,
      key: "Em",
    });
  });
});

describe("recent sheets", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
    await addUser(db, "bo");
  });
  afterEach(() => {
    vi.restoreAllMocks();
    return test.dispose();
  });

  const add = async (title: string, userId = "ana") =>
    (await createSheet(db, userId, { title, content: seedSong })).id;

  // Opens each sheet in turn, a second after the one before.
  let clock = 0;
  async function open(userId: string, ...ids: string[]) {
    for (const id of ids) {
      clock += 1000;
      vi.spyOn(Date, "now").mockReturnValue(clock);
      await recordOpening(db, userId, id);
    }
  }

  const titles = async (userId = "ana") =>
    (await recentSheets(db, userId)).map((sheet) => sheet.title);

  it("lists nothing before a sheet is opened", async () => {
    await add("Amazing Grace");
    expect(await titles()).toEqual([]);
  });

  // Scenario "Opened last".
  it("lists the last opened first, with its key", async () => {
    const grace = await add("Amazing Grace");
    const stille = await add("Stille Nacht");
    await open("ana", grace, stille);
    expect(await recentSheets(db, "ana")).toMatchObject([
      { id: stille, title: "Stille Nacht", key: "G" },
      { id: grace, title: "Amazing Grace", key: "G" },
    ]);
  });

  it("moves a sheet opened again to the front, once", async () => {
    const grace = await add("Amazing Grace");
    const stille = await add("Stille Nacht");
    await open("ana", grace, stille, grace);
    expect(await titles()).toEqual(["Amazing Grace", "Stille Nacht"]);
  });

  // Scenario "More than 4 opened".
  it("lists the 4 opened last", async () => {
    const ids: string[] = [];
    for (const title of ["A", "B", "C", "D", "E", "F"])
      ids.push(await add(title));
    await open("ana", ...ids);
    expect(await titles()).toEqual(["F", "E", "D", "C"]);
  });

  it("keeps each person's openings to themselves", async () => {
    const grace = await add("Amazing Grace");
    const shenandoah = await add("Shenandoah", "bo");
    await open("bo", shenandoah);
    await open("ana", shenandoah);
    expect(await titles("ana")).toEqual([]);
    expect(await titles("bo")).toEqual(["Shenandoah"]);
    await open("bo", grace);
    expect(await titles("bo")).toEqual(["Shenandoah"]);
  });

  it("forgets a deleted sheet", async () => {
    const grace = await add("Amazing Grace");
    await open("ana", grace);
    await deleteSheet(db, "ana", grace);
    expect(await titles()).toEqual([]);
    const left = await db
      .prepare('SELECT count(*) AS "n" FROM "sheet_open"')
      .first<{ n: number }>();
    expect(left?.n).toBe(0);
  });
});

describe("searching sheets", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
    await addUser(db, "bo");
  });
  afterEach(() => test.dispose());

  const lyrics = (...texts: string[]): ChordSheet => ({
    format: "chordsheet",
    version: 1,
    sections: [{ lines: texts.map((text) => ({ text, chords: [] })) }],
  });
  const titles = async (userId: string, q: string) =>
    (await searchSheets(db, userId, q)).map((result) => result.title);

  it("finds a word without its accents", async () => {
    await createSheet(db, "ana", { title: "Drüü Könige", content: lyrics() });
    expect(await titles("ana", "konige")).toEqual(["Drüü Könige"]);
  });

  it("matches words by their start", async () => {
    await createSheet(db, "ana", { title: "Amazing Grace", content: lyrics() });
    expect(await titles("ana", "grac")).toEqual(["Amazing Grace"]);
    expect(await titles("ana", "race")).toEqual([]);
  });

  it("finds each word anywhere in the sheet", async () => {
    await createSheet(db, "ana", {
      title: "Amazing Grace",
      artist: "John Newton",
      content: lyrics("How sweet the sound"),
    });
    expect(await titles("ana", "grace newton sound")).toEqual([
      "Amazing Grace",
    ]);
  });

  // Scenario "Title before lyrics".
  it("lists a title match before a lyrics match", async () => {
    await createSheet(db, "ana", {
      title: "Sternsinger",
      content: lyrics("Drei Könige ziehen durchs Dorf"),
    });
    await createSheet(db, "ana", { title: "Drüü Könige", content: lyrics() });
    expect(await titles("ana", "könige")).toEqual([
      "Drüü Könige",
      "Sternsinger",
    ]);
  });

  // Scenarios "Title match" and "Lyrics match".
  it("marks the matches, and the line only for a lyrics match", async () => {
    await createSheet(db, "ana", { title: "Drüü Könige", content: lyrics() });
    await createSheet(db, "ana", {
      title: "Sternsinger",
      content: lyrics("Stille Nacht", "Drei Könige ziehen durchs Dorf"),
    });
    const [title, lyricsOnly] = await searchSheets(db, "ana", "könige");
    expect(title).toMatchObject({
      titleParts: [
        { text: "Drüü ", hit: false },
        { text: "Könige", hit: true },
      ],
    });
    expect(title).not.toHaveProperty("line");
    expect(lyricsOnly).toMatchObject({
      titleParts: [{ text: "Sternsinger", hit: false }],
      line: [
        { text: "Drei ", hit: false },
        { text: "Könige", hit: true },
        { text: " ziehen durchs Dorf", hit: false },
      ],
    });
  });

  // Scenario "Someone else's sheets".
  it("doesn't find someone else's sheets", async () => {
    await createSheet(db, "bo", { title: "Shenandoah", content: lyrics() });
    expect(await titles("ana", "shenandoah")).toEqual([]);
  });

  // Scenario "After renaming".
  it("finds a sheet by its saved title", async () => {
    const sheet = await createSheet(db, "ana", {
      title: "Untitled",
      content: lyrics(),
    });
    await saveSheet(db, "ana", { ...sheet, title: "Amazing Grace" });
    expect(await titles("ana", "amazing")).toEqual(["Amazing Grace"]);
    expect(await titles("ana", "untitled")).toEqual([]);
  });

  // Scenario "After deleting", and an account that is deleted.
  it("finds nothing of a deleted sheet, nor of a deleted owner's", async () => {
    const { id } = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: lyrics(),
    });
    await createSheet(db, "bo", {
      title: "Shenandoah",
      content: lyrics("Away you rolling river"),
    });
    await deleteSheet(db, "ana", id);
    await db.prepare('DELETE FROM "user" WHERE "id" = ?').bind("bo").run();
    expect(await titles("ana", "amazing")).toEqual([]);
    const left = await db
      .prepare(
        'SELECT count(*) AS n FROM "sheet_fts" WHERE "sheet_fts" MATCH \'amazing OR shenandoah OR river\'',
      )
      .first<{ n: number }>();
    expect(left?.n).toBe(0);
  });

  it("finds nothing when no word is left to search", async () => {
    await createSheet(db, "ana", { title: "Amazing Grace", content: lyrics() });
    expect(await titles("ana", '" -')).toEqual([]);
  });
});
