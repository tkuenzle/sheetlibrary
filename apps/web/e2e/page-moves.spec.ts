import { type Page, type Route } from "@playwright/test";

import {
  answerAtOnce,
  createCollection,
  createSheet,
  delay,
  expect,
  newMark,
  test,
} from "./fixtures";

// How page changes move: the shell's screens fade, a sheet rises over the
// shell and drops on Back, and play to edit only changes the bar. The tests
// record each view transition React starts and read, once the browser has
// set up the move, its kind (the transition's type) and what animates. See
// openspec/specs/site-layout and docs/motion.md.

test.use({ signedIn: true });

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

// Forgets the moves recorded so far, so the next one counts as the first.
const forgetMoves = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as { moves: Move[] }).moves.length = 0;
  });

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
  await createCollection(page, name);
  // Sheets shows the search only with a sheet in the library.
  await createSheet(page, { title: name, content });
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
  await createSheet(page, { title: title, content });
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
test(
  "raises a sheet from its row, and drops it on Back",
  { tag: "@timing" },
  async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const title = `Risen ${newMark()}`;
    const id = await createSheet(page, { title: title, content });
    // Opened once, so it is in Recent too.
    await page.goto(`/sheets/${id}`);
    // Sheets is reached by a move inside the app, so its data is in memory
    // for the step back below, which then comes within the wait.
    const answers = await answerAtOnce(page, /\/sheets\.data/);
    await recordMoves(page);
    await page.goto("/collections");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("link", { name: "Sheets", exact: true })
      .first()
      .click();
    await expect(heading(page)).toHaveText("Sheets");
    await lastMove(page, 1);
    await forgetMoves(page);
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
    expect(answers.fromMemory()).toBe(1);
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
  },
);

// Requirement "Pages known from the start": the first page brings every
// route, so a sheet opened right after Sheets loads asks only for its data,
// not which route its address leads to (`/__manifest`).
test("opens a sheet without looking up its route", async ({ page }) => {
  const title = `Known ${newMark()}`;
  const id = await createSheet(page, { title: title, content });
  await page.goto("/sheets");
  const row = page
    .locator(".sheet-list-row")
    .filter({ hasText: title })
    .getByRole("link");
  await row.waitFor();
  const asked: string[] = [];
  page.on("request", (request) => {
    const { pathname } = new URL(request.url());
    if (pathname === "/__manifest" || pathname.endsWith(".data")) {
      asked.push(pathname);
    }
  });
  await row.click();
  await expect(heading(page)).toHaveText(title);
  await page.waitForLoadState("networkidle");
  expect(asked).toEqual([`/sheets/${id}.data`]);
});

// Scenario "Back to a search", and Back from a sheet opened from a link.
test("drops back into the list where it was scrolled", async ({ page }) => {
  const mark = newMark();
  for (let i = 0; i < 25; i++) {
    await createSheet(page, {
      title: `Scrolled ${mark} ${String(i).padStart(2, "0")}`,
      content,
    });
  }
  const fromLink = await createSheet(page, {
    title: `Linked ${mark}`,
    content,
  });
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

// Scenario "Back to a slow list": after a change, a step back loads the
// list as on any other move, though the address has already changed when
// its loader runs. The sheet drops off the list's skeleton.
test("drops a sheet onto the list's bars when the list is slow after a change", async ({
  page,
}) => {
  const title = `Slow back ${newMark()}`;
  await createSheet(page, { title: title, content });
  await recordMoves(page);
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  const row = page
    .locator(".sheet-list-row")
    .filter({ hasText: title })
    .getByRole("link");
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await expect(heading(page)).toHaveText(title);
  await lastMove(page, 1);
  await rename(page, title, `${title} again`);

  // Only the list: the shell's collections come in a request of their own.
  await delay(page, /\/sheets\.data\?_routes=routes%2Fsheets$/, 2000);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.locator("main .sheet-list-skeleton").first()).toBeVisible();
  await expect(
    page.locator(".sheet-list-row").filter({ hasText: `${title} again` }),
  ).toBeVisible();
});

// Renames the open sheet in edit mode and goes back to play with Done. The
// change goes through the app, as a person makes it.
async function rename(page: Page, from: string, to: string) {
  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByRole("button", { name: from }).click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(to);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(heading(page)).toHaveText(to);
}

// Notes whether a page showed bars, from the next page load on.
async function recordBars(page: Page) {
  await page.addInitScript(() => {
    const log: { bars: boolean; recentBars: boolean; titles: string[] } = {
      bars: false,
      recentBars: false,
      titles: [],
    };
    (window as unknown as { barsLog: typeof log }).barsLog = log;
    new MutationObserver(() => {
      if (document.querySelector("main .sheet-list-skeleton")) log.bars = true;
      if (document.querySelector("main .recent-sheets-skeleton")) {
        log.recentBars = true;
      }
      for (const row of document.querySelectorAll("main .sheet-list-row")) {
        log.titles.push(row.textContent);
      }
    }).observe(document, { subtree: true, childList: true });
  });
}

const barsLog = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          barsLog: { bars: boolean; recentBars: boolean; titles: string[] };
        }
      ).barsLog,
  );

const clearBarsLog = (page: Page) =>
  page.evaluate(() => {
    const log = (
      window as unknown as {
        barsLog: { bars: boolean; recentBars: boolean; titles: string[] };
      }
    ).barsLog;
    log.bars = false;
    log.recentBars = false;
    log.titles = [];
  });

// A collection holding a sheet for each of `titles`, opened from the rail,
// or on a phone from Collections.
async function openNewCollection(page: Page, titles: string[]) {
  const name = `Kept ${newMark()}`;
  const id = await createCollection(page, name);
  for (const title of titles) {
    const sheet = await createSheet(page, { title: title, content });
    const response = await page.request.put(
      `/api/sheets/${sheet}/collections/${id}`,
    );
    expect(response.ok()).toBe(true);
  }
  const wide = (page.viewportSize()?.width ?? 0) >= 1024;
  await page.goto(wide ? "/sheets" : "/collections");
  await page.waitForLoadState("networkidle");
  await (
    wide
      ? page.getByRole("navigation", { name: "Main" })
      : page.getByRole("main")
  )
    .getByRole("link", { name: new RegExp(name) })
    .click();
  await expect(heading(page)).toHaveText(name);
  await expect(page.locator("main .sheet-list-row")).toHaveCount(titles.length);
  return name;
}

// Scenario "Back to a slow collection": the collection shows as it was
// left, without waiting for the server, and the heading moves into its row.
test("drops a sheet onto the collection as it was left", async ({ page }) => {
  const mark = newMark();
  const titles = [`One ${mark}`, `Two ${mark}`, `Three ${mark}`];
  await recordMoves(page);
  await recordBars(page);
  const name = await openNewCollection(page, titles);
  const before = await settledMoves(page);
  await page
    .locator(".sheet-list-row")
    .filter({ hasText: titles[1] })
    .getByRole("link")
    .click();
  await expect(heading(page)).toHaveText(titles[1] ?? "");
  await lastMove(page, before + 1);
  await clearBarsLog(page);

  // Everything: the collection, the shell's collections and the root.
  await delay(page, /\.data/, 2000);
  await page.getByRole("link", { name: "Back" }).click();
  const drop = await lastMove(page, before + 2);
  expect(kindOf(drop)).toBe("drop");
  expect(movesTitle(drop)).toBe(true);
  await expect(heading(page)).toHaveText(name);
  await expect(page.locator("main .sheet-list-row")).toHaveCount(3);
  // The load behind it changes nothing on screen.
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main .sheet-list-row")).toHaveCount(3);
  expect((await barsLog(page)).bars).toBe(false);
});

// Scenario "Fresh data after Back": a sheet added on another device shows
// once the load behind the page is done.
test("brings in what changed elsewhere after Back", async ({ page }) => {
  const mark = newMark();
  await openNewCollection(page, [`First ${mark}`]);
  const id = /\/collections\/([^/]+)$/.exec(page.url())?.[1] ?? "";
  await page.locator(".sheet-list-row").getByRole("link").click();
  await expect(heading(page)).toHaveText(`First ${mark}`);
  // Playwright's own request, as from another device: it forgets nothing.
  const other = await createSheet(page, { title: `Second ${mark}`, content });
  const response = await page.request.put(
    `/api/sheets/${other}/collections/${id}`,
  );
  expect(response.ok()).toBe(true);
  await delay(page, /\.data/, 1000);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.locator("main .sheet-list-row")).toHaveCount(1);
  await expect(page.locator("main .sheet-list-row")).toHaveCount(2);
});

// Scenario "Slow collections": Back from a sheet doesn't wait for the
// shell's collections.
test("doesn't wait for the rail's collections on Back", async ({ page }) => {
  const mark = newMark();
  const name = await openNewCollection(page, [`Rail ${mark}`]);
  await page.locator(".sheet-list-row").getByRole("link").click();
  await expect(heading(page)).toHaveText(`Rail ${mark}`);
  await delay(page, /_routes=routes%2Fshell/, 3000);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(heading(page)).toHaveText(name, { timeout: 1500 });
});

// Scenario "Offline Back": the collection shows as it was left, and stays,
// without a note.
test("shows the collection as it was left offline", async ({
  page,
  context,
}) => {
  const mark = newMark();
  const name = await openNewCollection(page, [`Offline ${mark}`]);
  await page.locator(".sheet-list-row").getByRole("link").click();
  await expect(heading(page)).toHaveText(`Offline ${mark}`);
  await context.setOffline(true);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(heading(page)).toHaveText(name);
  await page.waitForTimeout(1500);
  await expect(heading(page)).toHaveText(name);
  await expect(page.locator("main .sheet-list-row")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
  await context.setOffline(false);
});

// Scenario "A renamed sheet": a change forgets what Back would show.
test("never shows a sheet's old title on Back after a rename", async ({
  page,
}) => {
  const title = `Old ${newMark()}`;
  await createSheet(page, { title: title, content });
  await recordBars(page);
  await page.goto(`/sheets?q=${title.split(" ")[1] ?? ""}`);
  await expect(page.locator("main .sheet-list-row")).toHaveCount(1);
  await page.locator(".sheet-list-row").getByRole("link").click();
  await expect(heading(page)).toHaveText(title);
  await rename(page, title, `New ${title}`);
  await clearBarsLog(page);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(
    page.locator(".sheet-list-row").filter({ hasText: `New ${title}` }),
  ).toBeVisible();
  const { titles } = await barsLog(page);
  expect(
    titles.some(
      (text) => text.includes(title) && !text.includes(`New ${title}`),
    ),
  ).toBe(false);
});

// Requirement "Back shows the page as it was left": a search scrolled far
// down comes back at once with its rows and its scroll, though the server
// is slow.
test("brings back a search and its scroll at once on Back", async ({
  page,
}) => {
  const mark = newMark();
  await Promise.all(
    Array.from({ length: 40 }, (_, i) =>
      createSheet(page, {
        title: `Scroll ${mark} ${String(i).padStart(2, "0")}`,
        content,
      }),
    ),
  );
  await recordMoves(page);
  await recordBars(page);
  await page.goto(`/sheets?q=${mark}`);
  await expect(page.locator("main .sheet-list-row")).toHaveCount(40);
  const before = await settledMoves(page);
  const row = page.locator(".sheet-list-row").last().getByRole("link");
  await row.scrollIntoViewIfNeeded();
  const scrolled = await page.evaluate(() => window.scrollY);
  expect(scrolled).toBeGreaterThan(1000);
  const title = (await row.textContent()) ?? "";
  await row.click();
  await expect(heading(page)).toContainText(`Scroll ${mark}`);
  expect(title).toContain(await heading(page).innerText());
  await lastMove(page, before + 1);
  await clearBarsLog(page);

  await delay(page, /\.data/, 2000);
  await page.getByRole("link", { name: "Back" }).click();
  const drop = await lastMove(page, before + 2);
  expect(kindOf(drop)).toBe("drop");
  expect(drop.scrollY).toBe(scrolled);
  await expect(page.locator("main .sheet-list-row")).toHaveCount(40);
  expect((await barsLog(page)).bars).toBe(false);
});

// Opens a new sheet from its row on Sheets, and gives its row's link.
async function openFromSheets(page: Page, title: string) {
  await createSheet(page, { title: title, content });
  await page.goto("/sheets");
  await page.waitForLoadState("networkidle");
  const before = (await moves(page)).length;
  const row = page
    .locator(".sheet-list-row")
    .filter({ hasText: title })
    .getByRole("link");
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await expect(heading(page)).toHaveText(title);
  await lastMove(page, before + 1);
  await clearBarsLog(page);
  return { row, before: before + 1 };
}

const recentCards = (page: Page) => page.locator("main .recent-sheets a");

// Scenario "Back to Sheets when slow": the list as it was left, at once,
// with bars only in Recent, which opening the sheet changed.
test("drops a sheet onto the list as it was left, with bars in Recent", async ({
  page,
}) => {
  const title = `Recent back ${newMark()}`;
  await recordMoves(page);
  await recordBars(page);
  const { row, before } = await openFromSheets(page, title);
  await delay(page, /\.data/, 2000);
  await page.getByRole("link", { name: "Back" }).click();
  expect(kindOf(await lastMove(page, before + 1))).toBe("drop");
  await expect(row).toBeVisible();
  await expect(page.locator("main .recent-sheets-skeleton")).toHaveCount(4);
  // The cards take the bars' place. Which sheets they show isn't checked:
  // other tests open sheets on this account too, and in the 2s held back
  // they can push this one out of Recent.
  await expect(page.locator("main .recent-sheets-skeleton")).toHaveCount(0);
  await expect(recentCards(page).first()).toBeVisible();
  const log = await barsLog(page);
  expect(log.bars).toBe(false);
  expect(log.recentBars).toBe(true);
});

// Scenario "Back to a quick list": the fresh list, without bars, with the
// sheet first in Recent.
test(
  "drops a sheet onto the fresh list when it comes quickly",
  { tag: "@timing" },
  async ({ page }) => {
    const title = `Quick back ${newMark()}`;
    await recordMoves(page);
    await recordBars(page);
    const { before } = await openFromSheets(page, title);
    await delay(page, /\.data/, 50);
    await page.getByRole("link", { name: "Back" }).click();
    expect(kindOf(await lastMove(page, before + 1))).toBe("drop");
    // Other tests open sheets on this account too, so it may not stay first.
    await expect(recentCards(page).filter({ hasText: title })).toHaveCount(1);
    const log = await barsLog(page);
    expect(log.bars).toBe(false);
    expect(log.recentBars).toBe(false);
  },
);

// Scenario "Swiping back to a slow list": after the browser's own move, the
// list as it was left replaces the sheet at once, with bars in Recent. The
// test stands in for Safari, which says so on the step's popstate event.
test("shows the list as it was left at once after the browser's own move", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(PopStateEvent.prototype, "hasUAVisualTransition", {
      get: () => (window as unknown as { swiped?: boolean }).swiped === true,
    });
  });
  const title = `Swiped ${newMark()}`;
  await recordMoves(page);
  await recordBars(page);
  const { row, before } = await openFromSheets(page, title);
  await delay(page, /\.data/, 2000);
  await page.evaluate(() => {
    (window as unknown as { swiped?: boolean }).swiped = true;
  });
  await page.goBack();
  await expect(row).toBeVisible({ timeout: 1000 });
  await expect(page.locator("main .recent-sheets-skeleton")).toHaveCount(4);
  expect((await moves(page)).length).toBe(before);
  expect((await barsLog(page)).bars).toBe(false);
});

// Scenarios "From playing to editing" and "Done".
test("changes only the bar between play and edit", async ({ page }) => {
  const title = `Mode ${newMark()}`;
  const id = await createSheet(page, { title: title, content });
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
  await createSheet(page, { title: title, content });
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
  const id = await createSheet(page, { title: title, content });
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
test("raises a slow sheet with its title moving from the row", async ({
  page,
}) => {
  const title = `Slow sheet ${newMark()}`;
  const id = await createSheet(page, { title: title, content });
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

// Scenario "A sheet whose code is slow": what React Router loads before the
// sheet's loader runs, its route's code and maybe `/__manifest`, counts
// toward the wait for the data, so the sheet still rises before the loading
// bar shows.
test(
  "raises a sheet whose code is slow to load",
  { tag: "@timing" },
  async ({ page }) => {
    const title = `Slow code ${newMark()}`;
    const id = await createSheet(page, { title: title, content });
    await recordMoves(page);
    await page.goto("/sheets");
    await page.waitForLoadState("networkidle");
    const hold = (ms: number) => async (route: Route) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.continue();
    };
    await page.route(/\/assets\/sheet-[^/]*\.js$/, hold(80));
    await page.route(/\/__manifest\?/, hold(80));
    await page.route(new RegExp(`/sheets/${id}\\.data`), hold(1000));
    await page
      .locator(".sheet-list-row")
      .filter({ hasText: title })
      .getByRole("link")
      .click();
    await expect(heading(page)).toHaveText(title);
    expect(kindOf(await lastMove(page, 1))).toBe("rise");
  },
);

// The most time between deciding a move and the browser starting it, while
// React renders the announced move and then the new page, on a busy machine.
const SETTLE_MS = 300;

// Requirement "Every page change moves", scenario "A new sheet": a page
// change that no link starts moves by its kind too.
test("raises a new sheet's edit mode", async ({ page }) => {
  await createSheet(page, { title: `New ${newMark()}`, content });
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
  const id = await createCollection(page, name);
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
  const id = await createSheet(page, { title: title, content });
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
