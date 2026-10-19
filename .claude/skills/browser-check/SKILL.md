---
name: browser-check
description: Run the Sheet Library web app and check a change in a real browser, especially the chord editor (chords above letters, the active section, section breaks, undo, pasting). Use after changing the editor or a page, when asked to try, check, verify or screenshot something in the app, or to reproduce an editor bug by hand.
---

# Check a change in the browser

Unit and e2e tests cover the rules. Use this skill to see a change working, try a case the tests miss, or reproduce a bug. If a check is worth keeping, add it to `apps/web/e2e/` afterwards.

General `playwright-cli` commands are in the `playwright-cli` skill. This one covers what is special about this project.

## Start the app

```sh
just dev   # http://localhost:5173, run it in the background
```

Pages: `/sheet-editor` (the sheet editor test page), `/spike/editor` (the old spike) and `/`.

The e2e tests run against the production build instead (`just build`, then `pnpm --filter web preview --port 4173`). Use that when a bug might only show in the build.

## Open a browser

Use the Playwright that comes with the web app. No global install is needed. Run it from the repo root:

```sh
pnpm --filter web exec playwright cli open --browser=chromium http://localhost:5173/sheet-editor
pnpm --filter web exec playwright cli open --browser=chromium --device="Pixel 7" http://localhost:5173/sheet-editor   # phone layout and touch
```

- `--browser=chromium` uses the Chromium that `playwright install chromium` set up for the e2e tests. Without it, the CLI looks for an installed Google Chrome.
- Below, `pw` stands for `pnpm --filter web exec playwright cli`. It runs in `apps/web`, so give file paths as absolute paths.
- Output goes to `apps/web/.playwright-cli/`, which is gitignored. Save screenshots in your scratchpad, not in the repo.
- A 404 for `/favicon.ico` in the console is expected.
- Close the browser (`pw close`) and stop the dev server when you're done.

## Load the editor helpers

The page snapshot does not show the editor's text, so snapshot refs can't put the caret on a letter. Load the helpers once per browser instead. They stay across reloads.

```sh
pw run-code --filename="$PWD/.claude/skills/browser-check/editor-helpers.js"   # from the repo root
```

They add `window.editor`. Call them with `pw --raw eval "() => editor.sheet()"`.

| Helper | What it does |
| --- | --- |
| `sheet()` | The sheet as shown: per section, `active` and its lines, with chords in brackets before their letter, e.g. `"That saved a w[Am]retch like [D]me"`. |
| `caret(needle, offset = 0)` | Puts the caret before a letter: the one at `offset` in the first match of `needle`. Makes its section active. No click. |
| `select(needle)` | Selects the first match of `needle`. |
| `charBox(needle, offset = 0)` | The letter's position on screen, for a real click (see below). |
| `paste(text)` | Pastes plain text at the caret. A blank line in `text` is a section break. |
| `misplacedChords()` | Chord labels missing or not above their letter. `[]` is good. |
| `overlappingChords()` | Chord labels in one row that overlap. `[]` is good. |

`needle` matches the plain lyrics, without chords. Pick one that is unique in the sheet.

## Recipes

Add a chord (Ctrl+K or Cmd+K at the caret):

```sh
pw --raw eval "() => editor.caret('wretch', 1)"
pw press ControlOrMeta+k
pw type Am
pw press Enter
pw --raw eval "() => [editor.sheet()[0].lines, editor.misplacedChords(), editor.overlappingChords()]"
```

Click a letter for real, when the click itself matters, for example clicking into a dimmed section:

```sh
pw run-code "async page => { const b = await page.evaluate(() => editor.charBox('relieved', 3)); await page.mouse.click(b.left + 1, b.y); }"
```

Start a new section: Enter at the end of a line, then Enter on the new empty line. Enter at the start of a line adds the empty line above the caret, so a second Enter there doesn't split.

```sh
pw --raw eval "() => editor.caret('heart to fear')"
pw press End
pw press Enter
pw press Enter
pw --raw eval "() => editor.sheet().map((s) => s.lines.length)"
```

Other keys: `pw press Escape` ends editing and cleans up the section, `pw press ControlOrMeta+z` undoes, `pw press Backspace` at the start of a section joins it with the one before.

See the stored sheet: click **Done** and read the JSON.

```sh
pw click "getByRole('button', { name: 'Done' })"
pw --raw eval "() => document.querySelector('[data-testid=sheet]').textContent"
```

Look at it: `pw screenshot --filename=<scratchpad>/editor.png`, then read the image.

## Timing

ProseMirror reads a new selection from the `selectionchange` event, which comes a moment after a click or key press. Separate `pw` commands are slow enough. Inside one `run-code` with several steps, wait about 50 ms after each one, or use the `afterSelectionChange` pattern from `apps/web/e2e/sheet-editor.spec.ts`. Chord labels are placed on the next frame after a change, so check positions in a separate command.
