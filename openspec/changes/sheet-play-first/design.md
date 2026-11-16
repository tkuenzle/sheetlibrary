# Design

## Context

Play (`routes/sheet.tsx`) and edit (`routes/sheet.edit.tsx`) are two routes. `shell/play-edit-switch.tsx` links them with plain `<a>`, so every switch loads the page in full, and the editor relies on `beforeunload` to guard unsaved edits. `shell/top-bar.tsx` always links "Library" to `/sheets`. `sheets/autosave.ts` saves on a timer and has no way to save on demand. The text size is kept in a cookie (`sheets/text-size.ts`) so the server renders the right size. `sheetCollections` in `collections/collections.server.ts` already reads which collections hold a sheet.

## Goals / Non-Goals

**Goals:**
- Back and Done move through the browser's history in a way that never lands in the wrong mode.
- No unsaved edit is lost when leaving edit mode inside the app.

**Non-Goals:**
- Merging the two routes into one. The addresses stay, and each route keeps its own loader.
- Changing `/editor`, which keeps its top bar, side panel and prototype notice.

## Decisions

**Edit adds a history entry; Done steps back.** "Edit" pushes `/sheets/:id/edit` with the key and capo, and marks the move in its location state as coming from play. "Done", and the browser's back, step back to that play entry, so edit mode never sits between play and the list, and the phone's back gesture returns to play. Edit mode opened without a play entry below it, as from "New sheet", has nothing to step back to: there "Done" replaces the edit entry with the play view. Considered: "Edit" and "Done" both replacing, so the sheet is one entry. It needs fewer cases, but the browser's back in edit mode would leave the sheet.

**Done hands the key and capo to the play view.** The play entry stepped back to still holds the address from before editing. "Done" leaves the key and capo shown now in a small in-memory hand-off for that sheet. The play view takes it on arrival and applies it as a transpose does, replacing the address without loading again. Considered: a second move that replaces the address after stepping back, which loads the play view twice.

**Back knows the app's history from React Router's index.** React Router keeps an `idx` in `window.history.state`, 0 for the first entry the app loaded. Back steps back with `navigate(-1)` when `idx` is above 0, and otherwise opens `/sheets`. A sheet opened from a link is at 0; Edit takes it to 1 and Done back to 0, so Back still opens `/sheets`. Considered: `location.key === "default"`, which changes on any `replace`, as after "New sheet" and Done.

**Delete leaves as Back from play would.** From play, that is Back itself. From edit mode with a play entry below, it steps back past play too (`navigate(-2)`) when there is a page before it, and otherwise opens `/sheets`, so no entry of the deleted sheet is in the way back.

**Autosave gets a "save now".** `Autosave` gains `saveNow(): Promise<"saved" | "failed" | "stopped">`. It cancels the timer, waits for a save in flight, and sends what is waiting. "Done" awaits it before navigating. In-app moves away from edit mode go through `useBlocker`: while edits aren't saved, the blocker calls `saveNow()` and then proceeds, or on "failed" shows a confirm dialog ("Leave without the edits?"), whose "Leave" proceeds and "Stay" resets. After a conflict or a delete, saving has stopped, so the blocker proceeds at once. `beforeunload` stays for reloads and closing the tab.

**One bar component for both modes.** A `SheetBar` in `shell/` replaces `TopBar` on the sheet's routes: Back, View, Edit and the menu in play; Done, the save state, help and the menu in edit. It renders no account link. `TopBar` keeps "Sheet Library" for the home page and `/editor` and loses its `back` and `afterBack` props. `PlayEditSwitch` is deleted. The menu items come from one function, used by both routes, so the two menus can't drift apart.

**The play loader reads the sheet's collections.** It adds the names and ids that hold the sheet, from the same query as `sheetCollections`, in the batch it already runs. When "Choose collections…" closes after a change, the page calls `revalidate()` once, as the sheet list does. #140 replaces both.

**"Got it" is a cookie, the help text follows the pointer in CSS.** A cookie `edit-help=seen`, written like the text size's, is read by the edit loader, so the server renders the note or not. The note holds both texts, touch and mouse, and `@media (pointer: coarse)` shows one, so the server needs no guess. "All shortcuts" opens the same edge panel as the help button. The side panel beside the editor goes from the sheet; `SidePanel` stays for `/editor`.

## Risks / Trade-offs

- [`useBlocker` is new to the codebase, and blocks on every in-app move] → It only blocks while edits aren't saved, and the e2e tests check Done, the browser's back and a failed save offline.
- [Done, Delete and the browser's back each depend on whether a play entry is below edit mode] → One function decides from the location state and the history index, with unit tests for a sheet opened from the list, from a link and from "New sheet".
- [The browser's forward from play re-enters edit mode] → Edit mode loads as it would from "Edit"; nothing is lost.
- [Reading React Router's internal `idx`] → It is part of the history state React Router writes on every entry. A unit test pins the Back logic to it, so an upgrade that changes it fails loudly.
- [Moving to edit mode in the app loads the editor's code then] → The loading bar covers a slow load, as for any move.
