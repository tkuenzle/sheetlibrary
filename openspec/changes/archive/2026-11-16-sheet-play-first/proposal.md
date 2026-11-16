# Proposal

## Why

Play and Edit are two pages with a switch that gives both the same weight, though playing is the main use. The play bar holds six controls, the phone needs its own "More" menu, and Edit has a different menu. "Library" always goes to the library, even from a collection or a search. On a wide screen the editor sits in the left half because of the help panel. This is step 5 of the UX overhaul (#134).

## What Changes

- A sheet opens to play. Its bar holds Back, "View", "Edit" and the sheet's menu.
- Back is an arrow named "Back". After a move inside the app it goes back in the browser's history, so the list returns with its search and scroll. Opened from a link, a bookmark or a new tab, it opens Sheets.
- "View" opens a panel with the text size and "Lyrics only". "Smaller text", "Larger text" and the toggle leave the bar, and the phone's "More" menu goes away.
- "Edit" opens edit mode. The bar then shows "Done", the save state and the help button. "Done" saves and goes back to play.
- Play and Edit change without a full page load. Every way out of edit mode saves first, and only asks before leaving when the save fails.
- The sheet's menu is the same in both modes: "Choose collections…", "Print" and "Delete". There is no Rename in any menu; the title is renamed in edit mode, with a button beside it or a click on it. Delete from play mode goes back after it.
- Under the title: the artist, the key and capo buttons, and on a wide screen the collections the sheet is in. The key button shows the open version's name.
- The sheet is centred in both modes. The help panel beside the editor goes away. "How to edit" shows as a note the first time, kept away with "Got it" on this device, and then sits behind the help button at every width.
- The top bar on a sheet no longer shows the account. The home page and `/editor` keep their top bar as it is.
- Not in this change: stepping to the next sheet from a set (#154), a new sheet in its collection (#152), and transitions (#136).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `play-page`: the bar holds Back, View, Edit and the menu; the text size and "Lyrics only" move into View; the phone menu goes; the version's name moves into the key button; the collections show under the title; Delete moves here.
- `sheet-page`: edit mode is reached from the play view with "Edit" and left with "Done"; leaving saves first; the menu loses "Rename" and gains "Choose collections…" and "Print"; a button beside the title renames it; the help becomes a first-time note and a help button; Delete goes back.
- `site-layout`: on a sheet, the top bar starts with Back instead of "Library", has no Play and Edit switch, and doesn't show the account.

## Impact

- `routes/sheet.tsx`, `routes/sheet.edit.tsx`, their CSS and tests.
- `shell/top-bar.tsx`; `shell/play-edit-switch.tsx` goes; `shell/side-panel.tsx` stays for `/editor` only.
- `editor/help.tsx` for the first-time note; a cookie for "Got it", next to the text size's.
- `e2e/play.spec.ts`, `e2e/sheet.spec.ts`, `e2e/library.spec.ts`.
- `docs/ui-text.md` and `docs/design-direction.md`.
- No new stored data, no API change.

## Open Questions

- While a version is open and the sheet is shown in another key, what does the key button read: "Key Bb · Anna’s key" or the semitones, such as "Key C · +2"?
- With "Lyrics only" the key button is hidden. Where does the open version's name show then? Today it shows after the artist.
- In View, is the text size shown as a percentage, as on the board, or only as two buttons?
- On a phone, should the collections show under the title too? The phone board leaves them out.
- Does the save state in the edit bar say "Editing · Saved", as on the board, or only the save state?
