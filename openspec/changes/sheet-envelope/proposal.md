# Proposal

## Why

Today a sheet is only its content. The library (#51) and storage (#50) need a title, an author line and an id around it, the same for every format. Chord sheets and later formats such as MusicXML are too different to share one content model, so the shared part goes in an envelope around the content (#48).

## What Changes

- A sheet is an envelope: an id, a revision, its details and its content. Library features use only the envelope. The content is format-specific, such as `{ format: "chordsheet", ... }`.
- The details are a title, which is required, and an artist, which is optional. The artist is the performer.
- The line shown under a title is worked out from the details when shown. It is never stored.
- The revision is a whole number in the envelope. Storage (#50) uses it to refuse stale writes and raises it on every save.
- The id is a short random string that is safe in a URL. The model can make a new one.
- The model checks an envelope and its content, and reports each problem.
- The envelope has no version number of its own. The content keeps its own version.

Not part of this change:

- The key. #58 stores it in the content and copies it into the envelope.
- Composer and lyricist. They come later, as their own fields, when the details form grows.
- Created and updated times. They are storage facts and come with #50.

## Capabilities

### New Capabilities

- `sheet-envelope`: the parts of a sheet that are the same for every format, and the rules they follow.

### Modified Capabilities

None.

## Impact

- `packages/chordsheet`: a new `Sheet` type, a check for it, and a function that makes a new id.
- No change to the app or the editor yet. Nothing is stored, and `/editor` keeps its seed song.

## Open Questions

- Title rules: may it be blank, may it have line breaks, and how long may it be?
- What title does an imported sheet get? The Ultimate Guitar paste has no title we read.
- Should `/editor` build its seed song as an envelope now, so its title is no longer a constant?
- Should old revisions be kept as a history? The revision number alone doesn't do that.
- Are composer and lyricist text, or lists of names? This matters once you can filter by person.
- What revision does a new sheet start at?
