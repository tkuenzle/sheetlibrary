# Design

## Context

The editor keeps chords out of its text so the text stays editable. Its chord layer measures each letter in the browser and places labels on top at pixel positions (`packages/chord-editor/src/chord-layer.ts`). That needs JavaScript after load, and it prints badly: the labels don't move with their lines across a page break, or when lines rewrap at paper width. A read-only view has no editable text, so its chords can sit in the text flow.

A spike checked the approach with the real font in Chromium and Safari, on screen and in an A4 PDF. The decisions below came out of it.

## Goals / Non-Goals

**Goals:**
- The server HTML is the final layout. The browser only renders it, so print and narrow screens work by construction.
- The view shares nothing with the editor's layout code.

**Non-Goals:**
- Looking the same as the editor.
- Full text shaping and kerning.

## Decisions

### Flow layout, not the editor's chord layer

Chords are part of the HTML, next to their lyrics. CSS lays them out.

Alternative: take the chord layer out of ProseMirror and run it on the view. Its layout matches the editor exactly, and it handles kerning and any font. But it needs JavaScript after load, and print breaks unless it runs again at paper width. Taking it apart also risks the editor's best-tested code.

### In the web app, not in a package

The view lives in `apps/web/app/sheet-view/`: a pure `layoutSheet(sheet, widths)` that returns rows of units and pieces, a React component that renders them, its CSS and the width table.

Why: it uses no ProseMirror, so it doesn't belong in `chord-editor`. Its widths and sizes are tied to the app's font, so it doesn't belong in `chordsheet` either.

### Units and pieces

A line is a row of units. A unit never breaks, so a line wraps only between units. A unit is a row of pieces. A piece is a column: a chord row of fixed height, with the piece's chords side by side, over a lyrics row. CSS makes a piece as wide as the wider of the two rows. So a chord pushes the lyrics after it only when its name is wider than its piece's text.

A new unit starts after a piece whose text ends with a space. Text without chords is split into words, each with the spaces after it.

### Where a chord's piece ends

- A single chord on a letter: the piece runs from the chord to the next chord. If the text gets wider than the name plus the label space and a 0.15em margin first, it ends at the first space after that point. The rest is plain words, which wrap freely.
- Several chords on one letter, a chord on a space, or a chord at the end of the line: the piece holds that one character, or nothing at the end. The next letter then starts past the names.

Why: a long stretch of lyrics can't run into the next chord, so only its start needs to stay with the chord. Ending the piece at a space keeps long lines wrapping as normal.

### The server decides the dashes

A piece whose text ends inside a word gets a dash if its names are wider than its text minus 0.15em. That piece also gets a `min-width` of its text's width plus 0.6em. Every other piece gets no dash.

The dash is a border, not a background, since browsers leave backgrounds out when printing. Its width is the gap minus 0.24em, from 0 up to 1.2em. A gap that opens in some browser where the table expected none gets no dash.

Why: browsers lay text out a little differently. In the spike, gaps that are zero in Chromium opened by a fraction of a pixel in Safari, and showed as hairline dashes. Erring toward a full dash was preferred to a visible space.

### A table of letter widths

`apps/web/scripts/font-widths.ts` reads the two `@fontsource-variable/schibsted-grotesk` files (Latin and Latin Extended). It writes each character's width in em, at weight 400 and weight 700, to `apps/web/app/sheet-view/font-widths.json`. The JSON is committed, and the script runs again only when the font package changes. A character missing from the table counts as 1em wide. A wrong guess then gives extra space, never an overlap.

`fontkit` can't set the weight of a woff2 file: it returns empty glyphs. So the script unpacks the files to TTF with `wawoff2` first. Both are dev dependencies only.

The table has no kerning. In the spike, the widths were within 0.07em of Chromium's. The 0.15em margin covers that.

### Sizes fixed in em

The view sets its own sizes as fixed shares of its font size: chord names at 0.75em and weight 700, 0.3em of space after a name. The table only fits these values, so the view doesn't use the app's chord-size tokens. Those have different ratios on a phone (14/18) than on a desktop (15/20). The view's font size can change freely.

### Even rhythm

Every piece has the chord row, with or without chords. A line without lyrics gets no lyrics row.

### Print

Each line has `break-inside: avoid`, so its chord row and its lyrics stay on the same page. A section's label has `break-after: avoid`, so it stays on the page of its first line. Other print styles, such as margins and forcing the light style, are for #31.

### The home card

`SampleSheet` keeps its card, its title and its tilt. Inside it, the view shows `seedSong.sections[0]`. The badge, the static pieces and the test that only allowed simple lines go.

### Tests

Unit tests cover `layoutSheet`: where pieces end, piles, chords on a space, the dash and its minimum, and chords-only lines.

An e2e test opens a harness page with the spike's test lines at 320, 480 and 800px. It checks that:
- no chord names overlap,
- there is no space after a piece unless the next piece has chords,
- every space inside a word is at least 0.6em,
- the page doesn't scroll sideways,
- the table's widths are within 0.1em of the browser's.

The last check fails if someone changes the font, the chord weight or the size ratio without running the script again.

## Risks / Trade-offs

- [Two layouts, the editor's and the view's] → Accepted. The view doesn't have to look like the editor, and the e2e test guards the view.
- [Browsers measure text a little differently] → CSS works out the real collisions in every browser. The table only decides cuts and dashes, with a 0.15em margin and the dash guard.
- [Scripts outside the table] → Their letters count as wide: extra space, no overlap.
- [A chord name wider than the whole line on a very narrow screen] → It overflows. Noted in the proposal's Open Questions.

## Migration Plan

None. Stored sheets don't change.
