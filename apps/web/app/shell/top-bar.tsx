import "./top-bar.css";

import { type ReactNode, use } from "react";

import { Icon } from "../ui/icon";
import { SignedInContext } from "./signed-in";

// The bar at the top of a page: the site's name, linking home, the song's
// title after it, the page's actions, and the link to sign in or to the
// account at the end. The links load the next page in full, so a page with
// unsaved edits can warn before they go.
export function TopBar({
  title,
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  const signedIn = use(SignedInContext);
  return (
    <header className="top-bar">
      <a className="top-bar-name" href="/">
        Sheet Library
      </a>
      {title && (
        <span className="top-bar-title">
          <span aria-hidden="true">/</span> {title}
        </span>
      )}
      {(children ?? signedIn !== undefined) && (
        <div className="top-bar-actions">
          {children}
          {signedIn !== undefined && <AccountLink signedIn={signedIn} />}
        </div>
      )}
    </header>
  );
}

// "Sign in", or "Account" once signed in. Only the icon on a phone.
function AccountLink({ signedIn }: { signedIn: boolean }) {
  const text = signedIn ? "Account" : "Sign in";
  return (
    <a
      className="button button-text top-bar-account"
      href={signedIn ? "/account" : "/sign-in"}
      aria-label={text}
    >
      <Icon name={signedIn ? "accountCircle" : "login"} />
      <span className="top-bar-account-text">{text}</span>
    </a>
  );
}
