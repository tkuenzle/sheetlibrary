import { type Page } from "@playwright/test";

import {
  createCollection,
  createSheet,
  expect,
  newMark,
  test,
} from "./fixtures";

// A page reached by a move shows with its styles from the first frame. All
// CSS is one stylesheet that loads with the first page, so a move must never
// add or remove a stylesheet. See openspec/specs/site-layout.

test.use({ signedIn: true });

const heading = (page: Page) => page.getByRole("heading", { level: 1 });

// Records every stylesheet and <style> added to or removed from <head>.
async function watchStylesheets(page: Page) {
  await page.evaluate(() => {
    const changes: string[] = [];
    const describe = (node: Node) =>
      node instanceof HTMLLinkElement && node.rel === "stylesheet"
        ? `link ${node.href}`
        : node instanceof HTMLStyleElement
          ? "style"
          : null;
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          const name = describe(node);
          if (name) changes.push(`added ${name}`);
        }
        for (const node of record.removedNodes) {
          const name = describe(node);
          if (name) changes.push(`removed ${name}`);
        }
      }
    }).observe(document.head, { childList: true });
    (window as unknown as { styleChanges: string[] }).styleChanges = changes;
  });
}

const styleChanges = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { styleChanges: string[] }).styleChanges,
  );

// Scenario "From Sheets to a collection and back", through every main page.
test("adds and removes no stylesheet on moves between pages", async ({
  page,
}) => {
  const mark = newMark();
  const title = `Styled ${mark}`;
  const collection = `Styled ${mark}`;
  const sheetId = await createSheet(page, {
    title,
    content: { format: "chordsheet", version: 1, sections: [] },
  });
  const collectionId = await createCollection(page, collection);
  const added = await page.request.put(
    `/api/sheets/${sheetId}/collections/${collectionId}`,
  );
  expect(added.ok()).toBe(true);

  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  await watchStylesheets(page);

  await page
    .getByRole("link", { name: "Collections", exact: true })
    .first()
    .click();
  await expect(heading(page)).toHaveText("Collections");
  await page
    .getByRole("main")
    .getByRole("link", { name: new RegExp(collection) })
    .click();
  await expect(heading(page)).toHaveText(collection);
  await page
    .getByRole("main")
    .getByRole("link", { name: new RegExp(title) })
    .click();
  await expect(heading(page)).toHaveText(title);
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(new RegExp(`/sheets/${sheetId}/edit$`));

  for (const back of [`/sheets/${sheetId}`, `/collections/${collectionId}`]) {
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${back}$`));
  }
  await page.goBack();
  await expect(heading(page)).toHaveText("Collections");
  await page.goBack();
  await expect(heading(page)).toHaveText("Sheets");

  await page
    .getByRole("link", { name: "Account", exact: true })
    .first()
    .click();
  await expect(heading(page)).toHaveText("Account");

  expect(await styleChanges(page)).toEqual([]);
});
