import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AccountView, meta, type PasskeyItem } from "./account";

const iphone: PasskeyItem = {
  id: "p1",
  name: "iPhone",
  createdAt: "2026-10-31T12:00:00.000Z",
};

function render(props: { passkeys?: PasskeyItem[]; offer?: boolean }) {
  const noop = () => undefined;
  return renderToString(
    <AccountView
      email="ana@example.com"
      passkeys={props.passkeys ?? []}
      offer={props.offer ?? false}
      failed={false}
      onAdd={noop}
      onSkip={noop}
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

  it("says when there are no passkeys", () => {
    expect(render({})).toContain("No passkeys yet.");
  });

  // Scenario "Adding a passkey after an email sign-in".
  it("offers a passkey after an email sign-in, which can be skipped", () => {
    const html = render({ offer: true });
    expect(html).toContain("Add a passkey to sign in on this device");
    expect(html).toContain("Not now");
    expect(render({ offer: false })).not.toContain("Not now");
  });

  it("sets the page title", () => {
    expect(meta()).toContainEqual({ title: "Account | Sheet Library" });
  });
});
