# Design

## Context

`packages/chordsheet` holds the content model: `ChordSheet`, and `checkSheet(content)`, which returns a list of `Problem`s located by section, line and chord. Chord sheets are the only format so far.

## Decisions

**The envelope lives in `packages/chordsheet` for now, in its own module.** A new `sheet-envelope.ts` holds the `Sheet` type, `checkEnvelope` and `newSheetId`. With one format, a separate package would only add setup. When a second format arrives, the module moves to its own package that the formats depend on. Nothing outside the module should rely on it being in `chordsheet`, so the move only changes imports.

**Names keep `checkSheet` as it is.** `checkSheet` already checks chord sheet content, and the editor and import use it. The envelope's type is `Sheet` and its check is `checkEnvelope`. Renaming `checkSheet` to `checkChordSheet` would read better, but it touches code this change has no other reason to touch.

**`content` is a union by `format`.** `Sheet.content` is typed as `ChordSheet` today, written as a union over formats so a new format adds a member. `checkEnvelope` checks the envelope fields, then picks the content check by `content.format`, and reports an unknown format.

**Envelope problems name their field.** `Problem` gets an optional `field` (`"id"`, `"revision"`, `"title"`, `"artist"` or `"content"`). Content problems keep their section, line and chord, and get `field: "content"`. One list holds both, so a caller shows them the same way.

**Ids come from `crypto.getRandomValues`.** 12 random bytes, each masked to 6 bits, pick from 64 characters (`A–Z`, `a–z`, `0–9`, `-`, `_`). 64 divides 256, so every character is equally likely. That gives 72 bits, enough that two sheets never get the same id by chance. The function works in the browser and the Worker alike, so a client can make ids later (#32).

## Risks / Trade-offs

- [A `Sheet` type in a package named `chordsheet` reads oddly.] → Accepted until a second format exists. The module boundary keeps the move small.
- [Title rules are still open (see proposal).] → The check only requires the title to be text. Rules are added to the check once decided.
