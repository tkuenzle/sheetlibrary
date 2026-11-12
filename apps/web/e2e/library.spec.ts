import { expect, type Page, test } from "@playwright/test";

import { findLink } from "./emails";
import { authFile } from "./servers";

// The library at /sheets.

function heading(page: Page) {
  return page.getByRole("heading", { level: 1 });
}

// The Import menu's button. On a phone, it is the docked one.
function importButton(page: Page) {
  return page.getByRole("button", { name: "Import", exact: true });
}

async function openUltimateGuitar(page: Page) {
  await importButton(page).click();
  await page.getByRole("menuitem", { name: "From Ultimate Guitar…" }).click();
}

function passkeyOffer(page: Page) {
  return page.getByRole("region", { name: "Passkey" });
}

function importDialog(page: Page) {
  return page.getByRole("dialog", { name: "Import from Ultimate Guitar" });
}

async function pasteAndImport(page: Page, text: string) {
  await openUltimateGuitar(page);
  await importDialog(page).getByLabel("Chords and lyrics").fill(text);
  await importDialog(page)
    .getByRole("button", { name: "Import", exact: true })
    .click();
}

// Scenarios "Opening the email link", "First sign-in" and "Starting a
// sheet", and the passkey offer. A new account starts with no sheets, so this signs in by email
// itself. Sign-in emails are limited per visitor, so only on one project.
test("a new account signs in to an empty library and starts a sheet", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "One sign-in email per run");

  // The sign-in page asks for a link back to the library. A mark is added,
  // so the test can find the email.
  const mark = crypto.randomUUID();
  let callbackURL: string | undefined;
  await page.route("**/api/auth/sign-in/magic-link", async (route) => {
    const body = route.request().postDataJSON() as { callbackURL: string };
    callbackURL = body.callbackURL;
    const marked = new URL(body.callbackURL, "http://localhost");
    marked.searchParams.set("e2e", mark);
    await route.continue({
      postData: JSON.stringify({
        ...body,
        callbackURL: marked.pathname + marked.search,
      }),
    });
  });
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(`e2e-${mark}@example.com`);
  await page.getByRole("button", { name: "Send link" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();
  expect(callbackURL).toBe("/sheets?passkey");

  let link: string | undefined;
  await expect.poll(async () => (link = await findLink(mark))).toBeDefined();
  await page.goto(link ?? "");
  await expect(page).toHaveURL(/\/sheets\?/);
  await expect(page).toHaveTitle("Library | Sheet Library");
  await expect(heading(page)).toHaveText("Library");
  await expect(page.getByText("No sheets yet")).toBeVisible();
  await expect(importButton(page)).toBeVisible();

  // Scenarios "First email sign-in", "Opening the account page" and "Closed
  // before". A reload doesn't offer it again.
  await expect(passkeyOffer(page)).toContainText(
    "Add a passkey to sign in on this device without waiting for an email.",
  );
  await expect(page).not.toHaveURL(/passkey/);
  await page.reload();
  await expect(heading(page)).toHaveText("Library");
  await expect(passkeyOffer(page)).toHaveCount(0);
  await page.goto("/sheets?passkey");
  await passkeyOffer(page).getByRole("link", { name: "Add passkey" }).click();
  await expect(page).toHaveURL("/account");
  await page.goto("/sheets?passkey");
  await passkeyOffer(page).getByRole("button", { name: "Close" }).click();
  await expect(passkeyOffer(page)).toHaveCount(0);
  await page.goto("/sheets?passkey");
  await expect(heading(page)).toHaveText("Library");
  await expect(passkeyOffer(page)).toHaveCount(0);

  await page.getByRole("button", { name: "New sheet" }).click();
  await expect(page).toHaveURL(/\/sheets\/[\w-]{12}\/edit$/);
  await expect(page.getByLabel("Title")).toHaveValue("Untitled");

  await page.getByRole("banner").getByRole("link", { name: "Library" }).click();
  await expect(page).toHaveURL("/sheets");
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("listitem")).toContainText("Untitled");
  await expect(page.getByRole("listitem")).toContainText("Today");
});

test.describe("signed in", () => {
  test.use({ storageState: authFile });

  // Scenario "Signed in" (home page).
  test("the home page opens the library", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/sheets");
    await expect(heading(page)).toHaveText("Library");
  });

  // On a phone, the button is docked at the bottom right.
  test("starts a sheet from the list", async ({ page }, testInfo) => {
    await page.request.post("/api/sheets", {
      data: {
        title: "Amazing Grace",
        content: { format: "chordsheet", version: 1, sections: [] },
      },
    });
    await page.goto("/sheets");
    // Other tests add sheets to this account too, so only its presence is
    // checked, not its place.
    await expect(
      page.getByRole("link", { name: /Amazing Grace/ }).first(),
    ).toBeVisible();
    const button = page.getByRole("button", { name: "New sheet" });
    if (testInfo.project.name === "phone") {
      const box = await button.boundingBox();
      const viewport = page.viewportSize();
      expect(box && viewport).toBeTruthy();
      if (box && viewport) {
        expect(box.x + box.width).toBeGreaterThan(viewport.width - 32);
        expect(box.y + box.height).toBeGreaterThan(viewport.height - 48);
      }
    }
    await button.click();

    // Scenario "Naming a new sheet": the title field is open, with
    // "Untitled" selected, so typing replaces it.
    const title = `Sheet ${crypto.randomUUID().slice(0, 8)}`;
    await expect(page.getByLabel("Title")).toBeFocused();
    await page.keyboard.type(title);
    await page.keyboard.press("Enter");
    await expect(heading(page)).toHaveText(title);
    await expect(page).toHaveURL(/\/sheets\/[\w-]{12}\/edit$/);

    // A reload doesn't open the field again.
    await expect(page.getByRole("status")).toHaveText("Saved");
    await page.reload();
    await expect(heading(page)).toHaveText(title);
    await expect(page.getByLabel("Title")).toHaveCount(0);
  });
});

test.describe("the import", () => {
  test.use({ storageState: authFile });

  const verse = ["[Verse 1]", "C     G", "Hello world"].join("\n");

  test.beforeEach(async ({ page }) => {
    await page.goto("/sheets");
  });

  // Scenario "Importing a song". On a phone, "Import" is docked beside
  // "New sheet" and keeps its text.
  test("creates a sheet and opens it, to be named", async ({ page }) => {
    await expect(importButton(page)).toHaveText("Import");
    await pasteAndImport(page, verse);
    await expect(page).toHaveURL(/\/sheets\/[\w-]{12}\/edit$/);
    await expect(page.getByLabel("Title")).toBeFocused();
    await expect(page.getByLabel("Title")).toHaveValue("Untitled");
    await expect(page.locator(".section-label")).toHaveText(["Verse 1"]);
    await expect(page.locator(".ProseMirror .line")).toHaveText([
      "Hello world",
    ]);
    await expect(page.locator(".chord-label")).toHaveText(["C", "G"]);

    // It is stored: a reload shows it again.
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(heading(page)).toHaveText("Untitled");
    await expect(page.locator(".chord-label")).toHaveText(["C", "G"]);
  });

  // Scenario "Importing with a capo".
  test("opens a sheet written for a capo with it", async ({ page }) => {
    await pasteAndImport(page, ["Capo: 2nd fret", verse].join("\n"));
    await expect(page).toHaveURL(/\/sheets\/[\w-]{12}\/edit\?capo=2$/);
    await page.keyboard.press("Escape");
    const capoButton = page.getByRole("button", { name: /^Capo/ });
    await expect(capoButton).toHaveText("Capo 2");
    await expect(page.locator(".chord-label")).toHaveText(["C", "G"]);

    // It is stored as it sounds, and opens so from the library.
    const id = /\/sheets\/([\w-]{12})/.exec(page.url())?.[1] ?? "";
    await page.goto(`/sheets/${id}/edit`);
    await expect(capoButton).toHaveText("Capo");
    await expect(page.locator(".chord-label")).toHaveText(["D", "A"]);
  });

  // Scenario "Cancelling".
  test("cancels without a new sheet", async ({ page }) => {
    const posts: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") posts.push(request.url());
    });
    await openUltimateGuitar(page);
    await expect(importDialog(page)).not.toContainText("replaces");
    await importDialog(page).getByLabel("Chords and lyrics").fill(verse);
    await importDialog(page).getByRole("button", { name: "Cancel" }).click();
    await expect(importDialog(page)).toBeHidden();
    await expect(importButton(page)).toBeFocused();
    await expect(page).toHaveURL("/sheets");
    expect(posts).toEqual([]);
  });

  // Scenario "Too large".
  test("keeps the dialog open when the text is too long", async ({ page }) => {
    // About 50 KB of text, but a sheet of more than 256 KB: a chord costs
    // more in a sheet than in the text.
    const pair = `${"C ".repeat(40)}\n${"la".repeat(40)}`;
    const text = Array.from({ length: 300 }, () => pair).join("\n");
    await pasteAndImport(page, text);
    await expect(importDialog(page)).toContainText(
      "The text is too long to import.",
    );
    await expect(
      importDialog(page).getByLabel("Chords and lyrics"),
    ).toHaveValue(text);
    await expect(
      importDialog(page).getByRole("button", { name: "Import", exact: true }),
    ).toBeEnabled();
    await expect(page).toHaveURL("/sheets");
  });
});

// Scenarios of openspec/specs/library-search. The account is shared with
// other tests and runs, so each test searches a word of its own.
test.describe("search", () => {
  test.use({ storageState: authFile });

  // A word no other sheet holds: letters only, so it is one word.
  const word = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(10)), (n) =>
      String.fromCharCode(97 + (n % 26)),
    ).join("");

  async function addSheet(page: Page, title: string, ...lines: string[]) {
    const response = await page.request.post("/api/sheets", {
      data: {
        title,
        content: {
          format: "chordsheet",
          version: 1,
          sections:
            lines.length === 0
              ? []
              : [{ lines: lines.map((text) => ({ text, chords: [] })) }],
        },
      },
    });
    expect(response.ok()).toBe(true);
    return ((await response.json()) as { id: string }).id;
  }

  const field = (page: Page) =>
    page.getByRole("searchbox", { name: "Search sheets" });

  // Scenarios "Finding by lyrics", "Without the umlaut" and "Lyrics match".
  test("finds a sheet by a line of its lyrics, without the umlaut", async ({
    page,
  }) => {
    const tag = word();
    await addSheet(page, "Sternsinger", "Stille Nacht", `Drei Kö${tag} ziehen`);
    await page.goto("/sheets");
    await field(page).fill(`ko${tag}`);
    await expect(page).toHaveURL(`/sheets?q=ko${tag}`);
    await expect(page.getByRole("search").getByRole("status")).toHaveText(
      "1 sheet",
    );
    const row = page.getByRole("listitem");
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Sternsinger");
    await expect(row).toContainText(`Drei Kö${tag} ziehen`);
    await expect(row.locator("mark")).toHaveText(`Kö${tag}`);

    // A reload shows the same results.
    await page.reload();
    await expect(field(page)).toHaveValue(`ko${tag}`);
    await expect(page.getByRole("listitem")).toHaveCount(1);
  });

  // Scenario "Back leaves the library".
  test("goes back to the sheet the library was opened from", async ({
    page,
  }) => {
    const tag = word();
    const id = await addSheet(page, `Amazing ${tag}`);
    await page.goto(`/sheets/${id}`);
    await expect(heading(page)).toHaveText(`Amazing ${tag}`);
    await page.getByRole("link", { name: "Library" }).click();
    await expect(page).toHaveURL("/sheets");
    await field(page).pressSequentially(tag.slice(0, 5), { delay: 100 });
    await expect(page).toHaveURL(`/sheets?q=${tag.slice(0, 5)}`);
    await page.goBack();
    await expect(page).toHaveURL(`/sheets/${id}`);
  });

  // Scenario "Clearing".
  test("clears the search", async ({ page }) => {
    const tag = word();
    await addSheet(page, `Amazing ${tag}`);
    await page.goto(`/sheets?q=${tag}`);
    await expect(page.getByRole("listitem")).toHaveCount(1);
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page).toHaveURL("/sheets");
    await expect(field(page)).toHaveValue("");
    await expect(field(page)).toBeFocused();
    await expect(page.getByRole("search").getByRole("status")).toHaveText("");
  });

  // Scenario "Slow connection".
  test("says it is searching while results are slow", async ({ page }) => {
    const tag = word();
    await addSheet(page, `Amazing ${tag}`);
    await page.goto(`/sheets?q=${tag}`);
    await expect(page.getByRole("listitem")).toHaveCount(1);
    // The page's data for the next search arrives two seconds late.
    await page.route(/\/sheets\.data\?/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });
    await field(page).fill(`amazing ${tag}`);
    const status = page.getByRole("search").getByRole("status");
    await expect(status).toHaveText("Searching…");
    await expect(page.locator(".library-list")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(status).toHaveText("1 sheet");
    await expect(page.locator(".library-list")).not.toHaveAttribute(
      "aria-busy",
    );
    await expect(page).toHaveURL(/q=amazing/);
  });

  // Scenario "Nothing found". Also on a phone, in the phone project.
  test("says when no sheet matches", async ({ page }) => {
    const tag = word();
    await page.goto(`/sheets?q=${tag}`);
    await expect(
      page.getByRole("heading", { name: `No sheets match “${tag}”` }),
    ).toBeVisible();
    await expect(page.getByRole("listitem")).toHaveCount(0);
    await expect(field(page)).toBeVisible();
  });
});

test.describe("not signed in", () => {
  // Scenario "Not signed in".
  test("sends visitors to sign-in", async ({ page }) => {
    await page.goto("/sheets");
    await expect(page).toHaveURL("/sign-in");
  });
});
