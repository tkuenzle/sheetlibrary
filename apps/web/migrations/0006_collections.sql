-- Each person's collections: a name and the sheets in it, without an order.
-- "nameKey" is the name as the app folds it (NFC, lower case), so a person
-- can't have two collections whose names differ only in case. A sheet in a
-- collection is a row of "collection_sheet", gone with its collection or its
-- sheet. Times are milliseconds since 1970. See openspec/specs/collections.

create table "collection" ("id" text not null primary key, "userId" text not null references "user" ("id") on delete cascade, "name" text not null, "nameKey" text not null, "createdAt" integer not null, "updatedAt" integer not null);

create unique index "collection_userId_nameKey_idx" on "collection" ("userId", "nameKey");

create table "collection_sheet" ("collectionId" text not null references "collection" ("id") on delete cascade, "sheetId" text not null references "sheet" ("id") on delete cascade, "addedAt" integer not null, primary key ("collectionId", "sheetId"));

create index "collection_sheet_sheetId_idx" on "collection_sheet" ("sheetId");
