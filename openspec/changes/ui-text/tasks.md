# Tasks

## 1. Voice and glossary

- [x] 1.1 Write `docs/ui-text.md`: the voice, the glossary with the words each term replaces, and the toolbar and key names as they are. Say it covers what users see and hear, not code or specs. Verify every rule and word in the proposal and specs is in it.
- [x] 1.2 In `docs/design-direction.md`, say the canvas is the source for layout and looks, and `ui-text.md` for words. Verify the "Mockup files in the repo" section and the canvas line at the top agree.

## 2. Text in the app

- [x] 2.1 Rewrite the help in `editor/help.tsx` as in the design's table: "cursor", "edit", no periods on help lines. Verify the help e2e tests, updated, read the new lines, and no "caret" or "change" is in the help.
- [x] 2.2 Rename the chord input's buttons to "Done" and "Remove" in `editor/sheet-editor.tsx`. Verify the chord input e2e tests use the new names and "Remove" only shows when editing a chord.
- [x] 2.3 Drop "you can" from the home page's text. Verify `home.spec.ts` and the unit test still find the "coming soon" text.

## 3. Badge word

- [x] 3.1 In `chord-editor`'s `style.css`, read the badge's word from `--chord-editor-section-name` with an empty fallback, and update the comment and the list of properties. Set it to `"Section "` in the app's `sheet-editor.css`. Verify the "section numbers" e2e test still reads "Section 1", "Section 2", "Section 3".
- [x] 3.2 In `chord-editor`'s `style.css`, set `content: counter(section)` first and the rule with the alternative text inside `@supports (content: "a" / counter(a))`, so Firefox shows the badge. Check it with Playwright's Firefox and WebKit in a one-off script, not a new project. Verify Firefox shows the badge with the number, Chromium's e2e tests still read "Section 2", and note WebKit as untested if it can't run.

## 4. Wrap-up

- [x] 4.1 Delete `docs/design/` and its `.prettierignore` entry, and drop the folder's mentions from `docs/design-direction.md` and `docs/roadmap.md`. Verify `git grep "docs/design/"` finds nothing outside the archive.
- [x] 4.2 In `docs/roadmap.md`, mark the UI text step and M2g done, with what the step decided. Verify it matches `design.md`.
- [x] 4.3 Run `just check`. Verify it passes.
- [x] 4.4 After pushing, open `/` and `/editor` on the pull request's preview link. Verify the new help, the chord input's buttons and the home text show.

## Workflow follow-up

- Archive the change after review, in the same pull request.
