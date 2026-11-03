# Design

## Context

`Autosave` in `apps/web/app/sheets/autosave.ts` is a debounce: every edit restarts a 1-second timer, and one save is in flight at a time. The page shows its state through `SaveStatus` in `routes/sheet.tsx`. The leave warning is on in every state except `saved`.

## Decisions

**The longest wait lives in `Autosave`.** It keeps the time of the first edit that no save has sent yet. Each edit schedules the save for the earlier of "1s from now" and "5s after that first edit". A save clears it as it sends. Edits made during a save start a new one, so after the save returns, they still go out within 5 seconds of the first of them. The retry backoff after a failure is unchanged.

**What the status shows is worked out separately, from the real state.** `Autosave` keeps reporting the true state, so the leave warning stays right. A small hook beside `SaveStatus` turns that state into what is shown:

| Real state                     | Shown                                                 |
| ------------------------------ | ----------------------------------------------------- |
| `waiting`                      | nothing                                               |
| `saving`                       | what was shown; "Saving…" once it has lasted 500ms    |
| `saved`                        | "Saved" once it has lasted 1s; at once on page load   |
| `failed`, `conflict`, `deleted` | its text, at once                                    |

Any change of the real state cancels a pending delay. A save follows a wait, which shows nothing, or a failure, whose note stays during the retry so it doesn't blink. Doing this inside `Autosave` would mean adding states that only exist for the screen. That makes the save loop harder to reason about, and the leave warning would have to tell the two kinds of state apart.

**An empty status keeps its space.** The `<p>` stays in the title row with a minimum height of one line. On a phone, the status can wrap onto its own line, and that line must not come and go with each edit.

**The status stays a live region.** It's blank while someone types, so screen readers hear nothing then. They hear "Saved" when the person stops, "Saving…" for a slow save, and failures at once.

## Risks / Trade-offs

- [For about 1 second after a save, nothing says it's saved.] → Accepted. It's what keeps "Saved" from flashing during long typing.
- [Hidden timers make the status harder to test.] → The hook and `Autosave` are tested with fake timers. The end-to-end test slows the save with a route delay to see "Saving…".
