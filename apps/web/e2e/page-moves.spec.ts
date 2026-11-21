import { expect, type Page, test } from "@playwright/test";

import { authFile } from "./servers";

// How page changes move: the shell's screens fade, a sheet rises over the
// shell and drops on Back, and play to edit only changes the bar. The tests
// record each view transition React starts and read, once the browser has
// set up the move, its kind (the transition's type) and what animates. See
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
  startedAt?: number;
  finished?: boolean;
  finishedAt?: number;
  // The title's box where its move starts, and what its move animates.
  titleStart?: { x: number; y: number; width: number; height: number };
  titleProperties?: string[];
  // The kind of move page-moves.ts announced, as the page's
  // view-transition-class.
  types?: string[];
  // Why the browser skipped the move, such as two elements with one name.
  skipped?: string;
  scrollY?: number;
  animations?: { name: string; pseudo: string; duration: number }[];
  // The animation durations the move's pictures get from the CSS, by the
  // names React gave them. Unlike `animations`, it doesn't miss animations
  // that have already ended, as they do at once with reduced motion.
  pictureDurations?: string[];
}

// Records every view transition from the next page load on.
async function recordMoves(page: Page) {
  await page.addInitScript(() => {
    const moves: Record<string, unknown>[] = [];
    (window as unknown as { moves: unknown }).moves = moves;
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((
      update?: ViewTransitionUpdateCallback | StartViewTransitionOptions,
    ) => {
      const transition = start(update);
      const move: Record<string, unknown> = {
        types: [],
        startedAt: performance.now(),
      };
      moves.push(move);
      transition.ready.then(
        async () => {
          const classes = [...document.querySelectorAll("*")].flatMap(
            (element) =>
              getComputedStyle(element).viewTransitionClass.split(" "),
          );
          move.types = ["fade", "rise", "drop", "mode"].filter((kind) =>
            classes.includes(kind),
          );
          const names = [...document.querySelectorAll("*")]
            .map((element) => getComputedStyle(element).viewTransitionName)
            .filter((name) => name && name !== "none");
          move.pictureDurations = names.flatMap((name) =>
            ["old", "new"].map(
              (picture) =>
                getComputedStyle(
                  document.documentElement,
                  `::view-transition-${picture}(${name})`,
                ).animationDuration,
            ),
          );
          // After React's own handler of `ready`, where the title's move
          // gets its keyframes.
          for (let i = 0; i < 3; i++) await Promise.resolve();
          const animations = document.getAnimations().flatMap((animation) => {
            const effect = animation.effect;
            const pseudo =
              effect instanceof KeyframeEffect ? effect.pseudoElement : null;
            if (!effect || !pseudo?.startsWith("::view-transition")) return [];
            return [{ animation, effect: effect as KeyframeEffect, pseudo }];
          });
          move.animations = animations.map(({ animation, effect, pseudo }) => ({
            name: (animation as CSSAnimation).animationName,
            pseudo,
            duration: effect.getComputedTiming().duration,
          }));
          // The title's box where the move starts: its box in the new
          // page, shifted and scaled by the move's first keyframe, from the
          // top left.
          const title = animations.find(({ pseudo }) =>
            pseudo.startsWith("::view-transition-group(title-"),
          );
          if (title) {
            const frames = title.effect.getKeyframes();
            const first: Keyframe = frames[0] ?? {};
            move.titleProperties = [
              ...new Set(frames.flatMap((frame) => Object.keys(frame))),
            ].filter(
              (key) =>
                !["offset", "computedOffset", "easing", "composite"].includes(
                  key,
                ),
            );
            const [dx = 0, dy = 0] = String(first.translate ?? "0px 0px")
              .split(" ")
              .map(Number.parseFloat);
            const [sx = 1, sy = sx] = String(first.scale ?? "1")
              .split(" ")
              .map(Number);
            const group = getComputedStyle(
              document.documentElement,
              title.pseudo,
            );
            const at = new DOMMatrix(group.transform);
            move.titleStart = {
              x: dx + sx * at.e,
              y: dy + sy * at.f,
              width: sx * Number.parseFloat(group.width),
              height: sy * Number.parseFloat(group.height),
            };
          }
          move.scrollY = window.scrollY;
        },
        (error: unknown) => {
          move.skipped = String(error);
        },
      );
      void transition.finished.then(() => {
        move.finished = true;
        move.finishedAt = performance.now();
      });
      return transition;
    }) as typeof document.startViewTransition;
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

const kindOf = (move: Move) => move.types?.[0] ?? "none";

const kinds = async (page: Page) => (await moves(page)).map(kindOf);

// Waits for what the page loads, and gives how many moves have played.
async function settledMoves(page: Page): Promise<number> {
  await page.waitForLoadState("networkidle");
  return (await moves(page)).length;
}

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

const titleGroup = (move: Move) =>
  move.animations?.find((a) =>
    a.pseudo.startsWith("::view-transition-group(title-"),
  );

const movesTitle = (move: Move) => titleGroup(move) !== undefined;

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
  expect(all.map(kindOf)).toEqual(["fade", "fade", "rise"]);
  for (const move of all) {
    expect(move.pictureDurations?.length).toBeGreaterThan(0);
    // Such as "0s" or "0s, 0s" for a picture with two animations.
    for (const duration of move.pictureDurations ?? []) {
      const each = duration.split(",").map((one) => Number.parseFloat(one));
      expect(each).toEqual(each.map(() => 0));
    }
    for (const animation of move.animations ?? []) {
      expect(animation.duration).toBe(0);
    }
  }
});

// Scenarios "Opening a sheet" and "The browser's back", with Recent and the
// list showing the same sheet.
test("raises a sheet from its row, and drops it on Back", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
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
  expect(kindOf(rise)).toBe("rise");
  // The title moves by translate and scale only, from the row's box.
  expect(titleGroup(rise)).toMatchObject({ duration: 300 });
  expect(rise.titleProperties?.sort()).toEqual(["scale", "translate"]);
  expectBox(rise.titleStart, rowTitle);
  expect(rise.animations?.find((a) => a.name === "page-rise")).toMatchObject({
    pseudo: expect.stringContaining(
      "::view-transition-new(",
    ) as unknown as string,
    duration: 300,
  });

  const headingBox = await heading(page).boundingBox();
  await page.getByRole("link", { name: "Back" }).click();
  await expect(heading(page)).toHaveText("Sheets");
  const drop = await lastMove(page, 2);
  expect(kindOf(drop)).toBe("drop");
  expect(titleGroup(drop)).toMatchObject({ duration: 150 });
  expectBox(drop.titleStart, headingBox);
  expect(drop.animations?.find((a) => a.name === "page-drop")).toMatchObject({
    pseudo: expect.stringContaining(
      "::view-transition-old(",
    ) as unknown as string,
    duration: 150,
  });

  await card.click();
  await expect(heading(page)).toHaveText(title);
  await lastMove(page, 3);
  await page.goBack();
  await expect(heading(page)).toHaveText("Sheets");
  await lastMove(page, 4);
  // React moves no title to or from an element outside the window. Other
  // tests open sheets on this account too, so Recent's card may have
  // scrolled away by now.
  const cardInView = await card.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.right > 0 && box.left < window.innerWidth;
  });
  // Forward is a step in the history too.
  await page.goForward();
  await expect(heading(page)).toHaveText(title);
  await lastMove(page, 5);
  const all = await moves(page);
  expect(all.map(kindOf)).toEqual(["rise", "drop", "rise", "drop", "rise"]);
  expect(all.map(movesTitle)).toEqual([
    true,
    true,
    true,
    cardInView,
    cardInView,
  ]);
  // Recent and the list show the sheet with names of their own.
  expect(errors).toEqual([]);
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
  expect(kindOf(drop)).toBe("drop");
  expect(drop.scrollY).toBe(scrolled);

  await page.goto(`/sheets/${fromLink}`);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/sheets$/);
  expect(kindOf(await lastMove(page, 1))).toBe("drop");
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
  expect(all.map(kindOf)).toEqual(["mode", "mode", "mode", "mode"]);
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
  expect(await settledMoves(page)).toBe(2);
});

// Scenario "A slow answer": Edit still waits for its data, so a late one
// changes at once. A sheet doesn't wait (see the next test).
test("changes at once when the new page's data comes late", async ({
  page,
}) => {
  const title = `Late ${newMark()}`;
  const id = await createSheet(page, title);
  await recordMoves(page);
  await page.goto(`/sheets/${id}`);
  await page.waitForLoadState("networkidle");
  const edit = page.getByRole("banner").getByRole("link", { name: "Edit" });
  const line = page.locator(".ProseMirror .line").first();
  const editData = new RegExp(`/sheets/${id}/edit\\.data`);
  await page.route(editData, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.continue();
  });
  await edit.click();
  await expect(line).toBeVisible();
  expect(await settledMoves(page)).toBe(0);

  // A quick answer still moves.
  await page.unroute(editData);
  await page.goBack();
  await expect(heading(page)).toHaveText(title);
  await lastMove(page, 1);
  await edit.click();
  await expect(line).toBeVisible();
  expect(kindOf(await lastMove(page, 2))).toBe("mode");
});

// Scenario "A sheet from a row": a sheet whose data is slow still rises,
// with its title, which moves from the row, and bars for the rest.
test("raises a slow sheet at once, with its title moving from the row", async ({
  page,
}) => {
  const title = `Slow sheet ${newMark()}`;
  const id = await createSheet(page, title);
  await recordMoves(page);
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  const row = page
    .locator(".sheet-list-row")
    .filter({ hasText: title })
    .getByRole("link");
  await row.scrollIntoViewIfNeeded();
  const rowTitle = await row.locator(".library-title").boundingBox();
  await page.route(new RegExp(`/sheets/${id}\\.data`), async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await row.click();
  await expect(heading(page)).toHaveText(title);
  await expect(
    page.locator("main .sheet-view .skeleton-bar").first(),
  ).toBeVisible();
  const rise = await lastMove(page, 1);
  expect(kindOf(rise)).toBe("rise");
  expect(movesTitle(rise)).toBe(true);
  expectBox(rise.titleStart, rowTitle);
  await expect(
    page.getByText("Amazing grace, how sweet the sound"),
  ).toBeVisible();
  await expect(page.locator("main .skeleton-bar")).toHaveCount(0);
  await expect(heading(page)).toBeFocused();
});

// The most time between deciding a move and the browser starting it, while
// React renders the announced move and then the new page, on a busy machine.
const SETTLE_MS = 300;

// Requirement "Every page change moves", scenario "A new sheet": a page
// change that no link starts moves by its kind too.
test("raises a new sheet's edit mode", async ({ page }) => {
  await createSheet(page, `New ${newMark()}`);
  await recordMoves(page);
  // Making the sheet waits for the server. Once the loading bar has shown,
  // the person has seen the wait, and the page changes without a move
  // (scenario "A slow answer").
  await page.addInitScript(() => {
    const seen = window as unknown as { barSeenAt?: number };
    new MutationObserver(() => {
      if (
        seen.barSeenAt === undefined &&
        document.querySelector(".loading-bar")
      ) {
        seen.barSeenAt = performance.now();
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "New sheet" }).click();
  await page.getByRole("menuitem", { name: "Write a new sheet" }).click();
  await expect(page).toHaveURL(/\/sheets\/[\w-]{12}\/edit/);
  await page.waitForLoadState("networkidle");
  const barSeenAt = await page.evaluate(
    () => (window as unknown as { barSeenAt?: number }).barSeenAt,
  );
  await expect
    .poll(async () =>
      (await moves(page)).every(
        (m) => m.finished === true || m.skipped !== undefined,
      ),
    )
    .toBe(true);
  const all = await moves(page);
  const rise = all[0];
  if (rise) {
    expect(all.map(kindOf)).toEqual(["rise"]);
    // The bar may only show once the move has been decided.
    expect(barSeenAt ?? Infinity).toBeGreaterThan(
      (rise.startedAt ?? 0) - SETTLE_MS,
    );
  } else {
    expect(barSeenAt).toBeDefined();
  }
});

// A fetcher loads without a page change, so it doesn't move.
test("doesn't move while a dialog loads its list", async ({ page }) => {
  const name = `Dialog ${newMark()}`;
  const id = await create(page, "/api/collections", { name });
  await recordMoves(page);
  await page.goto(`/collections/${id}`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Add sheets" }).click();
  await expect(
    page.getByRole("dialog", { name: `Add sheets to “${name}”` }),
  ).toBeVisible();
  expect(await settledMoves(page)).toBe(0);
});

// Requirement "A skeleton while a page loads", scenario "Data during the
// move": React shows what arrives once the move has ended.
test("shows a sheet's lines once its rise has ended", async ({ page }) => {
  const title = `Midway ${newMark()}`;
  const id = await createSheet(page, title);
  await recordMoves(page);
  await page.addInitScript(() => {
    const at = window as unknown as { linesAt?: number };
    new MutationObserver(() => {
      const text = document.querySelector("main")?.textContent ?? "";
      if (at.linesAt === undefined && text.includes("Amazing grace")) {
        at.linesAt = performance.now();
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  const row = page
    .locator(".sheet-list-row")
    .filter({ hasText: title })
    .getByRole("link");
  await row.scrollIntoViewIfNeeded();
  await page.route(new RegExp(`/sheets/${id}\\.data`), async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await page.evaluate(() => {
      (window as unknown as { dataAt: number }).dataAt = performance.now();
    });
    await route.continue();
  });
  await row.click();
  const rise = await lastMove(page, 1);
  expect(kindOf(rise)).toBe("rise");
  await expect(
    page.getByText("Amazing grace, how sweet the sound"),
  ).toBeVisible();
  const { dataAt, linesAt } = await page.evaluate(() => {
    const at = window as unknown as { dataAt: number; linesAt: number };
    return { dataAt: at.dataAt, linesAt: at.linesAt };
  });
  // On a busy machine the data may come before the page changes, and the
  // sheet rises whole: then this scenario didn't happen.
  test.skip(
    dataAt < (rise.startedAt ?? 0),
    "the data came before the move started",
  );
  // The data came while the sheet still rose, and showed after.
  expect(dataAt).toBeLessThan(rise.finishedAt ?? 0);
  expect(linesAt).toBeGreaterThanOrEqual(rise.finishedAt ?? Infinity);
});
