# Proposal

## Why

Photo import (#93) only works if a vision model reads vocal lead sheets well enough. Nobody knows that yet. This spike checks whether the strongest model is good enough, before anything is built. Picking the cheapest model that still works is the benchmark's job (#102).

## What Changes

- A bar, set before any run: fixing the result in the editor is clearly quicker than typing the song in. Per song: at most a few wrong words, at least 95% of chords with the right name, at least 90% of chords on the right syllable (one syllable off counts as wrong), no missing sections, and stacked verses split correctly.
- 4–5 songs from real songbooks, 6–7 photos. They cover one simple page (taken once well and once badly), a song over two pages, stacked verses with first and second endings, and D.S. al Coda.
- Opus 5.5 reads the photos and answers in ChordPro. It runs through Claude Code on the subscription, so no API key is needed. One prompt, improved by hand a few times.
- The owner judges each answer against the page. It is shown as chords above the lyrics, and each mistake is counted against the bar.
- Two answers for #93 and #37: should repeats be written out or kept as text, and do the pages print a composer or a performer?
- A verdict in `docs/photo-import-spike.md`: go or no-go for #93, the prompt, the counts per song, and the answers above.
- No song is committed. The photos and lyrics stay out of the repository; #37 and #93 write their own test songs.

- A first look at cheaper setups: Opus 5.5 at low effort, Sonnet 5.5 and Haiku 5.5 on three songs, with their time. The owner checks only the lines that differ from Opus at high effort.

Not in this spike: a real comparison of models, cost, wait time and photo size (#102), and the Workers CPU limit (#93).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The app's behavior doesn't change, so the change skips specs.

## Impact

- `docs/`: a new `photo-import-spike.md`.
- No code in the app.
- The photos and the corrected answers stay with the owner, outside the repository, for #102.

## Open Questions

- Which effort level Opus 5.5 runs at. The default is `medium`; reading a page may need more.
- If the verdict is no, is that the end of M5, or is Fable 5.1 tried before giving up?
- How the prompt writes "N.C." (no chord) and chords in parentheses. #37 has to read both.
- Whether the songs should come from more than one songbook, since printing styles differ.
