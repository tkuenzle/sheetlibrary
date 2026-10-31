import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { meta, SignInNote, type SignInState } from "./sign-in";

function note(state: SignInState) {
  return renderToString(<SignInNote state={state} />);
}

describe("sign-in page", () => {
  it("says to check the email once a link is sent", () => {
    expect(note("sent")).toContain(
      "Check your email. The link works once, for 15 minutes.",
    );
  });

  // Scenario "Uninvited email".
  it("says Sheet Library is invite-only for an uninvited email", () => {
    expect(note("not-invited")).toContain(
      "Sheet Library is invite-only for now.",
    );
  });

  // Scenario "Too many requests".
  it("says to try again later after too many requests", () => {
    expect(note("too-many")).toContain(
      "Too many sign-in emails. Try again later.",
    );
  });

  it("says when a link no longer works", () => {
    expect(note("link-invalid")).toContain(
      "That link has expired or was already used.",
    );
  });

  it("shows no note before anything happened", () => {
    expect(note(null)).toBe("");
    expect(note("sending")).toBe("");
  });

  it("follows the voice in docs/ui-text.md", () => {
    const states: SignInState[] = [
      "sent",
      "not-invited",
      "too-many",
      "failed",
      "passkey-failed",
      "link-invalid",
    ];
    for (const state of states) {
      expect(note(state)).not.toMatch(/you can|please|\bwe\b|!/i);
    }
  });

  it("sets the page title", () => {
    expect(meta()).toContainEqual({ title: "Sign in | Sheet Library" });
  });
});
