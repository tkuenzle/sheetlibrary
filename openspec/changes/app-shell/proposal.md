# Proposal

## Why

The app has no navigation. "Library" is a heading with two tabs that are separate pages, and there is no place for sets (#35) or sharing (#36). Every link loads the page in full, so nothing can stay on screen between pages. This is step 1 of the UX overhaul (#131); the later steps sit inside this shell.

## What Changes

- Sheets, Collections, a collection and the account page sit in one shell. It stays on screen while the content changes.
- On wide screens the shell has a rail: the site's name, "Sheets", "Collections" with every collection by name and sheet count, and the account at the bottom. On middle screens the rail shows icons only. On phones it is a bottom bar with "Sheets", "Collections" and the account.
- The search field stays on the Sheets screen, below its heading. It only finds sheets, so the other screens have none.
- The "Library" heading and its tabs go away. The screens are headed "Sheets" and "Collections", with their buttons where they are today. On phones the docked buttons sit above the bottom bar.
- The shell's screens have no top bar. A collection has no back link; the navigation marks where you are. The top bar stays on the home page, `/editor` and a sheet.
- Links inside the shell, and rows that open a sheet, change the page without a full load. The links in a sheet's top bar keep loading in full, so the editor can still ask before unsaved edits are lost.
- After a move without a full load, focus goes to the new page's heading, so screen readers read it out. A page that places focus itself keeps it, and a search keeps focus in the field.
- A "Skip to content" link comes before the navigation.
- The rail and the bottom bar are new base components, shown on `/design`.
- Not in this change: "Sets" in the navigation (#35), the "Recent" row, the new rows and the single "New sheet" button (#132, #133), the sheet page (#134), a sign that a page is loading (#129), the `/` key for search, and a search that finds collections.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: the shell, its navigation at three widths, the account link, the skip link and where focus goes after a move. The top bar leaves the shell's screens, and "Back to the collections" goes.
- `library-page`: the tabs go; Sheets and Collections are screens with their own heading.
- `collection-page`: renaming and deleting name "Collections" as a screen, not a tab, and the rail follows a rename.
- `library-search`: the field sits below the heading of Sheets, and on no other screen.

## Impact

- `apps/web/app/routes.ts`: a layout route around `/sheets`, `/collections`, `/collections/:id` and `/account`. It is the first one.
- A new shell route with a loader for the rail's collections. `routes/sheets.tsx`, `collections.tsx`, `collection.tsx` and `account.tsx` lose their top bar; `sheets/library-tabs.tsx` goes.
- `apps/web/app/ui/`: the rail and the bottom bar, two new icons, and both on `routes/design.tsx`.
- `shell/top-bar.tsx` loses the "Collections" back link and the marked account link.
- `root.tsx`: focus after a move.
- Tests: the unit tests of the four routes and the top bar, and `e2e/library.spec.ts`, `collections.spec.ts` and `account.spec.ts`, which look for the "Library" heading and the tabs.
- `docs/ui-text.md` and `docs/design-direction.md`.
- Design: the "UX overhaul" page of the canvas, boards "Sheets, desktop", "Sheets, phone", "A collection, with the sheet menu on a row" and "Collections, phone". https://claude.ai/artifact/DcmNjZGDmLtgu7mwb8jyi5

## Open Questions

- The boards draw the search field on every screen, with the account in it on a phone. Here the field is only on Sheets, and the account is the last entry of the bottom bar. Should the boards follow?
- On middle screens the rail shows no site name, only the icons. Is that fine?
- The rail shows each collection's sheet count, as on the boards. Keep it?
- With sets, the bottom bar will have four entries. Is that fine?
- A collection that isn't found shows inside the shell, with "Collections" marked. Is that right?
- On a sheet, the back link still says "Library" and opens Sheets, and going back loads the page in full. Both stay until #134. Is that fine?
- There is no board for the middle width, for a collection on a phone, or for the account page in the shell. They are built from the other boards. Should they be drawn first?
- Should a search that finds collections get its own issue now?
