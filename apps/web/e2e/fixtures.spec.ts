import { type Page } from "@playwright/test";

import {
  answerAtOnce,
  createSheet,
  expect,
  hold,
  newMark,
  settled,
  slotAccount,
  test,
} from "./fixtures";

function mainNav(page: Page) {
  return page.getByRole("navigation", { name: "Main" });
}

function navLink(page: Page, name: string) {
  return mainNav(page).getByRole("link", { name, exact: true });
}

// The fixtures themselves: accounts, a clean start, and the network and
// motion helpers the specs rely on. See openspec/specs/ci-pipeline.

test.describe("signed in", () => {
  test.use({ signedIn: true });

  test("opens Sheets with the worker's account", async ({ page }) => {
    await page.goto("/sheets");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sheets");
  });

  // Scenario "A second run". Sheets belong to an account, so an account made
  // in this run has no sheets from an earlier one.
  test("has an account made in this run", async ({ page }) => {
    const started = new Date(process.env.E2E_RUN_STARTED ?? "");
    const session = (await (
      await page.request.get("/api/auth/get-session")
    ).json()) as { user: { createdAt: string } };
    expect(new Date(session.user.createdAt).getTime()).toBeGreaterThanOrEqual(
      started.getTime() - 1000,
    );
  });

  // Scenario "Two workers at once". Another slot's account stands in for
  // another worker, so the test doesn't depend on two workers meeting. Only
  // on one project, so that account signs in once per run. Keyed by slot, so
  // two workers never share it.
  test("doesn't see another worker's sheets", async ({
    page,
    playwright,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "One sign-in per run");
    const mark = newMark();
    const other = await browser.newContext({
      storageState: await slotAccount(
        playwright,
        `other-${String(testInfo.parallelIndex)}`,
      ).storageState(),
    });
    await createSheet(await other.newPage(), { title: `Theirs ${mark}` });
    await other.close();
    await createSheet(page, { title: `Mine ${mark}` });

    await page.goto("/sheets");
    const rows = page.getByRole("main").getByRole("listitem");
    await expect(rows.filter({ hasText: `Mine ${mark}` })).toHaveCount(1);
    await expect(rows.filter({ hasText: `Theirs ${mark}` })).toHaveCount(0);
  });

  // The Collections screen takes its list from the shell, so moving to it
  // loads nothing. Sheets loads its own data.
  test("holds a page's data until it is let go", async ({ page }) => {
    const title = `Held ${newMark()}`;
    await createSheet(page, { title });
    await page.goto("/collections");
    const held = await hold(page, /\/sheets\.data/);

    await navLink(page, "Sheets").click();
    await held.requested();
    const main = page.getByRole("main");
    await expect(main.getByText(title)).toHaveCount(0);

    held.release();
    await expect(main.getByText(title).first()).toBeVisible();
  });

  test("answers a page's data again from memory", async ({ page }) => {
    const first = `First ${newMark()}`;
    await createSheet(page, { title: first });
    await page.goto("/collections");
    const answers = await answerAtOnce(page, /\/sheets\.data/);
    const main = page.getByRole("main");

    await navLink(page, "Sheets").click();
    await expect(main.getByText(first).first()).toBeVisible();
    await navLink(page, "Collections").click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Collections",
    );

    // The server has it now, but the answer from memory doesn't.
    const second = `Second ${newMark()}`;
    await createSheet(page, { title: second });
    await navLink(page, "Sheets").click();
    await expect(main.getByText(first).first()).toBeVisible();
    await expect(main.getByText(second)).toHaveCount(0);
    expect(answers.fromMemory()).toBe(1);
  });

  test("waits for a panel's slide-in to end", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The rail opens on a tablet",
    );
    await page.setViewportSize({ width: 800, height: 720 });
    await page.goto("/sheets");

    await page.getByRole("button", { name: "Open navigation" }).click();
    const panel = page.getByRole("dialog", { name: "Main" });
    await settled(panel);
    expect((await panel.boundingBox())?.width).toBe(304);
    expect(
      await panel.evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === "running").length,
      ),
    ).toBe(0);
  });
});

test("starts signed out", async ({ page }) => {
  await page.goto("/sheets");
  await expect(page).toHaveURL(/\/sign-in/);
});
