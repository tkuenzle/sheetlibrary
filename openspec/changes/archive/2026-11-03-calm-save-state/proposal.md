# Proposal

## Why

While someone types, the sheet page says "Saving…" the whole time, even though nothing is being sent (#86). Autosave waits for a 1-second pause, and both the wait and the save read "Saving…". It also never saves during a long stretch of typing, because a save only goes out after a pause.

## What Changes

- While someone keeps typing, a save still goes out at the latest 5 seconds after the first edit that isn't saved yet. A pause of 1 second still saves sooner.
- The status beside the title only speaks when there is something worth knowing:
  - While edits wait for their save, it says nothing. Its space stays, so nothing moves.
  - "Saving…" shows only when a save takes longer than a moment.
  - "Saved" shows once everything has stayed saved for a moment. While someone keeps typing, it doesn't flash between saves. When the page opens, "Saved" shows right away.
  - "Not saved yet. Trying again…" and "Not saved" show at once, as today.
- The leave warning is unchanged. It still follows the real save state, not what the status shows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `sheet-page`: edits save at least every 5 seconds while someone types, and the save state only shows "Saving…" for a slow save and says nothing while edits wait.

## Impact

- `apps/web/app/sheets/autosave.ts`: the longest wait.
- `apps/web/app/routes/sheet.tsx`, `apps/web/app/routes/sheet.css`: what the status shows, and its space when it's empty.
- `apps/web/e2e/sheet.spec.ts`: the save test no longer expects "Saving…" while typing.
- `docs/ui-text.md`: the "Saving a sheet" line.
- No API change, no migration, no new dependencies.

## Open Questions

- After a failed save gets through, the status goes blank and then shows "Saved" a moment later, like any other save. Is that fine, or should "Saved" replace the failure note at once?
