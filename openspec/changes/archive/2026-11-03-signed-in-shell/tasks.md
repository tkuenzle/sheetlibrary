# Tasks

## 1. The top bar

- [x] 1.1 Have the root loader return `{ initial }` (the email's first letter, upper case) or `null`, and carry it in the signed-in context instead of the boolean. Verify with a unit test for the initial of ana@example.com
- [x] 1.2 Add the `arrow_back` and `logout` icons to `app/ui/icons/` and `icons.ts`, and remove `account_circle`. Verify `icon.test.tsx` passes
- [x] 1.3 In `TopBar`, drop `title` and the breadcrumb, add the back link "Library" with the arrow, and show the account as a round initial named "Account", marked current on the account page, with the canvas's top bar A looks. Verify with `top-bar.test.tsx` for scenarios "Back to the library", "No title in the bar", "Signed out" and "Signed in"
- [x] 1.4 Use the back link on the sheet page and its "Sheet not found", mark the account current on the account page, and remove `title` from `/editor`. Update `sheet.test.tsx` and the e2e tests that find "Sheet Library" on a sheet or check the bar's title (`sheet.spec.ts`, `home.spec.ts`, `editor.spec.ts`), and verify scenario "Opening the editor"
- [x] 1.5 Add a "Top bar" line to `docs/ui-text.md`: "Library" on a sheet, and the initial named "Account"

## 2. The sign-in page

- [x] 2.1 Replace the sign-in page's `TopBar` with the site's name above one card, with "Check your email" in the same card, as on the canvas's sign-in B. Make "Send link" the main button and "Sign in with a passkey" tonal, with lines beside "or". Update `sign-in.test.tsx`, and verify scenario "Sign-in page" in `e2e/account.spec.ts`

## 3. The account page

- [x] 3.1 Move the grouped-row rules from `.library-list` into `app/ui/group-list.css` and use it in the library. Verify `sheets.test.tsx` passes and the library looks unchanged with the browser-check skill
- [x] 3.2 Lay out the account page in grouped rows as on the canvas: the email row, the passkeys group with "Add passkey" under it, and "Sign out" as its own row with the `logout` icon. Keep the rename field and the "No passkeys yet." text working inside the group. Update `account.test.tsx` and verify `e2e/account.spec.ts` passes

## 4. Docs and checks

- [x] 4.1 Add the signed-in shell to `docs/design-direction.md`: top bar A, sign-in B with "Send link" as the main button, the account page's grouped rows, and the shared group-list class
- [x] 4.2 Check the library, a sheet, the account page and the sign-in page at phone width and in a wide window, in light and lamplight, with the browser-check skill. Verify they match the canvas and the phone's sheet bar fits "Library", help and the initial
- [x] 4.3 Run `just check` and `just spec-check`. Verify both pass

## Workflow follow-up

- Close #79 with the pull request. Archive the change after review.
