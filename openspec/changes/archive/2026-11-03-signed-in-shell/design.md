# Design

## Context

The root loader returns `{ signedIn }`, and `SignedInContext` hands that boolean to `TopBar`. `TopBar` takes an optional `title` for the breadcrumb and renders the "Account" or "Sign in" link. The library's grouped rows live in `routes/sheets.css` under `.library-list`. The look comes from the canvas's "Library and account" page; see `proposal.md`.

## Decisions

**The root loader passes the initial, not the email.** It returns `{ initial: "A" }` for a signed-in person and `null` otherwise, and the context carries that instead of the boolean. The root loader's data is in every page's HTML, and the email is only needed on the account page, which loads it itself. Passing the whole email would have been simpler but puts it on every page.

**`TopBar` says how it starts and whether the account is the current page through props.** The sheet page and its "Sheet not found" ask for the back link, and the account page asks for the current account. `title` goes. Reading the path with `useLocation` inside `TopBar` was the other option. It keeps the call sites shorter, but it hides which pages differ, and the unit tests render `TopBar` without a router.

**The grouped rows become a shared class in `app/ui/`.** The rules for the rows, 2px apart and only the outer corners round, move from `.library-list` into a `group-list.css` used by the library and the account page. It's a class, not a React component. Library rows are links, account rows hold text and buttons, and "Sign out" is a full-row button, so a component would only pass its children through.

**The sign-in page draws its own frame.** It renders the site's name and one card without `TopBar`. Only this page has that frame, so it stays in `routes/sign-in.tsx` and `sign-in.css` rather than in `shell/`. "Check your email" replaces the form inside the same card.

**Two new icons.** `arrow_back` for "Library" and `logout` for "Sign out", from Material Symbols Rounded like the others. `account_circle` goes, since only the account link used it.

## Risks / Trade-offs

- [The tests find the top bar's links by name, "Sheet Library" on the sheet page among them.] → They move to "Library" in the same change. The e2e test for going back from a sheet keeps its scenario.
- [An email that starts with a digit or a symbol gets that as its initial.] → Accepted. The circle still marks the account, and its name is "Account".
