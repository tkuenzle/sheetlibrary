import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SignedInContext } from "./signed-in";
import { TopBar } from "./top-bar";

const ana = { initial: "A" };

describe("TopBar", () => {
  it("links the site's name to the home page", () => {
    expect(renderToString(<TopBar />)).toContain(
      '<a class="top-bar-name" href="/">Sheet Library</a>',
    );
  });

  // Scenario "Going home from the editor".
  it("links the site's name to the home page when signed out", () => {
    const html = renderToString(
      <SignedInContext value={null}>
        <TopBar />
      </SignedInContext>,
    );
    expect(html).toContain(
      '<a class="top-bar-name" href="/">Sheet Library</a>',
    );
  });

  it("links the site's name to the library when signed in", () => {
    const html = renderToString(
      <SignedInContext value={ana}>
        <TopBar />
      </SignedInContext>,
    );
    expect(html).toContain(
      '<a class="top-bar-name" href="/sheets">Sheet Library</a>',
    );
  });

  // Scenarios "Back to the library" and "No title in the bar".
  it("starts with Library instead of the site's name on a sheet", () => {
    const html = renderToString(
      <SignedInContext value={ana}>
        <TopBar back />
      </SignedInContext>,
    );
    expect(html).toMatch(
      /^<header [^>]*><a class="top-bar-back" href="\/sheets"><svg [^>]*>.*<\/svg>Library<\/a>/,
    );
    expect(html).not.toContain("Sheet Library");
  });

  // Scenario "Back to the collections".
  it("starts with Collections on a collection", () => {
    const html = renderToString(
      <SignedInContext value={ana}>
        <TopBar back={{ href: "/collections", label: "Collections" }} />
      </SignedInContext>,
    );
    expect(html).toMatch(
      /^<header class="top-bar top-bar-with-back"><a class="top-bar-back" href="\/collections"><svg [^>]*>.*<\/svg>Collections<\/a>/,
    );
    expect(html).not.toContain("Sheet Library");
  });

  it("shows the actions only when given", () => {
    expect(renderToString(<TopBar />)).not.toContain("top-bar-actions");
    expect(
      renderToString(
        <TopBar>
          <button type="button">Help</button>
        </TopBar>,
      ),
    ).toContain('<div class="top-bar-actions"><button');
  });

  // Scenario "Signed out".
  it("links to sign-in when signed out", () => {
    const html = renderToString(
      <SignedInContext value={null}>
        <TopBar />
      </SignedInContext>,
    );
    expect(html).toMatch(/<a [^>]*href="\/sign-in" aria-label="Sign in">/);
    expect(html).not.toContain('href="/account"');
  });

  // Scenario "Signed in".
  it("shows the account as its initial when signed in, and not sign-in", () => {
    const html = renderToString(
      <SignedInContext value={ana}>
        <TopBar />
      </SignedInContext>,
    );
    expect(html).toMatch(
      /<a class="top-bar-account" href="\/account" aria-label="Account"><span [^>]*aria-hidden="true">A<\/span><\/a>/,
    );
    expect(html).not.toContain("Sign in");
    expect(html).not.toContain("aria-current");
  });

  it("marks the account as the current page on the account page", () => {
    const html = renderToString(
      <SignedInContext value={ana}>
        <TopBar accountPage />
      </SignedInContext>,
    );
    expect(html).toMatch(
      /<a [^>]*href="\/account" aria-label="Account" aria-current="page">/,
    );
  });

  it("puts the account link after the page's actions", () => {
    const html = renderToString(
      <SignedInContext value={null}>
        <TopBar>
          <button type="button">Help</button>
        </TopBar>
      </SignedInContext>,
    );
    expect(html).toMatch(/Help<\/button><a [^>]*href="\/sign-in"/);
  });
});
