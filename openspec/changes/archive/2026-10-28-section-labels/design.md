# Design

## Context

A section is a ProseMirror node with lines and no attributes. Its number badge is a CSS `::before` with a counter, so it holds no data and can't be clicked. The chord input shows how the package and the app split work: the package tells the app where to open it (`onAddChord`, `onChordClick` with an anchor), and the app renders it in a `Popover`. A click inside the sheet's frame doesn't end editing.

## Goals / Non-Goals

**Goals:**
- Store the label on the section, draw it in the package, edit it in the app.

**Non-Goals:**
- Labels in pasted text or in copied and pasted sections. Pasted sections start without a label; `[Chorus]` headers come with the import.

## Decisions

**The label is an attribute of the section node.** `section` gets `label: string | null`, default `null`. A label node inside the section was the other option: the user would type it like lyrics. It would bring new rules for the caret, split, join, selection, chords and clean-up, for a field set once per section. An attribute is changed with `setNodeMarkup`, which is one undo step. The caret is in the section while its label is edited, so undo puts it back there and the section becomes active, as other undos do.

**The model stays at version 1.** `Section` gets `label?: string`, left out when there is no label. Nothing is stored yet, so a new version would only add work. The adapter copies the label both ways and writes it only when it is set.

**The package draws the label row with a node view.** The section's node view has a row that isn't editable, then the lines as its content. The row holds the label, "Add label" in the active section, or nothing, and always has the same height. Content outside the node view's content can't take the caret, so arrow keys skip it, as they skipped the badge. A widget decoration was the other option, but the caret can stop next to a widget. A `::before` with `attr()` can't hold a button. The badge counter, its `::before` and `--chord-editor-section-name` go away.

**The app renders the label field over the label.** A click on the active section's label or on "Add label" calls a new option, `onLabelClick`, with the section and the label's box. The app lays a text field with the label's size and font over it, with the suggestions below as a listbox (a combobox). Keeping it calls a command that sets or clears the label of that section. This is the chord input's split: the app holds the words, the package holds the document. The field is inside the sheet's frame, so clicking it doesn't end editing. The "Add label" word comes from the app through the custom property `--chord-editor-add-label`, as the badge's word for screen readers did, since the package holds no UI text.

**Split clears the label, join keeps the first.** `tr.split` copies the node's attributes, so the split passes the new section's type with `label: null`. `tr.join` keeps the attributes of the node before, which is what the spec asks, so join needs no change.

**The shortcut is Ctrl+Shift+L, or ⌘⇧L on a Mac.** Ctrl+K is taken by the chord input, and L stands for label. Safari uses ⌘⇧L for its sidebar, but a page that handles the key first keeps it, as Google Docs does for left align. The package handles the key like Ctrl+K: it calls `onLabelClick` for the active section. When the field closes, the app gives the focus back to the editor, which still holds its selection, so the cursor is where it was.

**Clean-up lives in the model.** `cleanUpSection` also cleans up the label, so a kept label, a loaded sheet and a handed-back sheet follow the same rules. The editor normalizes the label to NFC when it writes it, as it does lyrics. The 40-character limit counts UTF-16 code units, like `maxlength` and the chord positions, and the field enforces it with `maxlength`.

**The field grows with its text.** It uses `field-sizing: content` where the browser has it, and otherwise sets the input's `size` from the text's length.

## Risks / Trade-offs

- [Focus moves to the field, out of ProseMirror] → The active section must not end editing or be cleaned up while the field is open. Reuse what keeps the chord input open, and cover it with an e2e test.
- [Taller sections] → Every section gets a label row, empty or not. The badge's 72px left padding goes, so the lyrics get that width back.
- [A browser keeps Ctrl+Shift+L or ⌘⇧L for itself] → Check the key in Chrome, Safari and Firefox before building on it, and pick another if one of them takes it.
- [Two kinds of "label" in the code] → Chord labels already exist. Name the new things "section label" everywhere, in code, CSS hooks and tests.
