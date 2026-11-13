import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  failureNote,
  NameContent,
  NameDialog,
  NameRefused,
} from "./name-dialog";

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

describe("failureNote", () => {
  it("shows a refusal's own note, and the failure otherwise", () => {
    const failure = "The collection couldn’t be saved.";
    expect(
      failureNote(new NameRefused("That name is already used."), failure),
    ).toBe("That name is already used.");
    expect(failureNote(new Error("offline"), failure)).toBe(failure);
    expect(failureNote(undefined, failure)).toBe(failure);
  });
});
