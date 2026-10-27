# Design

## Context

The routes are `/`, `/editor` and, in previews only, `/design`. `root.tsx` renders a bare `<body>`. The editor page is a `<main>` with a heading, two paragraphs and `SheetEditor`. The base components are in `apps/web/app/ui/`. The layout already uses two widths: `max-width: 600px` for the phone sizes, the badges above the lyrics and the spread-out docked toolbar (`tokens.css`, `sheet-editor.css`, `section-toolbar.css`), and `max-width: 640px` in `sheet-editor.tsx`'s `compact` query, where editor-facelift found the margin beside the section runs out. The mockups for this step are on the canvas's "Editor" and "Home and later screens" pages, including the new help and narrow-window boards.

## Goals / Non-Goals

**Goals:**

- The page renders in the right layout from the server, without a jump when the scripts load.
- Every width rule comes from one list.

**Non-Goals:**

- A layout route. Two pages share the top bar, and only one has a panel. The library can bring one.
- Final UI text. M2g's UI text step owns the wording.
- A theme switch. The pages keep following the system.

## Decisions

**Components, not a layout route.** `TopBar` takes an optional song title and an optional action (the help button). `SidePanel` holds the panel. Both live in `apps/web/app/shell/`, apart from the base components in `ui/`, since they are page parts, not building blocks for the `/design` page. Rejected: a layout route with the title and the button passed up through route `handle`s. It is more machinery for two pages.

**Three widths, in one file.** Phone up to 640px, middle up to 1023px, wide from 1024px. The phone tier moves from 600px to 640px instead of the toolbar moving to 600px: editor-facelift measured 640px as the width where the margin runs out, so a mouse user from 601px to 640px would get a margin too narrow for the toolbar. `breakpoints.ts` exports the media queries; `sheet-editor.tsx` builds `compact` from it, and `SidePanel` uses it to close the sheet when the window grows. CSS can't read variables in `@media`, so the CSS keeps the literal widths with a comment pointing to the file. A unit test reads every `@media` width under `app/` and fails on one that isn't in the list. Rejected: Lightning CSS `@custom-media`. It changes how Vite handles CSS, and JS would still need its own copy.

**The wide panel and the sheet are two elements, switched by CSS.** The server renders the panel as an `<aside>` beside the editor. Below 1024px, CSS hides the aside and shows the help button. The button renders the same content into a `<dialog>` and opens it with `showModal()`, so the browser makes the page inert, handles Escape and returns focus to the button. The dialog's content is only rendered while it is open, so the help is in the DOM once at a time, apart from the hidden aside. If the window grows past 1023px while the sheet is open, it closes. A click on the `::backdrop` closes it too: the dialog has an inner wrapper that fills it, so a click whose target is the dialog itself was on the backdrop. Rejected: picking the form in JS with `matchMedia`. The server doesn't know the width, so the page would render in one form and switch after loading.

**The prototype notice also switches by CSS.** The page has the notice twice: in the aside, and above the song. CSS shows one: the aside's from 1024px, the page's below. On a phone, the page's note uses the boards' short text, "Prototype: nothing is saved.", the same way. Hidden copies use `display: none`, so screen readers skip them.

**The help picks its groups in CSS.** The help always contains "With touch", the keys and "With a mouse", in that order. `@media (pointer: coarse)` hides "With a mouse"; `@media not (pointer: coarse)` hides "With touch". Both orders come out of one sequence, the server renders the right help, and screen readers read what people see. A touch laptop counts as a mouse device, as it does for the toolbar. The keys show "Ctrl K" or "⌘ K" without guessing the platform.

**The wide panel stays in view.** The aside is `position: sticky` just below the top of the window, at most as tall as the window, and scrolls on its own if the help is taller. The section toolbar on the left stays in view the same way.

**Clicks on the help don't end editing.** `SheetEditor` ends editing on any click outside the sheet. An element with `data-keeps-editing` opts out; the help button and its sheet carry it. Rejected: checking for the top bar or for dialogs in `SheetEditor`. It would tie the editor to the page around it.

**The warning is the browser's own prompt.** While the song differs from the seed, the editor page listens for `beforeunload` and asks the browser to confirm. The top bar's links are plain links that load the next page in full, so one prompt covers the link, a reload, closing the tab and going back. Its text, "Changes you made may not be saved", is the browser's and can't be changed. Rejected: React Router's `useBlocker` with our own dialog. It only covers links inside the app, so the browser prompt is needed anyway. The library's client-side links will need it later.

**"Edited" means the song differs from the seed.** `SheetEditor` takes an `onEditedChange` callback. On each change to the document, it compares the document with the one it loaded and reports when the answer changes. Undoing back to the seed song doesn't warn.

**The sheet slides in from the right, and out again.** `min(360px, 100vw - 56px)` wide, full height, `--corner-large` on its left corners, `--surface` background. The backdrop uses a new `--scrim` role token: 32% of the text color in light, 50% black in lamplight, checked in the browser. It slides out the same way before it closes: a dialog leaves the page at once when it closes, so Escape, the close button and a click on the backdrop first mark it as closing, and it closes when its animations are done. Escape is caught on keydown for this. When the window grows wide, it closes at once. With reduced motion, it appears and goes without sliding.

**The home sample is static markup.** Each word with a chord is an inline-flex column with the chord above, as on the boards, using the same lyrics and chord sizes as the editor. It only uses lines with one chord per spot and no chord on a space, where this layout and the chord layer agree. Issue #23 replaces it with a read-only view from `chord-editor`.

## Risks / Trade-offs

- [The static sample drifts from the editor's layout] → It avoids piles and chords on spaces, and issue #23 replaces it.
- [The panel beside the editor squeezes the margin at 1024px, and the toolbar no longer fits] → 112px margin, about 560px sheet, 300px panel and the gaps add up to about 1020px. An e2e test at 1024px checks the toolbar is beside the section and the panel beside the editor.
- [Moving the phone tier to 640px changes type sizes for windows from 601px to 640px] → The chord layer measures letters where they are. The badge and label e2e tests run at the phone size, and the `browser-check` skill checks a 620px window.
- [Playwright dismisses the leave prompt, which cancels a reload] → The reload test accepts the prompt.
- [Playwright's `getByText` also finds the hidden copy of the notice] → Tests check visibility, or scope to the panel or the page.
