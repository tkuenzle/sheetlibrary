# Tasks

## 1. The two buttons

- [x] 1.1 Add Material's `photo_library` icon to `app/ui/icons.ts` as `photoLibrary`; verify `icon.test.tsx` passes
- [x] 1.2 Rename "Add photos" to "Pick photos", and give `PhotoImportView` a prop for whether the browser supports `capture`, worked out in the form from `HTMLInputElement.prototype`; verify with the dialog's tests, renamed
- [x] 1.3 With `capture`, show "Take photo" first: a tonal button with `addAPhoto` over an input with `accept="image/*"` and `capture="environment"`, which adds its photo as the next page. "Pick photos" becomes a text button with `photoLibrary`. Without `capture`, "Pick photos" stays tonal alone. Verify with dialog tests for both cases, and that both buttons are disabled at 10 pages
- [x] 1.4 Lay out the buttons in the empty well and the add row, and fix the `AddPhotos` comment; verify in the browser at desktop and 360px width, with `capture` faked on for the phone
- [x] 1.5 Update the dialog's words in `docs/ui-text.md`; verify the dialog's text matches the page
- [x] 1.6 Update the canvas's "Photo import" note so it no longer says "Add photos" offers the camera; verify by reading the page back

## 2. Checks

- [x] 2.1 Run `just check` and `just e2e`; verify both pass
- [ ] 2.2 On the preview, take a song's pages with "Take photo" on Android 14 or later and on an iPhone; verify the back camera opens and each photo is added as the next page
- [ ] 2.3 On the preview, open the dialog in desktop Chrome, Safari and Firefox; verify none shows "Take photo"

## Workflow follow-up

- Open the pull request that closes #109.
- Archive the change once it is merged.
