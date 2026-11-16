import "./top-bar.css";

import { type ReactNode, use } from "react";

import { Icon } from "../ui/icon";
import { type SignedIn, SignedInContext } from "./signed-in";

// The bar at the top of the home page and the prototype editor: the site's
// name, linking home or, once signed in, to the library. Then the page's
// actions, and the link to sign in or to the account at the end. A sheet has
// its own bar (sheet-bar.tsx), and the library's screens and the account page
// have the shell (routes/shell.tsx).
// The links load the next page in full, so a page with unsaved edits can warn
// before they go.
export function TopBar({ children }: { children?: ReactNode }) {
  const signedIn = use(SignedInContext);
  return (
    <header className="top-bar">
      <a className="top-bar-name" href={signedIn ? "/sheets" : "/"}>
        Sheet Library
      </a>
      {(children ?? signedIn !== undefined) && (
        <div className="top-bar-actions">
          {children}
          {signedIn === null && <SignInLink />}
          {signedIn && <AccountLink signedIn={signedIn} />}
        </div>
      )}
    </header>
  );
}

// "Sign in", only the icon on a phone.
function SignInLink() {
  return (
    <a
      className="button button-text top-bar-sign-in"
      href="/sign-in"
      aria-label="Sign in"
    >
      <Icon name="login" />
      <span className="top-bar-sign-in-text">Sign in</span>
    </a>
  );
}

// The account as a round initial.
function AccountLink({ signedIn }: { signedIn: SignedIn }) {
  return (
    <a className="top-bar-account" href="/account" aria-label="Account">
      <span className="top-bar-initial" aria-hidden="true">
        {signedIn.initial}
      </span>
    </a>
  );
}
