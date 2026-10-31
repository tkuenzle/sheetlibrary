import "../ui/button.css";
import "./sign-in.css";

import { useId, useState } from "react";
import { redirect, useSearchParams } from "react-router";

import {
  askForLink,
  type LinkResult,
  signInWithPasskey,
} from "../auth/auth-client";
import { sessionContext } from "../context";
import { TopBar } from "../shell/top-bar";
import { Button } from "../ui/button";
import { Note } from "../ui/note";
import type { Route } from "./+types/sign-in";

// Signing in by passkey or by a link sent by email. See
// openspec/specs/accounts.

export function meta() {
  return [
    { title: "Sign in | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  if (context.get(sessionContext)) return redirect("/account");
  return null;
}

export type SignInState =
  LinkResult | "sending" | "passkey-failed" | "link-invalid" | null;

// The note under the form for what just happened.
export function SignInNote({ state }: { state: SignInState }) {
  switch (state) {
    case "sent":
      return (
        <Note>Check your email. The link works once, for 15 minutes.</Note>
      );
    case "not-invited":
      return <Note>Sheet Library is invite-only for now.</Note>;
    case "too-many":
      return <Note>Too many sign-in emails. Try again later.</Note>;
    case "failed":
      return <Note>The email couldn’t be sent. Try again later.</Note>;
    case "passkey-failed":
      return (
        <Note>No passkey was used. Sign in with an email link instead.</Note>
      );
    case "link-invalid":
      return (
        <Note>That link has expired or was already used. Send a new one.</Note>
      );
    default:
      return null;
  }
}

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<SignInState>(
    searchParams.get("link") === "invalid" ? "link-invalid" : null,
  );
  const [email, setEmail] = useState("");
  const fieldId = useId();
  const hintId = useId();

  return (
    <>
      <TopBar />
      <main className="sign-in">
        <h1>Sign in</h1>
        <Button
          icon="passkey"
          className="sign-in-passkey"
          onClick={() => {
            void signInWithPasskey().then((signedIn) => {
              if (signedIn) window.location.assign("/");
              else setState("passkey-failed");
            });
          }}
        >
          Sign in with a passkey
        </Button>
        <p className="sign-in-or">or</p>
        <form
          className="sign-in-form"
          onSubmit={(event) => {
            event.preventDefault();
            setState("sending");
            void askForLink(email.trim()).then(setState);
          }}
        >
          <div className="sign-in-field">
            <label htmlFor={fieldId}>Email</label>
            <p id={hintId}>Get a link by email to sign in</p>
            <input
              id={fieldId}
              type="email"
              name="email"
              autoComplete="email"
              required
              aria-describedby={hintId}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
          </div>
          <Button
            type="submit"
            variant="tonal"
            icon="mail"
            disabled={state === "sending"}
          >
            Send link
          </Button>
        </form>
        <div aria-live="polite">
          <SignInNote state={state} />
        </div>
      </main>
    </>
  );
}
