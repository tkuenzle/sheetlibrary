# Design

## Context

`routes/sheets.tsx` holds all of it today. `LibraryImport` renders the "Import" `Menu` and both dialogs, and imports through `importSheet`, then navigates. `NewSheet` is a `<Form method="post">` to the route's action, which creates "Untitled" and redirects to `/sheets/:id/edit?new`. `Actions` renders both twice, beside the heading and docked, and CSS shows one. Collections and a collection dock "New collection" and "Add sheets" the same way, with the `library-actions-docked` class.

The shell renders three navigations and CSS shows one: the rail, the compact rail and the bottom bar. `Menu` is a plain `div` list next to its button, not in the top layer.

## Goals / Non-Goals

**Goals:**
- One place that owns the three ways, so every button and card opens the same dialogs.

**Non-Goals:**
- Making the "New sheet" menu work before the scripts load. "Import" doesn't today either. The "Write it" card does work then.
- Motion for the phone's menu beyond what the board shows. It comes with #89 and #136.

## Decisions

**The shell owns the three ways.** A provider in a new `sheets/new-sheet.tsx`, which `ShellView` wraps around its content, gives `useNewSheet()`. It returns `start(way)` for "write", "photos" and "ultimate-guitar". The provider renders the photo and Ultimate Guitar dialogs once, with the `onImport` and `onRead` code that is in `LibraryImport` now. The rail button, the compact rail button, the phone's button and the empty library's cards all call `start`. When a dialog closes, focus goes back to the element that opened it, which the context notes at `start`.
Alternative: each route mounts its own dialogs. The rail is in the shell, so that would mean a copy per screen, or no dialogs where a route has none.

**"Write a new sheet" posts to the `/sheets` action.** `start("write")` calls `useSubmit()` with method post and action `/sheets`. The action stays as it is. So it works from any screen in the shell, shows the loading bar like any move, and goes through React Router, as #140 wants. The "Write it" card is a `<Form method="post" action="/sheets">`, so it works before the scripts load.
Alternative: the menu's button submits the form before the scripts load, and opens the menu after. Rejected: a tap while the page loads would make a sheet the person didn't ask for.

**The rail buttons are `Menu`s.** On a wide screen, "New sheet" is a large filled text `Menu` under the site's name, opening below it at its left edge. In the compact rail, it is a 56px square filled `Menu`, opening to its right. `Menu` gets a `filled` variant, a square icon form, and a `beside` placement. `NavRail` already has a `top` slot for the compact form. The full form gets one after the site's name. The opened rail on a middle screen is the full form, so it gets the button too.

**The phone's menu is a modal `<dialog>`, in a new `FloatingMenu` in `ui/`.** `showModal()` gives the dimmed screen through `::backdrop`, Escape, an inert page and the top layer above the bottom bar. The dialog holds the three ways as large tonal buttons stacked at the bottom right, and a "Close" button in the floating button's spot, so the button seems to turn into "Close". A tap on the backdrop closes it. The list keeps `role="menu"` and the arrow keys. That key handling moves out of `Menu` into a helper both use.
Alternatives: `Menu` with a scrim. Its list isn't in the top layer, so the bar and the page would stay usable, and the scrim would cover the button. Or `EdgePanel`, which slides in from an edge and doesn't fit a menu that grows out of a button.

**The shell renders the floating "New sheet".** It is the same button and menu on every screen, so `ShellView` renders one `FloatingMenu` after the content, with the ways from `newSheetItems`. `FloatingButton` in `ui/` is its 64px square trigger above the bar, shown only at phone width by CSS. The empty library hides it with `.shell:has(.library-first)`, so the server renders it right and nothing needs to tell the shell. "New collection" and "Add sheets" are the tonal buttons beside their heading at every width; the CSS that hid them on a phone, and `library-actions-docked`, go.
Alternatives: a floating button per screen with that screen's add, as first built. The square + then meant "New sheet" in the compact rail and "New collection" on a phone, so the same-looking button changed meaning at 640px. Or each route rendering the same menu: three copies of one button.

## Risks / Trade-offs

- [The floating button covers the last row of a list] → The bottom padding of the screens grows to clear the 64px button, as it clears the docked buttons today. Check by hand at 390px with the list scrolled to its end.
- [A way picked in the opened rail must close the rail first] → `start` takes an optional "before" step. The opened rail passes its `slideOut`, and the dialog opens, or the post is sent, once the panel has closed. Focus then goes to the dialog, or to the new sheet's title field, not back to "Open navigation". Check by hand at 800px.
- [The shell grows] → The three ways live in `sheets/new-sheet.tsx`. `shell.tsx` only adds the provider and the rail buttons.
