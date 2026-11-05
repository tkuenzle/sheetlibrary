# Photo import spike (M5)

Can a vision model read songbook pages well enough for photo import (#93)? This spike ran real pages through Opus 5.5 and judged the answers by hand. The plan is in `openspec/changes/photo-import-spike`. The photos and the answers stay with the owner, outside this repository, since the pages are under copyright. The benchmark (#102) reuses them.

## Verdict

- **Go.** Opus 5.5 passed the bar on all six songs. Fixing a result in the editor is much quicker than typing the song in: across 355 chords there was one chord a syllable off, and no wrong word or chord name.
- **It reads more than lead sheets.** Piano-vocal scores, a song over seven pages, a page photographed at an angle and a clean PDF all worked with the same prompt.
- **Cost is not a blocker.** With Opus 5.5 at high effort, a song costs about 7 to 30 cents at API prices and takes 20 seconds to 2 minutes.
- **Start #93 with Opus 5.5 at low effort.** On three songs it matched high effort except for one dropped letter and one chord a syllable off, and it was faster. The benchmark (#102) picks the final model and effort.
- **Repeats are written out in the order they are sung.** Stacked verses, first and second endings, and D.S. al Coda all become sections in the order a singer goes through them. A `{comment: …}` line keeps each repeat sign where the page prints it.
- **The pages print songwriters, rarely a performer.** Three songs name only the songwriter, two name music and lyrics separately, and one names only the band. The prompt fills `{composer}` and `{lyricist}` from the credits, and `{artist}` only when the page names a performer.

## Results

Opus 5.5, effort high. The owner checked every answer against the page. "Chords" counts every chord in the answer, including repeated verses.

| Song                          | Pages | What it tests                                          | Chords | Wrong words | Right chord name | On the right syllable | Sections | Time  | Cost  |
| ----------------------------- | ----- | ------------------------------------------------------ | ------ | ----------- | ---------------- | --------------------- | -------- | ----- | ----- |
| Es schneiet uf de Beerge scho | 1     | stacked verses, first and second endings               | 17     | 0           | 100%             | 94% (1 off)           | right    | 30 s  | $0.08 |
| Marrini, Marruni, Marroni     | 1     | verses printed as text below the music                 | 36     | 0           | 100%             | 100%                  | right    | 22 s  | $0.07 |
| I Just Can't Wait to Be King  | 7     | piano-vocal score, singers, spoken lines, key change   | 92     | 0           | 100%             | 100%                  | right    | 88 s  | $0.29 |
| House of the Rising Sun       | 3     | clean PDF, six verses                                  | 103    | 0           | 100%             | 100%                  | right    | 65 s  | $0.18 |
| Drüü Könige                   | 1     | photo at an angle, stacked verses, refrain with repeat | 39     | 0           | 100%             | 100%                  | right    | 120 s | $0.27 |
| At the End of the Day         | 5     | D.S. al Coda, stacked verses, endings                  | 68     | 0           | 100%             | 100%                  | right    | 61 s  | $0.21 |

The one chord a syllable off sat on a one-letter article instead of the noun after it.

Costs use the list prices of Opus 5.5 ($4 per million input tokens, $20 per million output tokens) on the measured tokens. Each page is about 3,900 input tokens at 2000 px. Thinking makes up 75–95% of the output, so it costs the most. A badly taken photo costs more than extra pages: the angled page needed 11,700 thinking tokens and 2 minutes, while seven straight pages needed 7,500 and 88 seconds.

The verses printed as text had no chords on the page. The model put the chords on them from the melody of the first verse, and the owner found them all right.

## Cheaper setups

A first look on three songs, with the same prompt. The owner judged only the lines that differed from Opus 5.5 at high effort.

| Setup            | Es schneiet (1 page) | Drüü Könige (angled photo) | At the End of the Day (5 pages) | Differences                                                                             |
| ---------------- | -------------------- | -------------------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| Opus 5.5, high   | 30 s, $0.08          | 120 s, $0.27               | 61 s, $0.21                     | reference                                                                               |
| Opus 5.5, low    | 33 s, $0.09          | 43 s, $0.10                | 54 s, $0.19                     | one dropped letter, one chord a syllable off; the To Coda mark moved to the second pass |
| Sonnet 5.5, high | 42 s, $0.06          | 229 s, $0.32               | 208 s, $0.33                    | a few misread letters; kept the D.S. section in page order                              |
| Haiku 5.5, high  | 94 s, $0.01          | 153 s, $0.02               | 328 s, $0.04                    | lines of the wrong length, chords shifted, sections mixed up: below the bar             |

At high effort, Sonnet and Haiku thought far longer than Opus (up to 80,000 thinking tokens), so they were slow and Sonnet was no cheaper. #102 should try them at low effort, and Sonnet with thinking turned off, which the CLI could not set.

## How it was run

- Each song was one call to Claude Code in headless mode (`claude -p`) with the prompt as the whole system prompt, no tools, and the photos as images in page order. It ran on the subscription, so no API key was needed.
- Claude Code shrinks images to about 2000 px on the long edge before the model sees them, so every photo was sent at 2000 px. The API reads a 4:3 photo at up to about 2236 px, so #93 can send a little more.
- Answers were shown as chords above the lyrics, and the owner listed each mistake.

## Prompt changes

| Version | Change                                                                                                             | Why                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 1       | First prompt                                                                                                       |                                                                    |
| 2       | Lines follow musical phrases, not the staves on the page; a word is never split across lines                       | Both first songs ended lines with pickup words and split a word    |
| 3       | Verses printed as text get chords from the melody                                                                  | The model did this on its own; the owner wants it                  |
| 4       | D.S. sections in the order they are sung; spoken lines and singers as comments; `{artist}` for a printed performer | Owner decisions after the piano-vocal and D.S. songs. **Not run.** |

## Final prompt

Version 4. Its last three rules were added after the runs and are untested.

The prompt now lives in `packages/chordsheet/src/photo-answer-prompt.ts`, next to the reader for its answers (#37). It was edited there to ask only for what a chord sheet can hold: no comments, composer or lyricist, `[[C]]` for optional chords, repeats written out, and spoken words as plain lines. Those edits have not been run yet. The version below is the one from the spike.

```text
You turn photos of a song from a vocal songbook into a chord sheet in ChordPro.

The photos show one song, in page order. Each page is a lead sheet: a melody staff, the lyrics under the notes, and chord symbols above the staff. A chord sheet keeps only the lyrics and the chords. Drop the melody.

## Chords

- Put each chord in square brackets right before the first letter of the syllable sung on the note under the chord: `A[D]mazing [G]grace`.
- If no syllable starts under the chord, because the note is held, tied or a rest, put the chord right after the last syllable sung before it, before the space: `grace[D7] how`.
- Bars with chords but no lyrics, such as an intro, an interlude or an ending, go on their own line with only chords: `[C] [G] [C]`.
- Copy each chord as printed, with `b` for flat and `#` for sharp. Write `-` as `m`, `Δ` as `maj7`, `ø` as `m7b5` and `°` as `dim`. Keep a slash for the bass note: `C/E`.
- Write "N.C." (no chord) as `[N.C.]`. Write a chord printed in parentheses as `[(C)]`.

## Lyrics

- Copy the lyrics as printed, in their language, with their punctuation.
- Join the syllables of each word. Leave out syllable hyphens, extender lines and verse numbers.
- Break the lyrics into lines by musical phrase, not by the staves on the page. A phrase is usually 2 or 4 bars and ends where a sentence or clause of the lyrics ends. Choose the length that fits the song, and keep it the same through the song.
- Never split a word across lines. A pickup (upbeat) belongs to the line of the phrase it starts.

## Sections

- Put each part of the song in a section, with the label printed on the page if there is one, otherwise "Verse 1", "Verse 2", "Chorus", "Bridge" and so on:
  `{start_of_verse: Verse 1}` … `{end_of_verse}`, `{start_of_chorus: Chorus}` … `{end_of_chorus}`, `{start_of_bridge: Bridge}` … `{end_of_bridge}`. Use `{start_of_part: Intro}` … `{end_of_part}` for anything else.
- When several verses are stacked under one staff, write each verse as its own section, in order, with the same chords on its own syllables.
- Verses printed below the music as plain text, without notes or chords, are sections too. Put the chords on them as the melody gives them: each line of such a verse is sung to the matching line of the first verse.
- First and second endings: write the passage out once for each time it is sung, with the ending that belongs to it. Verse 1 takes the first ending, verse 2 the second.
- A plain repeat with the same lyrics: write the passage once, then the line `{comment: Repeat}`.
- D.S., D.C., Segno, Fine and Coda: write the sections in the order they are sung, following the jumps. A stacked verse that is sung on the second pass goes where that pass is sung. Keep a line such as `{comment: D.S. al Coda}` where each sign is printed, and put the coda in its own section labeled "Coda".
- Lines that are spoken, not sung, go on a line of their own: `{comment: Spoken: …}`.
- When the page names who sings, such as "Anna:" or "Chorus:", put a line `{comment: Anna}` before the part they sing.

## Details

- Start with `{title: …}` from the page.
- Copy the credits as printed into `{composer: …}` for the music and `{lyricist: …}` for the words. "Words and Music by" fills both. If the page names a performer, such as a band or a singer, put it in `{artist: …}`. Leave out the copyright notice.
- If you can't read something, write your best guess.

Answer with the ChordPro text only, with no code fence and nothing before or after it.
```

## For the next changes

- **#37, reading ChordPro:** answers use `{comment: …}` lines for repeat signs, spoken lines and singers, and the chord sheet model has no comment lines yet. Pages can name several lyricists, so `{lyricist}` can appear more than once. Section labels come from the page in its language, such as "Strophe" and "Refrain". `[N.C.]` and `[(C)]` need reading too.
- **#93, photo import:** send all pages of a song in one call; seven pages worked. Show progress, since a hard page can take two minutes. The prompt above is the starting point, and `{artist}` stays empty unless the page names a performer.
- **#102, benchmark:** the six songs and their corrected answers are with the owner. Try Opus 5.5 at low and medium effort, Sonnet 5.5 at low effort and with thinking off, and photo sizes below 2000 px.
