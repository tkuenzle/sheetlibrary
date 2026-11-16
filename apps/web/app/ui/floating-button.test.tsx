import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FloatingButton, FloatingMenu } from "./floating-button";

describe("FloatingButton", () => {
  it("is a button named by its label, with only its icon", () => {
    const html = renderToString(
      <FloatingButton icon="add" label="New collection" />,
    );
    expect(html).toMatch(
      /^<button type="button" aria-label="New collection" class="floating-button"><svg /,
    );
    expect(html).not.toContain("data-in-place");
  });

  it("can stand where it is, as on the design page", () => {
    const html = renderToString(
      <FloatingButton icon="add" label="Add sheets" inPlace />,
    );
    expect(html).toContain('data-in-place="true"');
  });
});

describe("FloatingMenu", () => {
  const items = [
    {
      label: "Write a new sheet",
      icon: "edit" as const,
      onSelect: () => undefined,
    },
    {
      label: "From photos…",
      icon: "photoCamera" as const,
      onSelect: () => undefined,
    },
  ];

  it("is a closed menu button, with its dialog empty until it opens", () => {
    const html = renderToString(
      <FloatingMenu label="New sheet" icon="add" items={items} />,
    );
    expect(html).toContain('aria-label="New sheet"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toMatch(
      /<dialog class="floating-menu" aria-label="New sheet"><\/dialog>$/,
    );
    expect(html).not.toContain("Write a new sheet");
  });
});
