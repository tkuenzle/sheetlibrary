import { expect, type Locator, type Page, test } from "@playwright/test";

// The public editor page. The editor itself is tested on the harness
// (sheet-editor.spec.ts).

test.beforeEach(async ({ page }) => {
  await page.goto("/editor");
  await expect(page.locator(".chord-label").first()).toBeVisible();
});

function firstLine(page: Page) {
  return page.locator(".ProseMirror .line").first();
}

test("shows the seed song with its chords", async ({ page }) => {
  await expect(page).toHaveTitle("Amazing Grace | Sheet Library");
  await expect(firstLine(page)).toHaveText(
    "Amazing grace, how sweet the sound",
  );
  await expect(page.locator(".chord-label")).toHaveCount(24);
  await expect(page.locator(".section-label")).toHaveText([
    "Verse 1",
    "Verse 2",
  ]);
});

test("starts over after a reload", async ({ page }) => {
  await typeAtEnd(page, " again");
  await expect(firstLine(page)).toHaveText(
    "Amazing grace, how sweet the sound again",
  );
  // Leaving with edits asks first.
  page.once("dialog", (dialog) => void dialog.accept());
  await page.reload();
  await expect(firstLine(page)).toHaveText(
    "Amazing grace, how sweet the sound",
  );
});

test.describe("leaving", () => {
  test("asks first after an edit", async ({ page }) => {
    await typeAtEnd(page, " again");
    // The prompt blocks the page, so it is answered as it comes: stay.
    const dialogs: string[] = [];
    page.on("dialog", (dialog) => {
      dialogs.push(dialog.type());
      void dialog.dismiss();
    });
    await homeLink(page).click();
    await expect.poll(() => dialogs).toEqual(["beforeunload"]);
    await expect(page).toHaveURL("/editor");
    await expect(firstLine(page)).toHaveText(
      "Amazing grace, how sweet the sound again",
    );
  });

  test("doesn't ask after undoing the edits", async ({ page }) => {
    const dialogs: string[] = [];
    page.on("dialog", (dialog) => {
      dialogs.push(dialog.type());
      void dialog.accept();
    });
    await typeAtEnd(page, " again");
    for (let i = 0; i < 10; i++) {
      if (
        (await firstLine(page).textContent()) ===
        "Amazing grace, how sweet the sound"
      ) {
        break;
      }
      await page.keyboard.press("ControlOrMeta+z");
    }
    await expect(firstLine(page)).toHaveText(
      "Amazing grace, how sweet the sound",
    );
    await homeLink(page).click();
    await expect(page).toHaveURL("/");
    expect(dialogs).toEqual([]);
  });
});

test("says it is a prototype and nothing is saved", async ({
  page,
}, testInfo) => {
  // In the side panel in a wide window, above the song on a phone.
  const note = isPhone(testInfo)
    ? page.getByRole("main").getByText("Prototype: nothing is saved.")
    : helpPanel(page).getByText("This is a prototype.");
  await expect(note).toBeVisible();
  await expect(note).toContainText(/nothing is saved/i);
});

test("shows the song's title", async ({ page }, testInfo) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Amazing Grace",
  );
  // A phone's top bar only has room for the site's name.
  if (!isPhone(testInfo)) {
    await expect(
      page.getByRole("banner").getByText("Amazing Grace"),
    ).toBeVisible();
  }
});

test("goes home from the top bar", async ({ page }) => {
  await homeLink(page).click();
  await expect(page).toHaveURL("/");
});

test("asks search engines not to index it", async ({ page }) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex",
  );
});

test.describe("the help", () => {
  test("is beside the editor in a wide window", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), "Needs a wide window");
    await expect(helpPanel(page)).toBeVisible();
    await expect(helpButton(page)).toBeHidden();
    const main = await box(page.getByRole("main"));
    expect((await box(helpPanel(page))).x).toBeGreaterThanOrEqual(
      main.x + main.width,
    );
  });

  test("stays in view while the page scrolls", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), "Needs a wide window");
    await page.setViewportSize({ width: 1280, height: 500 });
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    await expect(helpPanel(page)).toBeInViewport({ ratio: 1 });
  });

  test("opens from the top bar in a narrower window", async ({
    page,
  }, testInfo) => {
    if (!isPhone(testInfo))
      await page.setViewportSize({ width: 900, height: 800 });
    await expect(helpPanel(page)).toBeHidden();
    await helpButton(page).click();
    await expect(helpSheet(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(helpSheet(page)).toBeHidden();
    await expect(helpButton(page)).toBeFocused();
  });

  test("closes with its button or a click beside it", async ({
    page,
  }, testInfo) => {
    if (!isPhone(testInfo))
      await page.setViewportSize({ width: 900, height: 800 });
    await helpButton(page).click();
    await helpSheet(page).getByRole("button", { name: "Close" }).click();
    await expect(helpSheet(page)).toBeHidden();
    await helpButton(page).click();
    await expect(helpSheet(page)).toBeVisible();
    // The strip of the page left of the sheet.
    await page.mouse.click(10, 400);
    await expect(helpSheet(page)).toBeHidden();
  });

  test("slides out before it closes", async ({ page }, testInfo) => {
    if (!isPhone(testInfo)) {
      await page.setViewportSize({ width: 900, height: 800 });
    }
    await slowAnimations(page);
    await helpButton(page).click();
    await expect(helpSheet(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(helpSheet(page)).toHaveAttribute("data-closing");
    await expect(helpSheet(page)).toBeVisible();
    await expect(helpSheet(page)).toBeHidden();
  });

  test("closes at once with reduced motion", async ({ page }, testInfo) => {
    if (!isPhone(testInfo)) {
      await page.setViewportSize({ width: 900, height: 800 });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await slowAnimations(page);
    await helpButton(page).click();
    await expect(helpSheet(page)).toBeVisible();
    await helpSheet(page).getByRole("button", { name: "Close" }).click();
    // A slide out would take 1.5 seconds at a tenth of the speed.
    await expect(helpSheet(page)).toBeHidden({ timeout: 500 });
  });

  test("moves beside the editor when the window gets wide", async ({
    page,
  }, testInfo) => {
    test.skip(isPhone(testInfo), "Needs a mouse");
    await page.setViewportSize({ width: 900, height: 800 });
    await helpButton(page).click();
    await expect(helpSheet(page)).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(helpSheet(page)).toBeHidden();
    await expect(helpPanel(page)).toBeVisible();
  });

  test("matches the main pointer", async ({ page }, testInfo) => {
    let help = helpPanel(page);
    if (isPhone(testInfo)) {
      await helpButton(page).click();
      help = helpSheet(page);
    }
    const touch = help.getByRole("heading", { name: "With touch" });
    const mouse = help.getByRole("heading", { name: "With a mouse" });
    await expect(isPhone(testInfo) ? touch : mouse).toBeVisible();
    await expect(isPhone(testInfo) ? mouse : touch).toBeHidden();
    await expect(help.getByText("Ctrl K", { exact: true })).toBeVisible();
    await expect(help.getByText("⌘ K", { exact: true })).toBeVisible();
    await expect(help.getByText("Ctrl Shift L", { exact: true })).toBeVisible();
    await expect(help.getByText("⌘ ⇧ L", { exact: true })).toBeVisible();
  });

  // The words follow docs/ui-text.md.
  test("uses the glossary's words", async ({ page }, testInfo) => {
    let help = helpPanel(page);
    if (isPhone(testInfo)) {
      await helpButton(page).click();
      help = helpSheet(page);
    }
    const pointer = isPhone(testInfo) ? "Tap" : "Click";
    await expect(
      help.getByText("Add a chord at the cursor, or edit it"),
    ).toBeVisible();
    await expect(
      help.getByText(`${pointer} a chord to edit it, drag it to move it`),
    ).toBeVisible();
    const text = await help.innerText();
    expect(text).not.toMatch(/caret|change/i);
  });

  test("doesn't stop editing", async ({ page }, testInfo) => {
    const line = page.locator(".ProseMirror .line").nth(4);
    if (isPhone(testInfo)) {
      await line.tap();
    } else {
      await page.setViewportSize({ width: 900, height: 800 });
      await line.click();
    }
    await expect(page.locator(".section.is-active")).toHaveCount(1);
    await helpButton(page).click();
    await expect(helpSheet(page)).toBeVisible();
    await helpSheet(page).getByRole("button", { name: "Close" }).click();
    await expect(helpSheet(page)).toBeHidden();
    await expect(page.locator(".section.is-active")).toContainText(
      "'Twas grace that taught my heart to fear",
    );
  });

  test("leaves room for the section toolbar at 1024px", async ({
    page,
  }, testInfo) => {
    test.skip(isPhone(testInfo), "Needs a mouse");
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.locator(".ProseMirror .line").nth(4).click();
    const toolbar = page.getByRole("toolbar", { name: "Section" });
    await expect(toolbar).toBeVisible();
    await expect(page.locator("[data-section-toolbar]")).not.toHaveAttribute(
      "data-docked",
    );
    const bar = await box(toolbar);
    expect(bar.x + bar.width).toBeLessThanOrEqual(
      (await box(page.locator(".section.is-active"))).x,
    );
    const main = await box(page.getByRole("main"));
    expect((await box(helpPanel(page))).x).toBeGreaterThanOrEqual(
      main.x + main.width,
    );
  });

  test.describe("in forced colors", () => {
    test.use({ forcedColors: "active" });

    test("keeps an outline on the sheet", async ({ page }, testInfo) => {
      if (!isPhone(testInfo))
        await page.setViewportSize({ width: 900, height: 800 });
      await helpButton(page).click();
      await expect(helpSheet(page)).toBeVisible();
      expect(
        await helpSheet(page).evaluate(
          (sheet) => getComputedStyle(sheet).outlineStyle,
        ),
      ).toBe("solid");
    });
  });
});

test.describe("the key", () => {
  // The first chords, as shown.
  async function chords(page: Page, count = 4) {
    return (await page.locator(".chord-label").allTextContents()).slice(
      0,
      count,
    );
  }

  function keyButton(page: Page) {
    return page.getByRole("button", { name: /^Key / });
  }

  function panel(page: Page) {
    return page.getByRole("dialog", { name: "Transpose to" });
  }

  test("sits beside the title", async ({ page }) => {
    await expect(keyButton(page)).toHaveText("Key G");
    const title = await box(page.getByRole("heading", { level: 1 }));
    const key = await box(keyButton(page));
    expect(key.y).toBeLessThan(title.y + title.height);
    expect(key.y + key.height).toBeGreaterThan(title.y);
  });

  test("moves the chords to a picked key, and stays open", async ({ page }) => {
    await keyButton(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(panel(page)).toContainText(
      "The original key, G, is guessed from the chords.",
    );
    await panel(page).getByRole("button", { name: "A", exact: true }).click();
    expect(await chords(page)).toEqual(["A", "A7", "D", "A"]);
    await expect(keyButton(page)).toHaveText("Key A");
    await expect(panel(page)).toBeVisible();
  });

  test("steps by a semitone, spelled in the new key", async ({ page }) => {
    await keyButton(page).click();
    const up = panel(page).getByRole("button", { name: "Up a semitone" });
    await up.click();
    await up.click();
    await expect(keyButton(page)).toHaveText("Key A");
    await up.click();
    await expect(keyButton(page)).toHaveText("Key Bb");
    expect(await chords(page)).toEqual(["Bb", "Bb7", "Eb", "Bb"]);
  });

  test("undoes in the panel with Ctrl Z", async ({ page }) => {
    await keyButton(page).click();
    await panel(page).getByRole("button", { name: "A", exact: true }).click();
    await page.keyboard.press("ControlOrMeta+z");
    await expect(keyButton(page)).toHaveText("Key G");
    expect(await chords(page)).toEqual(["G", "G7", "C", "G"]);
    await expect(panel(page)).toBeVisible();
  });

  test("goes back to the original key, also after reopening", async ({
    page,
  }) => {
    await keyButton(page).click();
    const back = panel(page).getByRole("button", { name: "Back to G" });
    await expect(back).toBeDisabled();
    const up = panel(page).getByRole("button", { name: "Up a semitone" });
    for (let i = 0; i < 3; i++) await up.click();
    await expect(keyButton(page)).toHaveText("Key Bb");
    await expect(panel(page)).toContainText(
      "The original key, G, is guessed from the chords.",
    );
    await page.keyboard.press("Escape");
    await keyButton(page).click();
    await back.click();
    await expect(keyButton(page)).toHaveText("Key G");
    expect(await chords(page)).toEqual(["G", "G7", "C", "G"]);
    await expect(back).toBeDisabled();
  });

  test("slides out on a phone before it closes", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), "The panel is a sheet only on a phone");
    await keyButton(page).click();
    await expect(panel(page)).toBeVisible();
    await slowAnimations(page);
    await page.keyboard.press("Escape");
    await expect(panel(page)).toHaveAttribute("data-closing", "");
    await expect(panel(page)).toBeHidden();
  });

  test("closes with Escape and gives the focus back", async ({ page }) => {
    await keyButton(page).click();
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(keyButton(page)).toBeFocused();
  });

  test("is gone without chords", async ({ page }) => {
    // Ctrl A selects the active section. Each section is emptied in turn.
    // Each step waits for the page, since the editor reads the selection a
    // moment after a key.
    const lines = page.locator(".ProseMirror .line");
    await firstLine(page).click();
    await expect(page.locator(".section-toolbar")).toBeVisible();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");
    await expect(lines).toHaveCount(5);
    // Leaving the empty section removes it.
    await page.keyboard.press("ArrowDown");
    await expect(lines).toHaveCount(4);
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");
    await expect(page.locator(".chord-label")).toHaveCount(0);
    await expect(keyButton(page)).toHaveCount(0);
    await page.keyboard.type("Grace");
    await page.keyboard.press("Home");
    await page.keyboard.press("ControlOrMeta+k");
    await page.keyboard.type("C");
    await page.keyboard.press("Enter");
    await expect(keyButton(page)).toHaveText("Key C");
  });
});

// A click past the end of the text puts the caret at the end of the line.
// End doesn't work on a phone when the docked toolbar is shown and the page
// scrolls.
async function typeAtEnd(page: Page, text: string) {
  const line = firstLine(page);
  const { width, height } = await box(line);
  await line.click({ position: { x: width - 2, y: height / 2 } });
  await page.keyboard.type(text);
}

function homeLink(page: Page) {
  return page.getByRole("banner").getByRole("link", { name: "Sheet Library" });
}

// Plays CSS animations at a tenth of their speed, so a test can see them.
async function slowAnimations(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.1 });
}

function isPhone(testInfo: { project: { name: string } }) {
  return testInfo.project.name === "phone";
}

function helpPanel(page: Page) {
  return page.getByRole("complementary", { name: "How to edit" });
}

function helpButton(page: Page) {
  return page.getByRole("banner").getByRole("button", { name: "How to edit" });
}

function helpSheet(page: Page) {
  return page.getByRole("dialog", { name: "How to edit" });
}

async function box(locator: Locator) {
  const found = await locator.boundingBox();
  if (!found) throw new Error("Not shown");
  return found;
}
