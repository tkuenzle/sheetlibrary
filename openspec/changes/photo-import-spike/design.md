# Design

## Context

There is no ChordPro reader yet (#37), so answers are judged by eye. This session runs in a container that is cleared after a while, so nothing kept only here survives. The repository is public.

## Goals / Non-Goals

**Goals:**
- Runs that can be repeated: the same prompt and photos give a comparable answer.
- A prompt #93 can start from.

**Non-Goals:**
- Code that survives. Every script in this spike is thrown away.
- Real numbers for cost and wait time. The CLI reports tokens and time, and they are noted, but #102 measures them properly.

## Decisions

**Run through headless Claude Code.** Each song is one call: `claude -p` with Opus 5.5, the prompt as the whole system prompt, no tools, and the photos as image blocks in one user message, in page order (`--input-format stream-json`). That is close to the API call #93 will make, and it runs on the subscription. Alternatives:
- *Reading the photos in this conversation*: the answer would depend on everything said here, so it can't be repeated, and the prompt can't be tested on its own.
- *The API through AI Gateway*: costs money and gives real numbers, which is #102's job.

The owner sends the photos as JPEG, at most 2576 px on the long edge. That is the most Opus 5.5 reads, so larger photos would only be shrunk on the way. The owner keeps the originals, so #102 can make other sizes from them. A test showed that Claude Code shrinks images to about 2000 px on the long edge before the model reads them, while the API reads a 4:3 photo at up to about 2236 px. So the run script shrinks each photo to 2000 px itself, and the model reads exactly what was sent. That makes the spike a slightly harder test than #93.

**The prompt asks for the page as a musician would play it.**
- The melody is dropped. Each chord goes in `[ ]` right before the syllable under the note it sits above. Syllable hyphens and extender lines are removed.
- Each stacked verse becomes its own section, with the same chords.
- Verses and first and second endings are written out, so verse 1 takes ending 1. D.S. and Coda are kept as `{comment: …}` lines. This is a first guess. The spike checks it, and the verdict says if it should change.
- The title goes in `{title}`. The credits go in `{composer}` and `{lyricist}`, as printed, and there is no `{artist}`, so the results show what pages print.
- The answer is ChordPro only, with no text around it.

**At most three prompt rounds.** After each round the prompt only changes for mistakes seen in more than one song, so it doesn't get tuned to a single page. The verdict uses the last round's counts and says what each change fixed.

**Review as chords above the lyrics.** A throwaway script in the scratchpad turns each answer into plain text with a chord line above each lyric line. The owner compares it with the page and lists each mistake: a wrong word, a wrong chord, a chord on the wrong syllable, or a wrong section. Chord shares are counted against the chords printed on the page.

**What is kept where.**
- Photos and answers: only in the session's scratchpad. The raw answers and any corrected versions are sent back to the owner as files, so they survive for #102.
- The repository: `docs/photo-import-spike.md`, with the prompt, the counts per song and findings described in words, without quoting lyrics.

## Risks / Trade-offs

- [Tuning the prompt on the same pages makes the results look better than they are] → Change it only for repeated mistakes, and say so in the verdict. #102 can add new songs.
- [A chord one syllable off is easy to miss] → Check the chords one at a time against the page, not by reading the whole song.
- [Headless Claude Code is not a plain API call. It may shrink images or add its own context] → Check on the first run. #102 uses the real API.
