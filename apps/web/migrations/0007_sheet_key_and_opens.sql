-- A sheet's key sits beside its content as text, such as "F#m", which the app
-- writes from the format (songKey) when a sheet is created or saved, as it
-- writes "lyrics". Null for a sheet without chords. Existing sheets are not
-- filled in: each gets its key on its next save.
--
-- When each person last opened each sheet to play: one row per person and
-- sheet, replaced on each opening, gone with the person or the sheet. Times
-- are milliseconds since 1970. See openspec/specs/library-page.

alter table "sheet" add column "key" text;

create table "sheet_open" ("userId" text not null references "user" ("id") on delete cascade, "sheetId" text not null references "sheet" ("id") on delete cascade, "openedAt" integer not null, primary key ("userId", "sheetId"));

create index "sheet_open_userId_openedAt_idx" on "sheet_open" ("userId", "openedAt");

create index "sheet_open_sheetId_idx" on "sheet_open" ("sheetId");
