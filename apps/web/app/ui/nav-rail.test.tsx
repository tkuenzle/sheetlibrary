import { renderToString } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { NavBar } from "./nav-bar";
import { type NavItem, NavRail } from "./nav-rail";

function items(open: "sheets" | "collections" | "christmas"): NavItem[] {
  return [
    {
      href: "/sheets",
      label: "Sheets",
      icon: "libraryMusic",
      current: open === "sheets",
    },
    {
      href: "/collections",
      label: "Collections",
      icon: "stacks",
      current: open === "collections",
      children: [
        {
          href: "/collections/a",
          label: "Campfire",
          count: { text: "21", label: "21 sheets" },
        },
        {
          href: "/collections/b",
          label: "Christmas",
          count: { text: "14", label: "14 sheets" },
          current: open === "christmas",
        },
      ],
    },
  ];
}

const account: NavItem = { href: "/account", label: "Account", initial: "A" };

function render(element: React.ReactNode) {
  const Stub = createRoutesStub([{ path: "/", Component: () => element }]);
  return renderToString(<Stub />);
}

// The link with this address, as its opening tag.
function link(html: string, href: string) {
  return new RegExp(`<a [^>]*href="${href}"[^>]*>`).exec(html)?.[0] ?? "";
}

describe("NavRail", () => {
  const rail = (open: Parameters<typeof items>[0]) =>
    render(
      <NavRail
        name={{ href: "/sheets", label: "Sheet Library" }}
        items={items(open)}
        footer={[account]}
      />,
    );

  it("is a navigation named Main that starts with the site's name", () => {
    const html = rail("sheets");
    expect(html).toMatch(/^<nav class="nav-rail" aria-label="Main">/);
    expect(html).toMatch(/<a class="nav-rail-name"[^>]*>Sheet Library<\/a>/);
  });

  // Scenario "The open screen".
  it("marks the open item and no other", () => {
    const html = rail("collections");
    expect(link(html, "/collections")).toContain('aria-current="page"');
    expect(link(html, "/sheets")).not.toContain("aria-current");
    expect(html.match(/aria-current/g)).toHaveLength(1);
  });

  // Scenario "Collections in the rail".
  it("lists what an item holds under it, with a count read in full", () => {
    const html = rail("sheets");
    expect(html).toMatch(
      /Campfire<\/span><span class="nav-rail-count"><span aria-hidden="true">21<\/span><span class="visually-hidden">21 sheets<\/span>/,
    );
    expect(html.indexOf("Campfire")).toBeLessThan(html.indexOf("Christmas"));
    expect(html.indexOf("Collections")).toBeLessThan(html.indexOf("Campfire"));
  });

  it("marks an open child, and not the item above it", () => {
    const html = rail("christmas");
    expect(link(html, "/collections/b")).toContain('aria-current="page"');
    expect(link(html, "/collections")).not.toContain("aria-current");
  });

  it("ends with the footer's items, with a letter in place of an icon", () => {
    const html = rail("sheets");
    expect(html).toMatch(
      /<ul class="nav-rail-footer"><li><a [^>]*href="\/account"[^>]*><span class="nav-avatar" aria-hidden="true">A<\/span>Account<\/a>/,
    );
  });

  describe("compact", () => {
    const compact = (open: Parameters<typeof items>[0]) =>
      render(<NavRail compact items={items(open)} footer={[account]} />);

    it("shows only icons, each named and with a tooltip", () => {
      const html = compact("sheets");
      expect(html).toMatch(/^<nav class="nav-rail nav-rail-compact"/);
      expect(link(html, "/sheets")).toContain('aria-label="Sheets"');
      expect(link(html, "/account")).toContain('aria-label="Account"');
      expect(html).toMatch(/<span class="tooltip tooltip-right"[^>]*>Sheets</);
      expect(html).not.toContain(">Sheets</a>");
    });

    it("lists nothing under an item, and has no site name", () => {
      const html = compact("sheets");
      expect(html).not.toContain("Campfire");
      expect(html).not.toContain("nav-rail-name");
    });

    it("marks the item that stands for an open child", () => {
      const html = compact("christmas");
      expect(link(html, "/collections")).toContain('aria-current="true"');
      expect(link(html, "/sheets")).not.toContain("aria-current");
    });
  });
});

describe("NavBar", () => {
  const bar = (open: Parameters<typeof items>[0]) =>
    render(<NavBar items={items(open)} />);

  it("shows each item with its icon and its name", () => {
    const html = bar("sheets");
    expect(html).toMatch(/^<nav class="nav-bar" aria-label="Main">/);
    expect(html).toMatch(
      /<span class="nav-bar-icon"><svg [^>]*>.*?<\/svg><\/span>Sheets<\/a>/,
    );
    expect(html).not.toContain("Campfire");
  });

  it("marks the open item", () => {
    const html = bar("sheets");
    expect(link(html, "/sheets")).toContain('aria-current="page"');
    expect(link(html, "/collections")).not.toContain("aria-current");
  });

  // Scenario "A collection on a phone".
  it("marks the item that stands for an open child", () => {
    const html = bar("christmas");
    expect(link(html, "/collections")).toContain('aria-current="true"');
  });
});
