# Design direction

The look of Sheet Library, chosen in M2g's first step. The mockups are in a design canvas on claude.ai: <https://claude.ai/artifact/DcmNjZGDmLtgu7mwb8jyi5>. The canvas is the source of truth. This page sums up what was decided and why.

## The direction: Workbench

An app with a top bar and a side panel, for practicing at home.

- **The active section is a white sheet** on a tinted page. Other sections stay on the page, dimmed.
- **Each section has a number in a round badge.** On wider screens it sits left of the lyrics. On a phone it sits above them, so the lyrics get the full width.
- **The section's tools sit next to the section.** With a mouse, a floating toolbar in the left margin holds "Add chord", "Move up" and "Move down". On a touch device, they are docked at the bottom, above the keyboard.
- **The side panel** holds what isn't tied to the active section: the prototype notice and how to edit. On a phone or tablet, a help button in the top bar opens it.
- **The style follows Material 3 Expressive:** tonal colors, large rounded corners, fully round buttons, and a floating toolbar with one emphasized button.

Three other directions were tried and dropped. Their boards are on the canvas's "Directions" page.

- **Margin:** a book page with the tools in the margin.
- **Highlighter:** the active section marked in yellow.
- **The first round:** the prototype's layout, restyled.

The keeper idea from Margin is the tools beside the section.

## Role tokens

Components only use role tokens. A style is one set of values for them. Light is the default; lamplight is the dark style. A later style, for example one for the stage, is a new set of values.

| Role                                 | Used for                                               | Light                 | Lamplight             |
| ------------------------------------ | ------------------------------------------------------ | --------------------- | --------------------- |
| `--page`                             | Page background, dimmed sections                       | `#EBF0EB`             | `#101511`             |
| `--surface`                          | Side panel                                             | `#F6FAF6`             | `#171D19`             |
| `--surface-active`                   | The active section, popovers                           | `#FFFFFF`             | `#222925`             |
| `--text`                             | Lyrics, headings                                       | `#171D1A`             | `#DEE4DE`             |
| `--text-muted`                       | Help text, breadcrumb                                  | `#404943`             | `#BFC9C1`             |
| `--text-dimmed`                      | Lyrics of sections that aren't active                  | `#646E67`             | `#78827B`             |
| `--chord`                            | Chord labels, "+" and drop caret                       | `#1F6B4F`             | `#8ED3B1`             |
| `--chord-dimmed`                     | Chords of sections that aren't active                  | `#477461`             | `#5B8873`             |
| `--accent` / `--on-accent`           | Main buttons, selected chord, active badge, focus ring | `#1F6B4F` / `#FFFFFF` | `#8ED3B1` / `#00382A` |
| `--accent-soft` / `--on-accent-soft` | Section toolbar, key chip                              | `#C8E9D6` / `#0A5138` | `#1E4D3A` / `#B4F0D0` |
| `--info` / `--on-info`               | Notes such as the prototype notice                     | `#D6E7DC` / `#24392D` | `#2A3A30` / `#CFE6D7` |
| `--quiet` / `--on-quiet`             | Keys, inactive badge                                   | `#DCE4DD` / `#3A443D` | `#2E3530` / `#C9D3CB` |
| `--border`                           | Dividers                                               | `#DCE4DD`             | `#343B36`             |
| `--tooltip` / `--on-tooltip`         | Tooltips                                               | `#2C322E` / `#EDF2EC` | `#DEE4DE` / `#2C322E` |
| `--focus`                            | Focus ring                                             | `#1F6B4F`             | `#8ED3B1`             |
| `--shadow`                           | Shadows of popovers and dragged chords                 | `rgb(23 29 26 / 16%)` | `rgb(0 0 0 / 50%)`    |

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

The base components are React components in `apps/web/app/ui/`, each with its own CSS on the role tokens: `Button`, `IconButton`, `Tooltip`, `Toolbar`, `Popover` and `Note`. They keep an outline in forced colors mode. The `/design` page shows them in both styles. It exists only in pull request previews and the dev server.

The `chord-editor` package draws what sits on the lyrics: chord labels, the "+", the dash, the drop caret and the section numbers. It keeps the layout the chord layer measures, set through a few `--chord-editor-*` properties such as the font size and line heights. It leaves the looks to the app: colors, backgrounds, corners and shadows. The app styles the state classes and data attributes the package publishes, such as `.section.is-active` or `.chord-label.is-selected`. Its stylesheet lists them all. The app's editor styles are in `apps/web/app/editor/`.

Buttons, icons and UI text belong to the app. The section toolbar is a React component in the app. The package only places it, beside the section or docked, and tells the app what it shows. Each DOM element has one owner, React or the package, never both.

## What the mockups add

The mockups redesign today's features. Two additions need sheet metadata, which doesn't exist yet: the song title and the key in the header. The key is marked on the boards as a proposal. Section numbers in round badges are new too, but they come from the order of the sections and need no new data.

The chord input is only restyled. Its UX gets its own change later.

The library list and play view are rough sketches of later screens. They only check that the foundation works beyond the editor.

## Mockup files in the repo

While M2g is built, copies of the canvas's `.dc.html` files live in `docs/design/`. Each M2g step refreshes them when it starts, and the last step deletes the folder. The canvas wins whenever the two differ.
