import { expect, type Page, test } from "@playwright/test";

import { authFile } from "./servers";

// How page changes move: the shell's screens fade, a sheet rises over the
// shell and drops on Back, and play to edit only changes the bar. The tests
// record each view transition the page starts and read, once the browser
// has set up the move, which kind it is and what animates. See
// openspec/specs/site-layout and docs/motion.md.

test.use({ storageState: authFile });

// A word no other sheet or collection holds.
function newMark(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(10)), (n) =>
    String.fromCharCode(97 + (n % 26)),
  ).join("");
}

async function create(page: Page, url: string, data: object): Promise<string> {
  const response = await page.request.post(url, { data });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

const content = {
  format: "chordsheet",
  version: 1,
  sections: [
    {
      label: "Verse 1",
      lines: [
        {
          text: "Amazing grace, how sweet the sound",
          chords: [{ at: 0, root: "G" }],
        },
      ],
    },
  ],
};

function createSheet(page: Page, title: string) {
  return create(page, "/api/sheets", { title, content });
}

interface Move {
  finished?: boolean;
  titleStart?: { x: number; y: number; width: number; height: number };
  // The kind page-moves.ts set on <html>.
  move?: string;
  // Why the browser skipped the move, such as two elements with one name.
  skipped?: string;
  scrollY?: number;
  animations?: { name: string; pseudo: string; duration: number }[];
}

// Records every view transition from the next page load on.
async function recordMoves(page: Page) {
  await page.addInitScript(() => {
    const moves: Record<string, unknown>[] = [];
    (window as unknown as { moves: unknown }).moves = moves;
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (...args) => {
      const transition = start(...args);
      const move: Record<string, unknown> = {};
      moves.push(move);
      transition.ready.then(
        () => {
          move.move = document.documentElement.dataset.move;
          // The title's box where the move starts: its box in the new page,
          // scaled and shifted by the move's first frame.
          const group = getComputedStyle(
            document.documentElement,
            "::view-transition-group(sheet-title)",
          );
          const html = document.documentElement.style;
          const number = (name: string, empty: number) =>
            Number.parseFloat(html.getPropertyValue(name)) || empty;
          const at = new DOMMatrix(group.transform);
          const [sx, sy] = [number("--title-sx", 1), number("--title-sy", 1)];
          move.titleStart = {
            x: number("--title-dx", 0) + sx * at.e,
            y: number("--title-dy", 0) + sy * at.f,
            width: sx * Number.parseFloat(group.width),
            height: sy * Number.parseFloat(group.height),
          };
          move.scrollY = window.scrollY;
          move.animations = document.getAnimations().flatMap((animation) => {
            const effect = animation.effect;
            const pseudo =
              effect instanceof KeyframeEffect ? effect.pseudoElement : null;
            if (!pseudo?.startsWith("::view-transition")) return [];
            return [
              {
                name: (animation as CSSAnimation).animationName,
                pseudo,
                duration: effect?.getComputedTiming().duration,
              },
            ];
          });
        },
        (error: unknown) => {
          move.skipped = String(error);
        },
      );
      void transition.finished.then(() => {
        move.finished = true;
      });
      return transition;
    };
  });
}

const moves = (page: Page) =>
  page.evaluate(() => (window as unknown as { moves: Move[] }).moves);

// Waits for `count` moves to have played, and gives the last one. A tap
// while a move plays makes the browser skip the next move, so tests wait
// for each move before the next tap.
async function lastMove(page: Page, count: number): Promise<Move> {
  await expect
    .poll(async () => {
      const all = await moves(page);
      return all.length === count && all.every((m) => m.finished);
    })
    .toBe(true);
  const move = (await moves(page)).at(count - 1);
  if (!move) throw new Error("no move");
  return move;
}

const kinds = async (page: Page) => (await moves(page)).map((m) => m.move);

const heading = (page: Page) => page.getByRole("heading", { level: 1 });

// Within 2px. The browser puts the title's box at whole pixels in the new
// page, and the move's scale makes that up to a pixel or so more.
function expectBox(
  actual: Move["titleStart"],
  expected: { x: number; y: number; width: number; height: number } | null,
) {
  expect(actual).toBeDefined();
  expect(expected).not.toBeNull();
  for (const side of ["x", "y", "width", "height"] as const) {
    expect(
      Math.abs((actual?.[side] ?? 0) - (expected?.[side] ?? 0)),
    ).toBeLessThan(2);
  }
}

const movesTitle = (move: Move) =>
  move.animations?.some(
    (a) => a.pseudo === "::view-transition-group(sheet-title)",
  );

// Scenario "From Sheets to Collections".
test("fades between the shell's screens, and not while searching", async ({
  page,
}) => {
  const name = `Faded ${newMark()}`;
  await create(page, "/api/collections", { name });
  // Sheets shows the search only with a sheet in the library.
  await createSheet(page, name);
  await recordMoves(page);
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");

  await page
    .getByRole("link", { name: "Collections", exact: true })
    .first()
    .click();
  await expect(heading(page)).toHaveText("Collections");
  await lastMove(page, 1);
  await page
    .getByRole("main")
    .getByRole("link", { name: new RegExp(name) })
    .click();
  await expect(heading(page)).toHaveText(name);
  await lastMove(page, 2);
  await page.getByRole("link", { name: "Sheets", exact: true }).first().click();
  await expect(heading(page)).toHaveText("Sheets");
  const fade = await lastMove(page, 3);
  expect(await kinds(page)).toEqual(["fade", "fade", "fade"]);
  // The rail isn't a part of its own, so nothing is painted over the content.
  expect(fade.animations?.map((a) => a.pseudo)).not.toContainEqual(
    expect.stringContaining("(rail"),
  );

  await page.getByRole("searchbox").fill("grace");
  await expect(page).toHaveURL(/q=grace/);
  await page.waitForLoadState("networkidle");
  expect(await moves(page)).toHaveLength(3);
});

// Requirement "Still with reduced motion", scenario "Opening a sheet".
test("moves pages in no time with reduced motion", async ({ page }) => {
  const mark = newMark();
  const title = `Still ${mark}`;
  await createSheet(page, title);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await recordMoves(page);
  await page.goto(`/sheets?q=${mark}`);
  await page.waitForLoadState("networkidle");

  await page
    .getByRole("link", { name: "Collections", exact: true })
    .first()
    .click();
  await expect(heading(page)).toHaveText("Collections");
  await lastMove(page, 1);
  await page.goBack();
  await expect(heading(page)).toHaveText("Sheets");
  await lastMove(page, 2);
  await page.getByRole("main").getByRole("link", { name: title }).click();
  await expect(heading(page)).toHaveText(title);
  await lastMove(page, 3);

  const all = await moves(page);
  expect(all.map((m) => m.move)).toEqual(["fade", "fade", "rise"]);
  for (const move of all) {
    expect(move.animations?.length).toBeGreaterThan(0);
    for (const animation of move.animations ?? []) {
      expect(animation.duration).toBe(0);
    }
  }
});

// Scenarios "Opening a sheet" and "The browser's back", with Recent and the
// list showing the same sheet.
test("raises a sheet from its row, and drops it on Back", async ({ page }) => {
  const title = `Risen ${newMark()}`;
  const id = await createSheet(page, title);
  // Opened once, so it is in Recent too.
  await page.goto(`/sheets/${id}`);
  await recordMoves(page);
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  const row = page
    .locator(".sheet-list-row")
    .filter({ hasText: title })
    .getByRole("link");
  const card = page
    .locator(".recent-sheets")
    .getByRole("link", { name: new RegExp(title) });
  await expect(card).toBeVisible();

  await row.scrollIntoViewIfNeeded();
  const rowTitle = await row.locator(".library-title").boundingBox();
  await row.click();
  await expect(heading(page)).toHaveText(title);
  const rise = await lastMove(page, 1);
  expect(rise).toMatchObject({ move: "rise" });
  expect(movesTitle(rise)).toBe(true);
  // The title moves by translate and scale only, from the row's box.
  expect(
    rise.animations?.find(
      (a) => a.pseudo === "::view-transition-group(sheet-title)",
    ),
  ).toMatchObject({ name: "title-move", duration: 300 });
  expectBox(rise.titleStart, rowTitle);
  expect(
    rise.animations?.find((a) => a.pseudo === "::view-transition-new(root)"),
  ).toMatchObject({ name: "page-rise", duration: 300 });

  const headingBox = await heading(page).boundingBox();
  await page.getByRole("link", { name: "Back" }).click();
  await expect(heading(page)).toHaveText("Sheets");
  const drop = await lastMove(page, 2);
  expect(drop).toMatchObject({ move: "drop" });
  expect(movesTitle(drop)).toBe(true);
  expectBox(drop.titleStart, headingBox);
  expect(
    drop.animations?.find((a) => a.pseudo === "::view-transition-old(root)"),
  ).toMatchObject({ name: "page-drop", duration: 150 });

  await card.click();
  await expect(heading(page)).toHaveText(title);
  await lastMove(page, 3);
  await page.goBack();
  await expect(heading(page)).toHaveText("Sheets");
  await lastMove(page, 4);
  const all = await moves(page);
  expect(all.map((m) => m.move)).toEqual(["rise", "drop", "rise", "drop"]);
  expect(all.every(movesTitle)).toBe(true);
});

// Scenario "Back to a search", and Back from a sheet opened from a link.
test("drops back into the list where it was scrolled", async ({ page }) => {
  const mark = newMark();
  for (let i = 0; i < 25; i++) {
    await createSheet(page, `Scrolled ${mark} ${String(i).padStart(2, "0")}`);
  }
  const fromLink = await createSheet(page, `Linked ${mark}`);
  await recordMoves(page);
  await page.goto(`/sheets?q=${mark}`);
  await page.waitForLoadState("networkidle");
  const last = page.locator(".sheet-list-row").last().getByRole("link");
  const title = await last.locator(".library-title").textContent();
  await last.scrollIntoViewIfNeeded();
  const scrolled = await page.evaluate(() => window.scrollY);
  expect(scrolled).toBeGreaterThan(0);

  await last.click();
  await expect(heading(page)).toHaveText(title ?? "");
  await lastMove(page, 1);
  await page.goBack();
  await expect(heading(page)).toHaveText("Sheets");
  const drop = await lastMove(page, 2);
  expect(drop).toMatchObject({ move: "drop", scrollY: scrolled });

  await page.goto(`/sheets/${fromLink}`);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/sheets$/);
  expect(await lastMove(page, 1)).toMatchObject({ move: "drop" });
});

// Scenarios "From playing to editing" and "Done".
test("changes only the bar between play and edit", async ({ page }) => {
  const title = `Mode ${newMark()}`;
  const id = await createSheet(page, title);
  await recordMoves(page);
  await page.goto(`/sheets/${id}`);
  const edit = page.getByRole("banner").getByRole("link", { name: "Edit" });
  const done = page.getByRole("banner").getByRole("button", { name: "Done" });
  const line = page.locator(".ProseMirror .line").first();

  await edit.click();
  await expect(line).toBeVisible();
  await lastMove(page, 1);
  // Done right after a change, which waits for the save.
  const box = await line.boundingBox();
  if (!box) throw new Error("no box");
  await line.click({ position: { x: box.width - 2, y: box.height / 2 } });
  await page.keyboard.type(" again");
  await done.click();
  await expect(page).toHaveURL(new RegExp(`/sheets/${id}$`));
  await expect(page.getByText("sound again")).toBeVisible();
  await lastMove(page, 2);

  await edit.click();
  await expect(line).toBeVisible();
  await lastMove(page, 3);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/sheets/${id}$`));
  await lastMove(page, 4);
  const all = await moves(page);
  expect(all.map((m) => m.move)).toEqual(["mode", "mode", "mode", "mode"]);
  expect(all.some(movesTitle)).toBe(false);
});

// Scenario "The page that is open": "Sheet Library" or "Sheets" on Sheets,
// right after the drop from a sheet.
test("doesn't move into the page that is open", async ({ page }) => {
  const title = `Same ${newMark()}`;
  await createSheet(page, title);
  await recordMoves(page);
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  await page
    .locator(".sheet-list-row")
    .filter({ hasText: title })
    .getByRole("link")
    .click();
  await expect(heading(page)).toHaveText(title);
  await lastMove(page, 1);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(heading(page)).toHaveText("Sheets");
  await lastMove(page, 2);

  await page.getByRole("link", { name: "Sheets", exact: true }).first().click();
  expect(await lastMove(page, 3)).toMatchObject({
    move: "none",
    animations: [],
  });
});

// Scenario "A slow answer".
test("changes at once when the new page's data comes late", async ({
  page,
}) => {
  const title = `Late ${newMark()}`;
  const id = await createSheet(page, title);
  await recordMoves(page);
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  const row = page
    .locator(".sheet-list-row")
    .filter({ hasText: title })
    .getByRole("link");
  await page.route(new RegExp(`/sheets/${id}\\.data`), async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.continue();
  });
  await row.click();
  await expect(heading(page)).toHaveText(title);
  expect(await lastMove(page, 1)).toMatchObject({
    move: "none",
    animations: [],
  });

  // A quick answer still moves.
  await page.unroute(new RegExp(`/sheets/${id}\\.data`));
  await page.goBack();
  await expect(heading(page)).toHaveText("Sheets");
  await lastMove(page, 2);
  await row.click();
  await expect(heading(page)).toHaveText(title);
  expect(await lastMove(page, 3)).toMatchObject({ move: "rise" });
});
