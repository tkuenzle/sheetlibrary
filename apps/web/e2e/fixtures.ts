import { access } from "node:fs/promises";

import {
  test as base,
  expect,
  type APIResponse,
  type Locator,
  type Page,
  type PlaywrightWorkerArgs,
} from "@playwright/test";

import { findLink } from "./emails";
import { appURL } from "./servers";

export { expect };

// What the specs share. Each run starts with an empty database (see
// playwright.config.ts), so a test only sees what its own worker made.

// The signed-in session of this worker's account, as a storage state file.
// Signs in on the first call.
export interface Account {
  storageState(): Promise<string>;
}

interface TestOptions {
  // Whether the test's page starts signed in to the worker's account.
  signedIn: boolean;
}

interface WorkerFixtures {
  account: Account;
}

export const test = base.extend<TestOptions, WorkerFixtures>({
  signedIn: [false, { option: true }],

  // One account per worker slot (parallelIndex), not per worker: after a
  // failure Playwright starts a new worker in the same slot, which reuses
  // the account instead of sending another sign-in email.
  account: [
    async ({ playwright }, use, workerInfo) => {
      await use(slotAccount(playwright, String(workerInfo.parallelIndex)));
    },
    { scope: "worker" },
  ],

  storageState: async ({ signedIn, account, storageState }, use) => {
    await use(signedIn ? await account.storageState() : storageState);
  },
});

// The account of a worker slot, kept in a storage state file per slot.
// Sign-in emails are limited to 10 per visitor per hour, and every request
// here comes from the same visitor, so a slot signs in only when its file's
// session doesn't work. The database is new each run, so a session from an
// earlier run fails the check and the slot signs in again.
export function slotAccount(
  playwright: PlaywrightWorkerArgs["playwright"],
  slot: string,
): Account {
  const file = new URL(`../playwright/.auth/slot-${slot}.json`, import.meta.url)
    .pathname;
  let signedIn: Promise<string> | undefined;

  async function works(): Promise<boolean> {
    if (
      !(await access(file).then(
        () => true,
        () => false,
      ))
    )
      return false;
    const context = await playwright.request.newContext({
      baseURL: appURL,
      storageState: file,
    });
    const session: unknown = await (
      await context.get("/api/auth/get-session")
    ).json();
    await context.dispose();
    return !!session;
  }

  async function signIn(): Promise<string> {
    if (await works()) return file;
    const mark = crypto.randomUUID();
    const context = await playwright.request.newContext({ baseURL: appURL });
    // Better Auth refuses a request without an origin, which the browser
    // would send.
    const response = await context.post("/api/auth/sign-in/magic-link", {
      headers: { Origin: appURL },
      data: {
        email: `e2e-${mark}@example.com`,
        callbackURL: `/account?e2e=${mark}`,
      },
    });
    expect(response.ok()).toBe(true);
    let link: string | undefined;
    await expect.poll(async () => (link = await findLink(mark))).toBeDefined();
    expect((await context.get(link ?? "")).ok()).toBe(true);
    await context.storageState({ path: file });
    await context.dispose();
    expect(await works()).toBe(true);
    return file;
  }

  return { storageState: () => (signedIn ??= signIn()) };
}

// A mark to make a title or a name unique, in letters only, so the search
// finds it as one word.
export function newMark(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(10)), (n) =>
    String.fromCharCode(97 + (n % 26)),
  ).join("");
}

// A sheet with no sections.
export const emptyContent = { format: "chordsheet", version: 1, sections: [] };

// Makes a sheet through the API, as the page's account, and returns its id.
export async function createSheet(
  page: Page,
  {
    title,
    artist,
    content = emptyContent,
  }: { title: string; artist?: string; content?: object },
): Promise<string> {
  const response = await page.request.post("/api/sheets", {
    data: { title, artist, content },
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

// Makes a collection through the API and returns its id.
export async function createCollection(
  page: Page,
  name: string,
): Promise<string> {
  const response = await page.request.post("/api/collections", {
    data: { name },
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

// Puts a sheet in a collection through the API.
export async function addToCollection(
  page: Page,
  sheet: string,
  collection: string,
): Promise<void> {
  const response = await page.request.put(
    `/api/sheets/${sheet}/collections/${collection}`,
  );
  expect(response.ok()).toBe(true);
}

// Slows the requests that match `url` by `ms`. They still go to the server.
export async function delay(page: Page, url: RegExp, ms: number) {
  await page.route(url, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue();
  });
}

// Requests held back until the test lets them go.
export interface Held {
  // Resolves once a matching request has come in and is being held.
  requested(): Promise<void>;
  // Lets the held requests go on to the server, and every later one too.
  release(): void;
}

// Holds the requests that match `url` until `release()`, so a test decides
// when a page's data comes, rather than racing the server.
export async function hold(page: Page, url: RegExp): Promise<Held> {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  let requested!: () => void;
  const arrived = new Promise<void>((resolve) => (requested = resolve));
  await page.route(url, async (route) => {
    requested();
    await released;
    await route.continue();
  });
  return { requested: () => arrived, release };
}

// Answers the requests that match `url` from memory: the first request for
// each address goes to the server, and later ones get its answer at once.
// Returns how many were answered from memory.
export async function answerAtOnce(
  page: Page,
  url: RegExp,
): Promise<{ fromMemory(): number }> {
  const answers = new Map<string, Promise<APIResponse>>();
  let fromMemory = 0;
  await page.route(url, async (route) => {
    const address = route.request().url();
    const kept = answers.get(address);
    if (kept) {
      fromMemory += 1;
      await route.fulfill({ response: await kept });
      return;
    }
    const fetched = route.fetch();
    answers.set(address, fetched);
    await route.fulfill({ response: await fetched });
  });
  return { fromMemory: () => fromMemory };
}

// Waits until the element's animations, and its descendants', have ended,
// so a test measures where things are, not where they are on the way.
// Animations that repeat forever, such as a spinner's, are left out. With
// reduced motion there are none, and it returns at once.
export async function settled(locator: Locator): Promise<void> {
  await locator.evaluate(async (element) => {
    for (;;) {
      const running = element
        .getAnimations({ subtree: true })
        .filter(
          (animation) =>
            animation.playState === "running" &&
            animation.effect?.getComputedTiming().iterations !== Infinity,
        );
      if (running.length === 0) return;
      await Promise.allSettled(running.map((animation) => animation.finished));
    }
  });
}
