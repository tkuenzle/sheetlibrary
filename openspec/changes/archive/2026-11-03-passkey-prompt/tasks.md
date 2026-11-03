# Tasks

## 1. When to offer

- [x] 1.1 Change `askForLink`'s `callbackURL` to `/sheets?passkey`. Verify with a unit test of the request it sends, if `auth-client.ts` has one, or in 3.1
- [x] 1.2 Add `hasPasskey(db, userId)` reading the `passkey` table. Verify with a unit test for an account with and without a passkey
- [x] 1.3 Have the library's loader return `offerPasskey`: true only with `passkey` in `url`, no `passkey-offer=closed` cookie and no passkey on the account. Verify with loader tests in `sheets.test.tsx` for scenarios "First email sign-in" and "Account with a passkey", the closed cookie, and a load without `passkey`

## 2. The card

- [x] 2.1 Add the `PasskeyOffer` card to the library, under the heading and above the list or "No sheets yet", with the text, the link "Add passkey" to `/account` and "Close", as on the canvas's "Passkey offer" boards. Drop `passkey` from the address once shown. Verify with `sheets.test.tsx` that the card renders with `offerPasskey` and not without, and that the link goes to `/account`
- [x] 2.2 Wire "Close" to set the `passkey-offer=closed` cookie and hide the card. Verify with a unit test that "Close" sets the cookie and hides the card
- [x] 2.3 Add the offer's words to the "Library" line in `docs/ui-text.md`, and the card to "The signed-in shell" in `docs/design-direction.md`

## 3. Checks

- [x] 3.1 In `e2e/library.spec.ts`, build the mark into the landing URL with `URL` so `?passkey` stays, expect the landing URL `/sheets?passkey`, and check the offer after the first sign-in, that "Add passkey" opens `/account` (scenario "Opening the account page"), that "Close" hides it, and that `/sheets?passkey` shows no offer afterwards (scenario "Closed before"). Verify the test passes
- [x] 3.2 Check the library with the offer at phone width and in a wide window, with and without sheets, in light and lamplight, with the browser-check skill. Verify it matches the canvas
- [x] 3.3 Run `just check` and `just spec-check`. Verify both pass

## Workflow follow-up

- Close #80 with the pull request. Archive the change after review.
