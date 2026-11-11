-- The versions of each sheet: a name and a key, deleted with their sheet. The
-- owner is the sheet's. Times are milliseconds since 1970.

create table "sheet_version" ("id" text not null primary key, "sheetId" text not null references "sheet" ("id") on delete cascade, "name" text not null, "key" text not null, "createdAt" integer not null);

create index "sheet_version_sheetId_createdAt_idx" on "sheet_version" ("sheetId", "createdAt");
