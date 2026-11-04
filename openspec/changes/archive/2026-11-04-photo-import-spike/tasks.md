# Tasks

## 1. Set up the runs

- [x] 1.1 Write the first prompt as in design.md, in the scratchpad. Settle the effort level and how "N.C." and chords in parentheses are written with the owner. Verify the owner has read the prompt
- [x] 1.2 Write the run script in the scratchpad (`claude -p`, Opus 5.5, prompt as the whole system prompt, no tools, photos as image blocks). Verify on one photo that it answers in ChordPro only, that the image reaches the model without being shrunk further, and that tokens and time are reported. Checked on a drawn test page: Claude Code shrinks images to about 2000 px, so the script shrinks them to that itself
- [x] 1.3 Write the script that shows ChordPro as chords above the lyrics. Verify on a hand-written example with a pile, a chord after the last letter and a chord-only line

## 2. Photos

- [x] 2.1 Get the photos from the owner as JPEG, at most 2576 px on the long edge, with a list of songs, their pages and features. The owner keeps the originals for #102. Verify the songs cover every feature in the proposal, every page is upright, and the photos are only in the scratchpad

## 3. Runs and review

- [x] 3.1 Run round 1 on every song and send each answer to the owner, shown as chords above the lyrics. Verify each song has an answer
- [x] 3.2 Count the owner's marked mistakes against the bar, per song. Verify every song has its four counts
- [x] 3.3 Change the prompt only for mistakes seen in more than one song, and run again. At most three rounds in total. Verify each change is noted with what it fixed. No mistake repeated; the owner's decisions on line breaks, verses printed as text, D.S. order, spoken lines, singers and `artist` went into the prompt, and the owner decided against a final run, so the last three rules are untested
- [x] 3.4 Run Opus 5.5 at low effort, Sonnet 5.5 and Haiku 5.5 on Schneiet, Drüü Könige and End of the Day with the same prompt, and show the owner only the lines that differ from Opus at high effort. Verify each run has its time and tokens and the owner's verdict on the differences
- [x] 3.5 Send the owner the raw answers and any corrected versions as files. Verify the owner has them outside the session

## 4. Verdict

- [x] 4.1 Write `docs/photo-import-spike.md`: go or no-go against the bar, the final prompt, the counts per song, the prompt changes, the answers on repeats and on composer or performer, the tokens and time noted, and the first look at cheaper setups. Verify it quotes no lyrics
- [x] 4.2 Draft updates to #93, #37 and #102 from the verdict, such as how D.S. and Coda come in and what fills `artist`. Verify the owner agreed before any issue is edited

## Workflow follow-up

- Archive the change once the verdict is merged.
- If the verdict is no, decide with the owner what happens to M5.
