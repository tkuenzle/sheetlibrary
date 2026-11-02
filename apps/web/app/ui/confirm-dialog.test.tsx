import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ConfirmContent, ConfirmDialog } from "./confirm-dialog";

function nothing() {
  return undefined;
}

const question = {
  title: "Delete “Amazing Grace”?",
  text: "The sheet is gone for good. This can’t be undone.",
  confirm: "Delete",
};

describe("ConfirmDialog", () => {
  it("is an alert dialog named by its question, empty while closed", () => {
    const html = renderToString(
      <ConfirmDialog
        {...question}
        open={false}
        failure="Didn't work."
        onConfirm={() => Promise.resolve()}
        onClose={nothing}
      />,
    );
    expect(html).toMatch(/^<dialog [^>]*role="alertdialog"/);
    expect(html).toMatch(/aria-labelledby="[^"]+"/);
    expect(html).toMatch(/aria-describedby="[^"]+"/);
    expect(html).not.toContain("Amazing Grace");
  });
});

describe("ConfirmContent", () => {
  const render = (props: { failure?: string; busy?: boolean } = {}) =>
    renderToString(
      <ConfirmContent
        {...question}
        {...props}
        titleId="title"
        textId="text"
        onConfirm={nothing}
        onCancel={nothing}
      />,
    );

  it("asks the question, with Cancel before the confirm button", () => {
    const html = render();
    expect(html).toContain('<h2 id="title">Delete “Amazing Grace”?</h2>');
    expect(html).toContain(
      '<p id="text">The sheet is gone for good. This can’t be undone.</p>',
    );
    expect(html).toMatch(/>Cancel<\/button>.*>Delete<\/button>/s);
    expect(html).not.toContain("disabled");
  });

  it("disables both buttons while the action runs", () => {
    expect(render({ busy: true }).match(/disabled=""/g)).toHaveLength(2);
  });

  it("says when the action failed", () => {
    expect(render()).not.toContain('class="note"');
    expect(render({ failure: "Didn't work." })).toMatch(
      /class="note".*Didn&#x27;t work\./s,
    );
  });
});
