import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NameContent, NameDialog } from "./name-dialog";

function nothing() {
  return undefined;
}

const props = {
  title: "Save as a version",
  text: "Name it for who or what it’s for.",
  initial: "Key A",
  maxLength: 40,
  failure: "The version couldn’t be saved.",
  onSave: () => Promise.resolve(),
};

describe("NameDialog", () => {
  it("is a dialog named by its title, empty while closed", () => {
    const html = renderToString(
      <NameDialog {...props} open={false} onClose={nothing} />,
    );
    expect(html).toMatch(/^<dialog [^>]*aria-labelledby="[^"]+"/);
    expect(html).not.toContain("Save as a version");
  });
});

describe("NameContent", () => {
  const render = (initial = "Key A") =>
    renderToString(
      <NameContent
        {...props}
        initial={initial}
        titleId="title"
        onCancel={nothing}
      />,
    );

  // Scenario "Keeping the suggested name".
  it("has a labelled field with the suggested name, of at most 40 characters", () => {
    const html = render();
    expect(html).toMatch(
      /<label for="([^"]+)">Name<\/label><input[^>]*id="\1"/,
    );
    expect(html).toMatch(/<input[^>]*value="Key A"/);
    expect(html).toMatch(/<input[^>]*maxLength="40"/);
  });

  it("saves with Enter, as a form, with Cancel beside Save", () => {
    const html = render();
    expect(html).toMatch(/^<form class="confirm-content"/);
    expect(html).toMatch(
      /type="button"[^>]*>Cancel<\/button><button type="submit"[^>]*>Save<\/button>/,
    );
  });

  it("can't save an empty name", () => {
    expect(render("  ")).toMatch(/<button type="submit"[^>]*disabled=""/);
  });

  it("shows no failure before saving", () => {
    expect(render()).not.toContain("couldn’t be saved");
  });
});
