# Design

## Context

The dialog has one hidden `<input type="file" accept="image/*" multiple>` behind a tonal button. The dialog's content renders only after "From photos…" is clicked, so it is always rendered in the browser, never on the server. The unit tests render `PhotoImportView` to a string.

## Decisions

**"Take photo" is a second input with `capture="environment"`, not one input with a wider `accept`.** `accept="image/*,text/plain"` brings Android's camera back too, but no one documents it, and it lets people pick any file.

**Show "Take photo" where `'capture' in HTMLInputElement.prototype`.** What matters is whether the browser acts on `capture`, not whether the device has a camera or a touch screen. Desktop Chromium 156 gives `false`. Chromium turns `capture` on only in its Android build, and WebKit only on iOS. Other options:
- `(pointer: coarse)`: Windows tablets count as touch, and there "Take photo" would only open a second file picker.
- `navigator.mediaDevices.enumerateDevices()`: says whether a camera exists, so a desktop webcam counts too. It is also async.

The form works this out once, and passes it to `PhotoImportView` as a prop. The view's tests can then render both cases without stubbing the browser. No hydration flash, since the content is never rendered on the server.

**"Take photo" is tonal, and "Pick photos" a text button with its icon.** Import is the dialog's one filled button, and a second filled button would compete with it once there are pages. A text button is also narrower, which helps at 360px. Without "Take photo", "Pick photos" is tonal, as "Add photos" is now. "Take photo" keeps `addAPhoto`, and "Pick photos" gets Material's `photo_library`.

## Risks / Trade-offs

- [A browser has `capture` but ignores it, so "Take photo" opens a file picker.] → It still adds a photo. Check desktop Safari and Firefox on the preview.
- [A browser acts on `capture` but doesn't show the property.] → It shows only "Pick photos", as today.
