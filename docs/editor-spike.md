# Editor spike (M1)

A throwaway prototype of the chord editor at `/spike/editor`, linked from the home page. The plan is in `openspec/changes/editor-spike`.

Chords are marks on their letter. Their labels are drawn in a layer on top of the editor, outside the editable text. The first try used inline atom nodes; its results are below.

## Verdict

- **Approach for M2:** ProseMirror, with chords as marks on their letter and their labels in a layer outside the editable text. Inline atom nodes failed both stop criteria on Android: keyboard suggestions contained chord names, and the caret couldn't cross a chord. With marks, both work.
- **The rules hold:** chords move to the nearest letter when theirs is deleted or replaced, piles keep their order, chords go with whole deleted lines, and undo takes one step. The unit tests in `apps/web/app/spike/rescue.test.ts` describe these and can move to M2.
- **Placing chords:** dragging a chord, with a caret showing where it lands, works on phone and desktop and feels more natural than tapping. M2 should build on it: drag to move and to add, a hover icon on desktop, maybe tapping above a word on phones.
- **Chords on spaces are a feature.** A chord on a space means "after the text before it", at the end of a line or between words. In M2 the next word should start after such a chord's label. The chord layer can do that by widening the space.
- **No typo rule.** Retyping a deleted letter leaves its chord on the next letter.
- **Not tested:** iPhone, and Safari and Firefox on desktop. Test them early in M2, the iPhone keyboard and caret first, since that is where atoms failed on Android.
- **Rough edges:** removing a chord at the end of a line leaves its trailing space, and labels are placed one frame after each change, so the lyrics may jump briefly.

## Checklist: chords as marks

Each row is a step to try on the preview link. Start with **Reset**. "Auto" means an automated test covers it in Chromium (`apps/web/e2e/spike-editor.spec.ts`, desktop and Pixel 7 emulation). The emulation has no real phone keyboard.

| Check               | Steps                                                                                | Expected                                                                  | Chrome | Safari | Firefox | iOS Safari | Android + Gboard |
| ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------ | ------ | ------- | ---------- | ---------------- |
| Place               | **Chords**, tap the "r" in "wretch", enter "Am"                                      | "Am" above the "r"; no keyboard for the lyrics                            | auto   |        |         |            |                  |
| Change and delete   | **Chords**, tap "Cmaj7", change it to "C", OK. Tap the "D" in "relieved", **Delete** | Each step does what it says                                               | auto   |        |         |            |                  |
| Move by tapping     | **Chords**, tap the "D" in "relieved", then tap "fears"                              | "D" on the "f"                                                            | auto   |        |         |            |                  |
| Drag                | Drag "Cmaj7" onto "to", in either mode                                               | A caret shows where it lands; it lands there                              | auto   |        |         |            | pass             |
| Shortcut            | **Text**, tap before "wretch", Ctrl+K or Cmd+K, enter "Em"                           | "Em" above the "w"                                                        | auto   |        |         |            |                  |
| Type before a chord | **Text**, tap just before "grace" in line 1, type "so "                              | "G7" stays on the "g"                                                     | auto   |        |         |            |                  |
| Retype a letter     | Tap after the "l" in "relieved", Backspace, type "l"                                 | "D" stays on the "i"                                                      | auto   |        |         |            |                  |
| Replace a letter    | Select the "l" in "relieved", type "L"                                               | "D" on the "L"                                                            | auto   |        |         |            | pass             |
| Pile                | Select "grace, how sweet " in line 1, delete it                                      | "G7 C" side by side on "the"                                              | auto   |        |         |            | pass             |
| Undo and redo       | After any edit above, **Undo**, then **Redo**                                        | One press each, chords back and forth too                                 | auto   |        |         |            |                  |
| Wide chord          | **Chords**, add "Cmaj7" on the "t" and "Dsus4" on the "h" of "the"                   | Labels don't overlap, lyrics spread out                                   | auto   |        |         |            |                  |
| Line wraps          | Type words into line 1 until it wraps                                                | Every chord stays above its letter                                        | auto   |        |         |            |                  |
| Split and join      | Tap before "grace" in line 1, Enter, then Backspace                                  | "G7" moves with "grace" and back                                          |        |        |         |            |                  |
| Arrow keys          | Move the caret with the arrow keys across "relieved"                                 | One press per letter                                                      | auto   |        |         |            |                  |
| Phone keyboard      | Type inside "relieved" around the "D", use autocorrect and suggestions               | Suggestions have no chord names; "D" stays on its letter (stop criterion) | n/a    | n/a    | n/a     |            | pass             |
| Caret on phones     | Drag the caret across "relieved"                                                     | It moves past the "D" (stop criterion)                                    | n/a    | n/a    | n/a     |            | pass             |

On Android, the rows that failed with atom nodes now pass. Dragging was also tried by hand on desktop and feels more natural than tapping. Rows left empty were not re-run on marks.

## Results: inline atom nodes (first try)

Android only. Both stop criteria failed there, so the other targets were skipped.

| Check                | Steps                                                                                                                | Expected                                       | Chrome | Safari | Firefox | iOS Safari | Android + Gboard      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------ | ------ | ------- | ---------- | --------------------- |
| Place                | **Chords**, tap the "r" in "wretch", enter "Am"                                                                      | "Am" above the "r"; no keyboard for the lyrics | auto   |        |         |            | pass, hard to hit [1] |
| Change, move, delete | **Chords**, tap "Cmaj7", change it to "C", OK. Tap the "D" in "relieved", then tap "fears". Tap it again, **Delete** | Each step does what it says                    | auto   |        |         |            | pass, hard to hit [1] |
| Shortcut             | **Text**, tap before "wretch", Ctrl+K or Cmd+K, enter "Em"                                                           | "Em" above the "w"                             | auto   |        |         |            | not tested            |
| Type before a chord  | **Text**, tap just before "grace" in line 1, type "so "                                                              | "G7" stays on the "g"                          | auto   |        |         |            | pass                  |
| Typo                 | Tap after the "l" in "relieved", Backspace, type "l"                                                                 | "D" is back on the "l"                         | auto   |        |         |            | pass                  |
| Replace a letter     | Select the "l" in "relieved", type "L"                                                                               | "D" on the "L"                                 | auto   |        |         |            | fail [2]              |
| Pile                 | Select "grace, how sweet " in line 1, delete it                                                                      | "G7 C" side by side on "the"                   | auto   |        |         |            | pass [3]              |
| Undo and redo        | After any edit above, **Undo**, then **Redo**                                                                        | One press each, chords back and forth too      | auto   |        |         |            | pass                  |
| Wide chord           | **Chords**, add "Cmaj7" on the "t" and "Dsus4" on the "h" of "the"                                                   | Labels don't overlap, lyrics spread out        | auto   |        |         |            | pass                  |
| Line wraps           | Type words into line 1 until it wraps                                                                                | Every chord stays above its letter             | auto   |        |         |            | pass                  |
| Split and join       | Tap before "grace" in line 1, Enter, then Backspace                                                                  | "G7" moves with "grace" and back               |        |        |         |            | pass                  |
| Arrow keys           | Move the caret with the arrow keys across "relieved"                                                                 | One press per letter, no stuck spot at "D"     | auto   |        |         |            | n/a                   |
| Phone keyboard       | Type inside "relieved" around the "D", use autocorrect and suggestions                                               | "D" stays on its letter (stop criterion)       | n/a    | n/a    | n/a     |            | **fail** [4]          |
| Caret on phones      | Drag the caret across "relieved"                                                                                     | No stuck spot at "D" (stop criterion)          | n/a    | n/a    | n/a     |            | **fail** [5]          |

Android notes:

1. A single tap rarely hits the intended letter. Placing would feel more natural by dragging a caret and adding the chord where it is left. Same for moving.
2. With the letter selected, tapping Shift on the keyboard closes the keyboard.
3. The selection highlight covers the chords too, so it is surprising that they stay.
4. Keyboard suggestions include the chord names inside the words. Autocomplete is mostly broken.
5. The caret can't be moved across a chord. It stops before it.

## Findings so far

- **Atom nodes failed on Android; marks pass.** With atoms, keyboard suggestions contained chord names and the caret couldn't cross a chord. With marks, both work.
- **No typo rule.** Retyping a deleted letter leaves its chord on the next letter. A rule that moved the chord back onto the retyped letter was tried and dropped: it only helped in a narrow case and was hard to understand. Dragging the chord back is quick.
- **Chords at the end of a line** sit on a trailing space. Removing the chord leaves the space.
- **Chords on spaces** are allowed. Tapping a space adds a chord there.
- **Layout runs one frame after each change.** The lyrics may jump briefly when a chord is added. Watch for flicker on phones.
- **Selection timing.** ProseMirror reads a click or selection a moment after the browser changes it. People never notice, but the tests wait for it.
