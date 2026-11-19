import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AccountView, meta, type PasskeyItem } from "./account";

const iphone: PasskeyItem = {
  id: "p1",
  name: "iPhone",
  createdAt: "2026-10-31T12:00:00.000Z",
};

function render(props: { passkeys?: PasskeyItem[] }) {
  const noop = () => undefined;
  return renderToString(
    <AccountView
      email="ana@example.com"
      passkeys={props.passkeys ?? []}
      failed={false}
      onAdd={noop}
      onRename={noop}
      onRemove={noop}
      onSignOut={noop}
    />,
  );
}

describe("account page", () => {
  it("shows the email and sign-out", () => {
    const html = render({});
    expect(html).toContain("ana@example.com");
    expect(html).toContain("Sign out");
  });

  it("lists the passkeys, each with rename and remove", () => {
    const html = render({ passkeys: [iphone] });
    expect(html).toContain("iPhone");
    expect(html).toContain("Added Oct 31, 2026");
    expect(html).toContain('aria-label="Rename iPhone"');
    expect(html).toContain('aria-label="Remove iPhone"');
  });

  it("names a passkey without a name", () => {
    const html = render({ passkeys: [{ ...iphone, name: null }] });
    expect(html).toContain('aria-label="Remove Passkey"');
  });

  it("says when there are no passkeys, inside the group", () => {
    expect(render({})).toMatch(
      /<ul class="group-list"><li [^>]*><span [^>]*>No passkeys yet\.<\/span><\/li><\/ul>/,
    );
  });

  it("puts the email and the passkeys in grouped rows", () => {
    const html = render({ passkeys: [iphone] });
    expect(html).toMatch(
      /<h2 id="account-email">Email<\/h2><ul class="group-list"><li [^>]*><span [^>]*>ana@example\.com/,
    );
    expect(html).toMatch(
      /<h2 id="account-passkeys">Passkeys<\/h2><ul class="group-list"><li [^>]*>.*iPhone/,
    );
  });

  it("shows sign-out as its own row, with an icon", () => {
    expect(render({})).toMatch(
      /<ul class="group-list account-sign-out"><li><button type="button"><svg [^>]*>.*<\/svg>Sign out<\/button><\/li><\/ul>/,
    );
  });

  it("sets the page title", () => {
    expect(meta()).toContainEqual({ title: "Account | Sheet Library" });
  });
});

// Requirement "A skeleton while a page loads": bars for the email and the
// passkeys, and the actions that don't need them stay.
describe("account page while it loads", () => {
  const noop = () => undefined;
  const html = renderToString(
    <AccountView
      email={null}
      passkeys={null}
      failed={false}
      onAdd={noop}
      onRename={noop}
      onRemove={noop}
      onSignOut={noop}
    />,
  );

  it("shows bars for the email and two passkeys", () => {
    expect(html).toMatch(/<h1[^>]*>Account<\/h1>/);
    expect(html).toMatch(/class="account-email"><span class="skeleton-bar"/);
    expect(
      html.match(/class="account-passkey-name"><span class="skeleton-bar"/g),
    ).toHaveLength(2);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("No passkeys yet");
  });

  it("keeps Add passkey and Sign out", () => {
    expect(html).toMatch(
      /<button[^>]*class="button button-tonal account-add"[^>]*>/,
    );
    expect(html).not.toMatch(/account-add"[^>]*disabled/);
    expect(html).toContain("Sign out");
  });
});
