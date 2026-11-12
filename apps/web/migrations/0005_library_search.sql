-- Search in the library. A sheet's lyrics sit beside its content as plain
-- text, which the app writes from the format (plainLines). An FTS5 index
-- over title, artist and lyrics reads its text from "sheet". Triggers keep it
-- in step, also when a sheet goes with its owner. See
-- openspec/specs/library-search.

alter table "sheet" add column "lyrics" text not null default '';

-- Fills the lyrics of existing sheets from version 1 of the content, as
-- plainLines does: each line's text, in order, without lines of only chords.
update "sheet" set "lyrics" = coalesce((select group_concat("text", char(10)) from (select replace(replace("value", char(57344), ''), char(57345), '') as "text" from json_tree("sheet"."content", '$.sections') where "key" = 'text' and trim("value") <> '' order by "id")), '');

create virtual table "sheet_fts" using fts5("title", "artist", "lyrics", content='sheet', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2');

create trigger "sheet_fts_insert" after insert on "sheet" begin
  insert into "sheet_fts" ("rowid", "title", "artist", "lyrics") values (new."rowid", new."title", new."artist", new."lyrics");
end;

create trigger "sheet_fts_delete" after delete on "sheet" begin
  insert into "sheet_fts" ("sheet_fts", "rowid", "title", "artist", "lyrics") values ('delete', old."rowid", old."title", old."artist", old."lyrics");
end;

create trigger "sheet_fts_update" after update of "title", "artist", "lyrics" on "sheet" begin
  insert into "sheet_fts" ("sheet_fts", "rowid", "title", "artist", "lyrics") values ('delete', old."rowid", old."title", old."artist", old."lyrics");
  insert into "sheet_fts" ("rowid", "title", "artist", "lyrics") values (new."rowid", new."title", new."artist", new."lyrics");
end;

insert into "sheet_fts" ("sheet_fts") values ('rebuild');
