# Tasks

## 1. The envelope

- [x] 1.1 In `packages/chordsheet`, add `sheet-envelope.ts` with the `Sheet` type (`id`, `revision`, `title`, `artist?`, `content`), where `content` is a union by `format` with `ChordSheet` as its only member, and export it from `index.ts`. Verify with `just typecheck`
- [x] 1.2 Add `newSheetId()`, which makes 12 characters from `A–Z`, `a–z`, `0–9`, `-` and `_` with `crypto.getRandomValues`. Verify with a test for the scenario "New id"
- [x] 1.3 Add an optional `field` to `Problem`, and add `checkEnvelope(value)`. It checks the id, a whole-number revision, a title that is text and an artist that is text if present, then checks the content by its format, with `field: "content"` on content problems. Verify with tests in `sheet-envelope.test.ts` for the scenarios "Missing title", "Revision that isn't a whole number", "Id with a slash", "Problems in envelope and content" and "Unknown format", and for a valid sheet with and without an artist
- [x] 1.4 Run `just lint` and `just test` and check that both pass

## Workflow follow-up

- Archive the change after review.
- Close #48 with the pull request.
