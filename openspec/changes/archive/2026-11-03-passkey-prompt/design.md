# Design

## Context

The email link lands on `callbackURL: "/sheets"`, set in `askForLink` in `auth-client.ts`. The library's loader only lists sheets. The account page gets the account's passkeys from `getAuth(env, request).api.listPasskeys`. The e2e test for the first sign-in adds `?e2e=<mark>` to the landing URL, which breaks once that URL has a query of its own. The site sets no cookie of its own yet, only Better Auth's session cookie. The look is on the canvas's "Passkey offer" boards; see `proposal.md`.

## Decisions

**The email link lands on `/sheets?passkey`.** The library's loader reads `url`, and only with `passkey` does it look at the cookie and the account's passkeys. The page then drops `passkey` from the address with `replaceState`, as the sheet page does with `?new`, so a reload shows no offer. Better Auth's `newUserCallbackURL` was the other option, but it only marks the first sign-in, and an account without a passkey should be offered one after any email sign-in.

**The loader asks D1 whether the account has a passkey.** A small `hasPasskey(db, userId)` reads the `passkey` table by `userId`, which has an index. Better Auth's `listPasskeys`, as the account page uses, was the other option. But it needs the request's real session headers, and the library's loader tests use a stand-in session with only the user's id. It runs only after an email sign-in, so the extra query is rare.

**The browser sets the closed cookie.** "Close" writes `passkey-offer=closed` with `document.cookie`: `Path=/`, `SameSite=Lax`, `Secure`, and `Max-Age` of 400 days, the most browsers keep. The loader reads it from the request. The cookie holds no secret, so it needs no action. Local storage was the other option, but only the browser can read it, so the server's HTML would show the card and it would vanish after loading.

**The card is a `PasskeyOffer` component in `routes/sheets.tsx`.** "Add passkey" is a link to `/account` with the `button button-filled` classes and the `passkey` icon, as the home page's link to `/editor` is. "Close" is an `IconButton` with `close`. The card has the note colors, but isn't `Note`: `Note` holds one line of text, and the card holds a link and a button. The account page can't start adding a passkey by itself on load, since Safari only creates one right after a tap or click, so the person selects "Add passkey" there again.

## Risks / Trade-offs

- [Browsers cap a cookie at 400 days, so after that the offer can show again.] → Accepted. By then it's a fair time to ask again.
- [A person whose only passkey is on another device gets no offer on this one.] → Accepted. They already use passkeys and can add one on the account page.
- [A person who opens the account page but adds no passkey gets the offer again after the next email sign-in.] → Accepted. Only "Close" sets the cookie.
