import "../ui/button.css";

import { use } from "react";
import { data } from "react-router";

import { SignedInContext } from "../shell/signed-in";
import { TopBar } from "../shell/top-bar";
import { PageError } from "../ui/page-error";

// Any address that matches no other route. A route of its own, rather than
// the root's error boundary, so the root's loader runs and the page knows
// who is signed in. See openspec/specs/site-layout.

export function loader() {
  return data(null, { status: 404 });
}

export function meta() {
  return [
    { title: "Page not found | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

export default function NotFoundPage() {
  return <NotFoundView signedIn={!!use(SignedInContext)} />;
}

export function NotFoundView({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <TopBar />
      <main>
        <PageError kind="not-found">
          <a className="button button-filled" href={signedIn ? "/sheets" : "/"}>
            {signedIn ? "Go to your sheets" : "Go to the home page"}
          </a>
        </PageError>
      </main>
    </>
  );
}
