import { expect, type Page, test } from "@playwright/test";

import { authFile } from "./servers";

// POST /api/photo-import. The servers use the fake model, which answers
// "Amazing Grace" for any photos.

function photos() {
  const form = new FormData();
  for (const name of ["page-1", "page-2"]) {
    form.append("photo", new Blob([name], { type: "image/jpeg" }), name);
  }
  return form;
}

// The ids of the sheets in the library.
async function sheetIds(page: Page) {
  await page.goto("/sheets");
  const hrefs = await page
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  return hrefs.flatMap((href) => /^\/sheets\/([\w-]+)$/.exec(href ?? "") ?? []);
}

test.describe("signed in", () => {
  test.use({ storageState: authFile });

  // Scenarios "A song read", "Library unchanged" and "End-to-end test".
  test("reads two photos into Amazing Grace, and creates no sheet", async ({
    page,
    baseURL,
  }) => {
    const before = new Set(await sheetIds(page));

    const response = await page.request.post("/api/photo-import", {
      headers: { Origin: baseURL ?? "" },
      multipart: photos(),
    });
    expect(response.status()).toBe(200);
    const answer = (await response.json()) as {
      title: string;
      content: { sections: { label?: string }[] };
    };
    expect(answer.title).toBe("Amazing Grace");
    expect(answer.content.sections.map((section) => section.label)).toEqual([
      "Verse 1",
      "Verse 2",
    ]);

    // Other tests add sheets to this account at the same time, some named
    // "Amazing Grace" too, so this checks that no new sheet holds the song.
    const added = (await sheetIds(page)).filter((id) => !before.has(id));
    for (const id of added) {
      const sheet = (await (
        await page.request.get(`/api/sheets/${id}`)
      ).json()) as { content: unknown };
      expect(sheet.content).not.toEqual(answer.content);
    }
  });
});

// Scenario "Not signed in".
test("refuses a request without a session", async ({ request, baseURL }) => {
  const response = await request.post("/api/photo-import", {
    headers: { Origin: baseURL ?? "" },
    multipart: photos(),
  });
  expect(response.status()).toBe(401);
});
