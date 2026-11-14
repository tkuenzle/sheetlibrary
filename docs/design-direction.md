# Design direction

The look of Sheet Library, chosen in M2g's first step. The mockups are in a design canvas on claude.ai: <https://claude.ai/artifact/DcmNjZGDmLtgu7mwb8jyi5>. The canvas is the source of truth for layout and looks. For words, `docs/ui-text.md` wins, and the canvas's text is not kept up to date. This page sums up what was decided and why.

## The direction: Workbench

An app with a top bar and a side panel, for practicing at home.

- **The active section is a white sheet** on a tinted page. Other sections stay on the page, dimmed.
- **Each section's label sits above its lyrics**, inside the section, at every width, such as "Chorus". The active section's label is a pill; click it to edit it in place. The active section without a label shows "Add label". The row is there without a label too, so the lyrics don't move. The mockups are on the canvas's "Section labels" page.
- **The section's tools sit next to the section.** With a mouse, a floating toolbar in the left margin holds "Add chord", "Move up" and "Move down". On a touch device, they are docked at the bottom, above the keyboard.
- **The side panel** holds what isn't tied to the active section: the prototype notice and how to edit. In a window at least 1024px wide, it sits beside the editor. In a narrower one, a help button in the top bar opens it as a modal sheet from the right, and the prototype notice moves above the song. The help shows touch or mouse use, after the main pointer.
- **The style follows Material 3 Expressive:** tonal colors, large rounded corners, fully round buttons, and a floating toolbar with one emphasized button.

Three other directions were tried and dropped. Their boards are on the canvas's "Directions" page.

- **Margin:** a book page with the tools in the margin.
- **Highlighter:** the active section marked in yellow.
- **The first round:** the prototype's layout, restyled.

The keeper idea from Margin is the tools beside the section.

## The signed-in shell

The mockups are on the canvas's "UX overhaul" page, boards "Sheets, desktop", "Sheets, phone", "A collection, with the sheet menu on a row" and "Collections, phone". The first shell, on the "Library and account" page, had a top bar on every page and "Library" as a heading with two tabs.

- **One shell for the library and the account.** Sheets, Collections, a collection and the account page sit in a shell that stays on screen while the content changes: the navigation and the content. A sheet has its own page with a top bar, outside the shell.
- **A rail that lists the collections.** On a wide screen the navigation is a rail at the left: the site's name, "Sheets", "Collections" with every collection by name and number of sheets, and the account at the bottom. Only the list scrolls. It was chosen over a plain rail of three items, so a collection is one click away from anywhere. On a middle screen the rail shows only icons, and on a phone the navigation is a bar at the bottom, with the account as its last entry.
- **The navigation says where you are.** The open screen is marked in the tonal colors. A collection is marked by its own entry in the rail, and by "Collections" where the collections aren't listed. So a collection has no back link, and no screen in the shell has a top bar.
- **Search belongs to Sheets.** The search field sits below the heading of Sheets and on no other screen. It only finds sheets, so anywhere else it would throw the person to another screen while they type. The boards draw it at the top of every screen, with the account in it on a phone; that fits once search finds collections too.
- **A layout that doesn't move.** The rail and the bar have fixed sizes, and the content keeps its column, so a change of screen moves nothing around it. Transitions and loading states can be added later without moving things.
- **Moves without a full load.** Links in the shell and rows that open a sheet change the page in place. The focus then goes to the new page's heading, so screen readers read it, and "Skip to content" comes before the navigation. The links in a sheet's top bar still load the page in full, so the editor can ask before unsaved edits are lost.
- **Top bar A, for a sheet.** On a sheet, the bar starts with "Library" and a back arrow, and the sheet's title is only the heading. No page has a breadcrumb: it repeated the heading. Signed in, the bar ends with the account: the email's first letter in a round tonal chip, linking to the account page. Option B, a breadcrumb on every page and a menu behind the initial, was dropped.
- **Sign-in B.** The sign-in page has no top bar. The site's name sits above one card in the middle of the page, so nothing competes with the form, and "Check your email" takes the form's place in the card. "Send link" is the main button and "Sign in with a passkey" a tonal one, since everyone's first sign-in is by email. Option A, the card beside the home page's sample sheet, was dropped.
- **The account page** uses the library's grouped rows: the email is one row, the passkeys a group with "Add passkey" as a tonal button under it, and "Sign out" is its own one-row group with an icon, so it doesn't look like another button.
- **The passkey offer** is a card in the note colors under the heading of Sheets, above the list, so the library still works around it. It shows after an email sign-in when the account has no passkey. "Add passkey" opens the account page, so the library never asks the device itself. "Close" hides it on this device for good. A dialog was dropped: it would cover the library right after sign-in.

## Role tokens

Components only use role tokens. A style is one set of values for them. Light is the default; lamplight is the dark style. A later style, for example one for the stage, is a new set of values.

| Role                                 | Used for                                              | Light                 | Lamplight             |
| ------------------------------------ | ----------------------------------------------------- | --------------------- | --------------------- |
| `--page`                             | Page background, dimmed sections                      | `#EBF0EB`             | `#101511`             |
| `--surface`                          | Side panel                                            | `#F6FAF6`             | `#171D19`             |
| `--surface-active`                   | The active section, popovers                          | `#FFFFFF`             | `#222925`             |
| `--text`                             | Lyrics, headings                                      | `#171D1A`             | `#DEE4DE`             |
| `--text-muted`                       | Help text, breadcrumb                                 | `#404943`             | `#BFC9C1`             |
| `--text-dimmed`                      | Lyrics of sections that aren't active                 | `#646E67`             | `#78827B`             |
| `--chord`                            | Chord labels, "+" and drop caret                      | `#1F6B4F`             | `#8ED3B1`             |
| `--chord-dimmed`                     | Chords of sections that aren't active                 | `#477461`             | `#5B8873`             |
| `--accent` / `--on-accent`           | Main buttons, selected chord, label field, focus ring | `#1F6B4F` / `#FFFFFF` | `#8ED3B1` / `#00382A` |
| `--accent-soft` / `--on-accent-soft` | Section toolbar, key chip                             | `#C8E9D6` / `#0A5138` | `#1E4D3A` / `#B4F0D0` |
| `--info` / `--on-info`               | Notes such as the prototype notice                    | `#D6E7DC` / `#24392D` | `#2A3A30` / `#CFE6D7` |
| `--quiet` / `--on-quiet`             | Keys                                                  | `#DCE4DD` / `#3A443D` | `#2E3530` / `#C9D3CB` |
| `--border`                           | Dividers                                              | `#DCE4DD`             | `#343B36`             |
| `--tooltip` / `--on-tooltip`         | Tooltips                                              | `#2C322E` / `#EDF2EC` | `#DEE4DE` / `#2C322E` |
| `--focus`                            | Focus ring                                            | `#1F6B4F`             | `#8ED3B1`             |
| `--shadow`                           | Shadows of popovers and dragged chords                | `rgb(23 29 26 / 16%)` | `rgb(0 0 0 / 50%)`    |
| `--scrim`                            | The page behind the help sheet                        | `rgb(23 29 26 / 32%)` | `rgb(0 0 0 / 50%)`    |

All text and chord colors meet WCAG AA (4.5:1) on the backgrounds they are used on, dimmed sections included.

The tokens are in `apps/web/app/ui/tokens.css`. Each color is written as `light-dark(light, lamplight)`. The page follows the system's dark mode, and `data-theme="light"` or `data-theme="lamplight"` fixes the style for an element and everything in it.

## Type, space and shape

- **Font:** Schibsted Grotesk, served from our own site with the pinned `@fontsource-variable/schibsted-grotesk` package. The font decides where chords sit over the lyrics, so it only changes with a commit. It also works offline and sends nothing to Google.
- **Sizes** (desktop, phone in brackets):

  | Use     | Size    | Weight |
  | ------- | ------- | ------ |
  | Title   | 46 (34) | 800    |
  | Heading | 20      | 700    |
  | Lyrics  | 20 (18) | 400    |
  | Chord   | 15 (14) | 700    |
  | Body    | 15      | 400    |
  | Label   | 15 (16) | 600    |
  | Small   | 13      | 500    |

- **Spacing steps:** 4, 8, 12, 16, 24, 32, 48 px.
- **Corners:**
  - 8 px for keys and chips
  - 20 px for notes and popovers
  - 28 px for the active section and the panel
  - fully round for buttons and toolbars
- **Icons:** Material Symbols Rounded, weight 500, drawn for 24px, as inline SVGs committed in `apps/web/app/ui/icons/`. Only the icons listed in `icons.ts` are bundled. The npm packages only have icons drawn for 48px, which look too thin at 24px.

## Components

The base components are React components in `apps/web/app/ui/`, each with its own CSS on the role tokens: `Button`, `IconButton`, `Tooltip`, `Toolbar`, `Popover`, `Note`, `NavRail` and `NavBar`. They keep an outline in forced colors mode. `NavRail` is the navigation at the left of a wide screen: the site's name, the items with what they hold listed under them, and the account at the bottom. Its compact form shows only icons, with tooltips. `NavBar` is the navigation at the bottom of a phone. Both mark the open item with the tonal colors. The grouped rows of the library and the account page are a class, `group-list` in `group-list.css`, since their rows hold different things. The `/design` page shows them in both styles. It exists only in pull request previews and the dev server.

The shell is the layout route `apps/web/app/routes/shell.tsx`. It renders the rail, its compact form and the bar, and CSS shows the one for the window's width. The parts of a sheet's page are in `apps/web/app/shell/`: `TopBar` and `SidePanel`. Where the side panel sits is decided by CSS, so the server renders the right layout and nothing jumps when the scripts load.

The `chord-editor` package draws what sits on the lyrics: chord labels, the "+", the dash, the drop caret and the row that holds each section's label. The app edits the label in its own field, laid over the label. It keeps the layout the chord layer measures, set through a few `--chord-editor-*` properties such as the font size and line heights. It leaves the looks to the app: colors, backgrounds, corners and shadows. The app styles the state classes and data attributes the package publishes, such as `.section.is-active` or `.chord-label.is-selected`. Its stylesheet lists them all. The app's editor styles are in `apps/web/app/editor/`.

Buttons, icons and UI text belong to the app; the text follows `docs/ui-text.md`. The section toolbar is a React component in the app. The package only places it, beside the section or docked, and tells the app what it shows. Each DOM element has one owner, React or the package, never both.

## Widths

Every layout rule uses the same three widths, listed in `apps/web/app/breakpoints.ts`:

- **Phone, up to 640px:** smaller type, the section toolbar docked, and only the site's name in the top bar. The shell's navigation is a bar at the bottom. At 640px, the margin beside the sections gets too narrow for the toolbar.
- **Middle, up to 1023px:** the side panel is behind the help button. The shell's rail shows only icons.
- **Wide, from 1024px:** the side panel sits beside the editor. The shell's rail lists the collections.

CSS can't use variables in `@media`, so the stylesheets write the same widths. A unit test fails on any other width. On a touch device, the toolbar is docked at any width.

## What the mockups add

The mockups redesign today's features. Two additions need sheet metadata, which doesn't exist yet: the song title and the key in the header. The key is marked on the boards as a proposal. The boards still show section numbers in round badges; section labels replaced them later.

The chord input is only restyled. Its UX gets its own change later.

The library list and play view are rough sketches of later screens. They only check that the foundation works beyond the editor.
