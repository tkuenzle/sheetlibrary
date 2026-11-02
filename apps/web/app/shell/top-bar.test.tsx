import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SignedInContext } from "./signed-in";
import { TopBar } from "./top-bar";

describe("TopBar", () => {
  it("links the site's name to the home page", () => {
    expect(renderToString(<TopBar />)).toContain(
      '<a class="top-bar-name" href="/">Sheet Library</a>',
    );
  });

  // Scenario "Going home from the editor".
  it("links the site's name to the home page when signed out", () => {
    const html = renderToString(
      <SignedInContext value={false}>
        <TopBar />
      </SignedInContext>,
    );
    expect(html).toContain(
      '<a class="top-bar-name" href="/">Sheet Library</a>',
    );
  });

  // Scenario "Back to the library".
  it("links the site's name to the library when signed in", () => {
    const html = renderToString(
      <SignedInContext value={true}>
        <TopBar title="Amazing Grace" />
      </SignedInContext>,
    );
    expect(html).toContain(
      '<a class="top-bar-name" href="/sheets">Sheet Library</a>',
    );
  });

  it("shows the title after the name", () => {
    const html = renderToString(<TopBar title="Amazing Grace" />);
    expect(html).toMatch(/Sheet Library<\/a>.*Amazing Grace/);
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
      <SignedInContext value={false}>
        <TopBar />
      </SignedInContext>,
    );
    expect(html).toMatch(/<a [^>]*href="\/sign-in" aria-label="Sign in">/);
    expect(html).not.toContain('href="/account"');
  });

  // Scenario "Signed in".
  it("links to the account when signed in, and not to sign-in", () => {
    const html = renderToString(
      <SignedInContext value={true}>
        <TopBar />
      </SignedInContext>,
    );
    expect(html).toMatch(/<a [^>]*href="\/account" aria-label="Account">/);
    expect(html).not.toContain("Sign in");
  });

  it("puts the account link after the page's actions", () => {
    const html = renderToString(
      <SignedInContext value={false}>
        <TopBar>
          <button type="button">Help</button>
        </TopBar>
      </SignedInContext>,
    );
    expect(html).toMatch(/Help<\/button><a [^>]*href="\/sign-in"/);
  });
});
