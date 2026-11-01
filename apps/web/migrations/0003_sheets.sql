-- Each person's sheets. Title and artist sit beside the content, so a list
-- of sheets never reads the content. Times are milliseconds since 1970.

create table "sheet" ("id" text not null primary key, "userId" text not null references "user" ("id") on delete cascade, "revision" integer not null, "title" text not null, "artist" text, "content" text not null, "createdAt" integer not null, "updatedAt" integer not null);

create index "sheet_userId_updatedAt_idx" on "sheet" ("userId", "updatedAt");
