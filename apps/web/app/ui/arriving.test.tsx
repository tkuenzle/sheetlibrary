import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { prerender } from "react-dom/static";
import { describe, expect, it } from "vitest";

import { PageData } from "../shell/awaited";
import { Arriving, arrivesClass, useArrives } from "./arriving";

// What happens after the first commit, that rows mounting later show at
// once and that a fade plays only once, needs effects, and is tested in
// the browser (e2e/loading.spec.ts).

function Row({ stoodForBars }: { stoodForBars?: boolean }) {
  const props = useArrives("row", stoodForBars);
  return <li {...props}>Stille Nacht</li>;
}

async function html(element: ReactNode): Promise<string> {
  const { prelude } = await prerender(element);
  return new Response(prelude).text();
}

describe("arrivesClass", () => {
  it("adds the fade's class while it plays", () => {
    expect(arrivesClass("row", true)).toBe("row arrives");
    expect(arrivesClass("", true)).toBe("arrives");
  });

  it("leaves the class as it is otherwise", () => {
    expect(arrivesClass("row", false)).toBe("row");
    expect(arrivesClass("", false)).toBeUndefined();
  });
});

describe("useArrives", () => {
  it("fades a part that mounts as its data arrives", () => {
    expect(
      renderToString(
        <Arriving>
          <Row />
        </Arriving>,
      ),
    ).toContain('class="row arrives"');
  });

  it("doesn't fade a part the skeleton showed for real", () => {
    expect(
      renderToString(
        <Arriving>
          <Row stoodForBars={false} />
        </Arriving>,
      ),
    ).toContain('class="row"');
  });

  it("doesn't fade a part outside arriving data", () => {
    expect(renderToString(<Row />)).toContain('class="row"');
  });

  it("doesn't fade a list whose bars weren't seen", () => {
    expect(
      renderToString(
        <Arriving arrived={false}>
          <Row />
        </Arriving>,
      ),
    ).toContain('class="row"');
  });
});

describe("PageData", () => {
  it("fades the parts that replace the skeleton", async () => {
    const data = Promise.resolve({ title: "Stille Nacht" });
    expect(
      await html(
        <PageData data={data} skeleton={<p>Bars</p>}>
          {() => <Row />}
        </PageData>,
      ),
    ).toContain('class="row arrives"');
  });

  it("shows whole data at once", async () => {
    expect(
      await html(
        <PageData data={{ title: "Stille Nacht" }} skeleton={<p>Bars</p>}>
          {() => <Row />}
        </PageData>,
      ),
    ).toContain('class="row"');
  });
});
