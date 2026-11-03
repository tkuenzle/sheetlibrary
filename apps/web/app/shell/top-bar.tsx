import "./top-bar.css";

import { type ReactNode, use } from "react";

import { Icon } from "../ui/icon";
import { type SignedIn, SignedInContext } from "./signed-in";

// The bar at the top of a page: the site's name, linking home or, once
// signed in, to the library, or "Library" with a back arrow on a sheet. Then
// the page's actions, and the link to sign in or to the account at the end.
// The links load the next page in full, so a page with unsaved edits can warn
// before they go.
export function TopBar({
  back = false,
  accountPage = false,
  children,
}: {
  back?: boolean;
  accountPage?: boolean;
  children?: ReactNode;
}) {
  const signedIn = use(SignedInContext);
  return (
    <header className={back ? "top-bar top-bar-with-back" : "top-bar"}>
      {back ? (
        <a className="top-bar-back" href="/sheets">
          <Icon name="arrowBack" />
          Library
        </a>
      ) : (
        <a className="top-bar-name" href={signedIn ? "/sheets" : "/"}>
          Sheet Library
        </a>
      )}
      {(children ?? signedIn !== undefined) && (
        <div className="top-bar-actions">
          {children}
          {signedIn === null && <SignInLink />}
          {signedIn && (
            <AccountLink signedIn={signedIn} current={accountPage} />
          )}
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
function AccountLink({
  signedIn,
  current,
}: {
  signedIn: SignedIn;
  current: boolean;
}) {
  return (
    <a
      className="top-bar-account"
      href="/account"
      aria-label="Account"
      aria-current={current ? "page" : undefined}
    >
      <span className="top-bar-initial" aria-hidden="true">
        {signedIn.initial}
      </span>
    </a>
  );
}
